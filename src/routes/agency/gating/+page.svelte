<script lang="ts">
	import LoginCard from '$lib/components/auth/LoginCard.svelte';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import RememberMe from '$lib/components/auth/RememberMe.svelte';
	import CancelLogin from '$lib/components/auth/CancelLogin.svelte';
	import type { ActionData, PageData } from './$types';
	import { _ } from '$lib/stores/i18n';

	export let data: PageData;
	export let form: ActionData;

	type FeatureDef = { label: string; plans?: string[]; env?: string[] };
	type PlanDef = { label: string; extends?: string };
	const featureDefs: Record<string, FeatureDef> = data.authenticated
		? ((data.features ?? {}) as Record<string, FeatureDef>)
		: {};
	const planDefs: Record<string, PlanDef> = data.authenticated
		? ((data.plans ?? {}) as Record<string, PlanDef>)
		: {};

	// Global plan definition (gating.json): minimum plan per feature
	const initialFeaturePlans: Record<string, string> = Object.fromEntries(
		Object.entries(featureDefs).map(([id, def]) => [id, def.plans?.[0] ?? ''])
	);
	let featurePlans: Record<string, string> = { ...initialFeaturePlans };
	$: changedFeaturePlans = Object.fromEntries(
		Object.entries(featurePlans).filter(([id, plan]) => plan !== initialFeaturePlans[id])
	);
	$: definitionChanged = Object.keys(changedFeaturePlans).length > 0;

	function getFeaturePlanList(featureId: string): string[] {
		return featureDefs[featureId]?.plans ?? [];
	}

	// Overview of the whole gating.json
	type ItemKind =
		| 'customType'
		| 'customTypeField'
		| 'slice'
		| 'variation'
		| 'field'
		| 'overlay'
		| 'adminSection';
	type GatingItem = {
		kind: ItemKind;
		target: string;
		detail?: string;
		gate: { feature?: string; plan?: string };
	};
	const gatingItems: GatingItem[] = data.authenticated
		? ((data.gatingItems ?? []) as GatingItem[])
		: [];
	const kindOrder: ItemKind[] = [
		'customType',
		'customTypeField',
		'overlay',
		'slice',
		'variation',
		'field',
		'adminSection'
	];
	const kindLabels: Record<ItemKind, string> = {
		customType: 'Custom Types',
		customTypeField: 'Custom-Type-Felder',
		overlay: 'Tab-Overlays',
		slice: 'Slices',
		variation: 'Slice-Variationen',
		field: 'Slice-Felder',
		adminSection: 'Admin-Bereiche'
	};
	const planOrder = Object.keys(planDefs);

	function groupByKind(items: GatingItem[]) {
		return kindOrder
			.map((kind) => ({ kind, items: items.filter((item) => item.kind === kind) }))
			.filter((group) => group.items.length > 0);
	}

	function minPlanIndex(featureId: string): number {
		const indices = (featureDefs[featureId]?.plans ?? []).map((p) => planOrder.indexOf(p));
		return indices.length ? Math.min(...indices.map((i) => (i < 0 ? 999 : i))) : 999;
	}

	const featureOverview = Object.keys(featureDefs)
		.sort((a, b) => minPlanIndex(a) - minPlanIndex(b))
		.map((id) => ({
			id,
			label: featureDefs[id].label,
			plans: (featureDefs[id].plans ?? []).map((p) => planDefs[p]?.label ?? p),
			env: featureDefs[id].env ?? [],
			groups: groupByKind(gatingItems.filter((item) => item.gate.feature === id))
		}));

	const planOverview = planOrder
		.map((id) => ({
			id,
			label: planDefs[id].label,
			groups: groupByKind(gatingItems.filter((item) => item.gate.plan === id))
		}))
		.filter((plan) => plan.groups.length > 0);

	// Gates referencing a feature/plan that does not exist in gating.json (typos)
	const unknownGateItems = gatingItems.filter(
		(item) =>
			(item.gate.feature && !featureDefs[item.gate.feature]) ||
			(item.gate.plan && !planDefs[item.gate.plan])
	);

	let selectedPlan = data.authenticated ? data.currentPlan : '';
	let selectedFeatures: string[] = data.authenticated ? [...data.activeFeatures] : [];
	let disabledSections: string[] = data.authenticated
		? [...(data.adminSectionsDisabled ?? [])]
		: [];
	let passwordInput = '';
	// Error key returned by the login action (translated in the template)
	$: loginError = (form as { error?: string } | null)?.error ?? '';
	let showEnvWarning = data.authenticated && (data.missingEnv?.length ?? 0) > 0;

	function getMissingEnv(featureId: string): string[] {
		if (!data.authenticated) return [];
		return data.missingEnv?.find((e) => e.featureId === featureId)?.missing ?? [];
	}

	function getPlans() {
		if (!data.authenticated) return [];
		return Object.entries(data.plans ?? {}).map(([id, plan]: [string, any]) => ({
			id,
			label: plan.label
		}));
	}

	function getPlanChain(planKey: string): string[] {
		const chain: string[] = [];
		let key: string | undefined = planKey;
		while (key && !chain.includes(key)) {
			chain.push(key);
			key = planDefs[key]?.extends;
		}
		return chain;
	}

	// Features included in the currently selected (not yet saved) plan
	$: selectedPlanChain = getPlanChain(selectedPlan);
	$: planFeatures = Object.entries(featureDefs)
		.filter(([, def]) => (def.plans ?? []).some((p) => selectedPlanChain.includes(p)))
		.map(([id]) => id);

	$: allFeatures = Object.entries(featureDefs).map(([id, feature]) => ({
		id,
		label: feature.label,
		inPlan: planFeatures.includes(id)
	}));

	function toggleFeature(featureId: string) {
		if (selectedFeatures.includes(featureId)) {
			selectedFeatures = selectedFeatures.filter((f) => f !== featureId);
		} else {
			selectedFeatures = [...selectedFeatures, featureId];
		}
	}

	function toggleSection(id: string) {
		if (disabledSections.includes(id)) {
			disabledSections = disabledSections.filter((s) => s !== id);
		} else {
			disabledSections = [...disabledSections, id];
		}
	}

	type AdminSectionDef = { label: string; plan?: string; feature?: string; features?: string[] };
	const adminSectionDefs: Record<string, AdminSectionDef> = data.authenticated
		? ((data.adminSections ?? {}) as Record<string, AdminSectionDef>)
		: {};

	// Plan/feature gate from gating.json, evaluated against the current (unsaved) selection
	$: adminSectionList = Object.entries(adminSectionDefs).map(([id, def]) => ({
		id,
		label: def.label,
		gateLabel: [
			def.plan ? `${$_('ab')} ${planDefs[def.plan]?.label ?? def.plan}` : '',
			def.feature ? (featureDefs[def.feature]?.label ?? def.feature) : '',
			(def.features ?? []).map((f) => featureDefs[f]?.label ?? f).join(` ${$_('oder')} `)
		]
			.filter(Boolean)
			.join(' + '),
		gateActive:
			(!def.plan || selectedPlanChain.includes(def.plan)) &&
			(!def.feature || selectedFeatures.includes(def.feature)) &&
			(!def.features?.length || def.features.some((f) => selectedFeatures.includes(f)))
	}));

	function handleSave(e: Event) {
		const form = e.currentTarget as HTMLFormElement;
		const overridesInput = form.querySelector('input[name="overrides"]') as HTMLInputElement;
		if (overridesInput) {
			overridesInput.value = JSON.stringify(selectedFeatures);
		}
		const sectionsInput = form.querySelector(
			'input[name="admin_sections_disabled"]'
		) as HTMLInputElement;
		if (sectionsInput) {
			sectionsInput.value = JSON.stringify(disabledSections);
		}
	}
</script>

{#if !data.authenticated}
	<!-- Login in the look of the site (same as /admin) -->
	<LoginCard title={$_('Agency Gating Editor')} action="?/login">
		<p class="m-0 text-sm">{$_('Bitte geben Sie das Agentur-Passwort ein:')}</p>
		<input
			id="secret"
			name="secret"
			type="password"
			bind:value={passwordInput}
			aria-label={$_('Passwort')}
			placeholder={$_('Passwort eingeben')}
			autocomplete="current-password"
			required
			class="form-input"
		/>
		<RememberMe />
		{#if loginError}
			<p role="alert" class="m-0 text-sm text-red-600">{$_(loginError)}</p>
		{/if}
		<button type="submit" class="btn-solid rounded px-6 py-2 text-sm font-medium">
			{$_('Anmelden')}
		</button>
		<CancelLogin />
	</LoginCard>
{:else}
	<!-- Editor: neutral admin UI (app.css › Admin-UI), like /admin -->
	<div class="admin">
		<div class="admin-container">
			<AdminHeader title={$_('Agency Gating Editor')} back={false}>
				<a href="/agency/feldreferenz" class="admin-btn">{$_('Feldreferenz – Beschreibungen')}</a>
				<form method="POST" action="?/logout">
					<button type="submit" class="admin-btn">{$_('Abmelden')}</button>
				</form>
			</AdminHeader>

			{#if (data.missingEnv?.length ?? 0) > 0}
				<button
					type="button"
					class="admin-notice admin-notice-warn w-full cursor-pointer text-left"
					on:click={() => (showEnvWarning = true)}
				>
					⚠ {data.missingEnv?.length}
					{data.missingEnv?.length === 1
						? $_('aktives Feature mit fehlenden Umgebungsvariablen')
						: $_('aktive Features mit fehlenden Umgebungsvariablen')}
					— {$_('Details anzeigen')}
				</button>
			{/if}

			<form method="POST" action="?/save" on:submit={handleSave} class="admin-card">
				<div class="mb-4">
					<label for="plan" class="admin-label">{$_('Plan')}</label>
					<select id="plan" name="plan" bind:value={selectedPlan} class="admin-input">
						{#each getPlans() as { id, label }}
							<option value={id}>{label}</option>
						{/each}
					</select>
				</div>

				<fieldset class="admin-fieldset">
					<legend>{$_('Features')}</legend>
					<div class="grid gap-2 sm:grid-cols-2">
						{#each allFeatures as { id, label, inPlan }}
							<label class="flex cursor-pointer items-center gap-2 text-sm">
								<input
									type="checkbox"
									class="admin-checkbox"
									checked={selectedFeatures.includes(id)}
									on:change={() => toggleFeature(id)}
								/>
								<span>
									{label}
									{#if inPlan}
										<span class="admin-badge admin-badge-blue">{$_('im Plan')}</span>
									{/if}
									{#if getMissingEnv(id).length > 0}
										<span
											class="admin-badge admin-badge-yellow"
											title="{$_('Fehlende Umgebungsvariablen')}: {getMissingEnv(id).join(', ')}"
										>
											⚠ Env
										</span>
									{/if}
								</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<input type="hidden" name="overrides" value={JSON.stringify(selectedFeatures)} />
				<input
					type="hidden"
					name="admin_sections_disabled"
					value={JSON.stringify(disabledSections)}
				/>

				<fieldset class="admin-fieldset">
					<legend>{$_('Admin-Bereiche')}</legend>
					<div class="grid gap-2 sm:grid-cols-2">
						{#each adminSectionList as section}
							<label
								class="flex cursor-pointer items-center gap-2 text-sm"
								class:admin-muted={!section.gateActive}
							>
								<input
									type="checkbox"
									class="admin-checkbox"
									checked={section.gateActive && !disabledSections.includes(section.id)}
									disabled={!section.gateActive}
									on:change={() => toggleSection(section.id)}
								/>
								<span>
									{section.label}
									{#if section.gateLabel}
										<span class="admin-badge" title={$_('Gate in gating.json')}
											>{section.gateLabel}</span
										>
									{/if}
								</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<button type="submit" class="admin-btn admin-btn-primary">{$_('Speichern')}</button>
			</form>

			<div class="admin-notice">
				<p><strong>{$_('Übersicht')}</strong></p>
				<p>{$_('Plan')}: {getPlans().find((p) => p.id === selectedPlan)?.label}</p>
				<p>{$_('Plan-Features')}: {planFeatures.join(', ') || $_('keine')}</p>
				<p>
					<strong>{$_('Ausgewählte Features')}:</strong>
					{selectedFeatures.join(', ') || $_('keine')}
				</p>
				<p class="admin-muted text-sm">
					{$_('Zusätzlich')}: {selectedFeatures
						.filter((f) => !planFeatures.includes(f))
						.join(', ') || $_('keine')} / {$_('Entfernt')}: {planFeatures
						.filter((f) => !selectedFeatures.includes(f))
						.join(', ') || $_('keine')}
				</p>
			</div>

			{#if data.canEditDefinition}
				<form method="POST" action="?/savePlanDefinition" class="admin-card">
					<input type="hidden" name="feature_plans" value={JSON.stringify(changedFeaturePlans)} />
					<h2 class="admin-card-title">{$_('Plan-Definition (global)')}</h2>
					<p class="admin-notice admin-notice-warn">
						⚠ {$_(
							'Ändert gating.json – gilt nach Commit und Merge für alle Branches bzw. Kunden, nicht nur für dieses Projekt.'
						)}
					</p>
					<div class="mb-4 flex flex-col">
						{#each allFeatures as { id, label }}
							<div
								class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 py-2"
							>
								<label for="def-{id}" class="text-sm">
									{label}
									{#if getFeaturePlanList(id).length > 1}
										<span class="admin-badge" title={getFeaturePlanList(id).join(', ')}
											>{$_('Mehrere Pläne')}</span
										>
									{/if}
								</label>
								<select
									id="def-{id}"
									bind:value={featurePlans[id]}
									class="admin-input admin-input-sm w-auto"
								>
									{#each getPlans() as plan}
										<option value={plan.id}>{$_('ab')} {plan.label}</option>
									{/each}
								</select>
							</div>
						{/each}
					</div>
					<button type="submit" class="admin-btn admin-btn-primary" disabled={!definitionChanged}>
						{$_('Plan-Definition speichern')}
					</button>
				</form>
			{/if}

			<section class="admin-card">
				<h2 class="admin-card-title">{$_('Gating-Übersicht')}</h2>
				<p class="admin-intro">
					{$_(
						'Alle Einträge aus gating.json: welche Custom Types, Slices, Variationen und Felder zu welchem Feature bzw. Plan gehören. Abgeblendet = mit der aktuellen Auswahl inaktiv.'
					)}
				</p>

				{#if unknownGateItems.length > 0}
					<div class="admin-notice admin-notice-error">
						<strong>⚠ {$_('Unbekannte Features oder Pläne referenziert')}:</strong>
						<ul class="mt-1 list-disc pl-5">
							{#each unknownGateItems as item}
								<li>
									<code class="admin-mono"
										>{item.target}{item.detail ? ` → ${item.detail}` : ''}</code
									>
									({item.gate.feature ?? item.gate.plan})
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<h3 class="mb-3 mt-4">{$_('Nach Feature')}</h3>
				{#each featureOverview as feature}
					<div
						class="mb-3 rounded-md border border-gray-200 p-3"
						class:opacity-50={!selectedFeatures.includes(feature.id)}
					>
						<div class="mb-2 flex flex-wrap items-center gap-2">
							<strong>{feature.label}</strong>
							<code class="admin-mono admin-muted">{feature.id}</code>
							{#each feature.plans as plan}
								<span class="admin-badge">{$_('ab')} {plan}</span>
							{/each}
						</div>
						{#if feature.env.length}
							<div class="admin-muted mb-2 text-xs">Env: {feature.env.join(', ')}</div>
						{/if}
						{#if feature.groups.length}
							{#each feature.groups as group}
								<div class="mb-1 flex flex-wrap items-baseline gap-2 text-sm">
									<span class="admin-muted w-28 shrink-0 text-xs">{$_(kindLabels[group.kind])}</span
									>
									<div class="flex flex-wrap gap-1">
										{#each group.items as item}
											<code class="admin-mono rounded bg-gray-100 px-1.5 py-0.5"
												>{item.target}{item.detail ? ` → ${item.detail}` : ''}</code
											>
										{/each}
									</div>
								</div>
							{/each}
						{:else}
							<div class="admin-muted text-xs">
								{$_('Keine Zuordnung in gating.json (nur im Code abgefragt)')}
							</div>
						{/if}
					</div>
				{/each}

				{#if planOverview.length}
					<h3 class="mb-3 mt-6">{$_('Nach Plan (ohne Feature)')}</h3>
					{#each planOverview as plan}
						<div
							class="mb-3 rounded-md border border-gray-200 p-3"
							class:opacity-50={!selectedPlanChain.includes(plan.id)}
						>
							<div class="mb-2 flex flex-wrap items-center gap-2">
								<strong>{$_('ab')} {plan.label}</strong>
								<code class="admin-mono admin-muted">{plan.id}</code>
							</div>
							{#each plan.groups as group}
								<div class="mb-1 flex flex-wrap items-baseline gap-2 text-sm">
									<span class="admin-muted w-28 shrink-0 text-xs">{$_(kindLabels[group.kind])}</span
									>
									<div class="flex flex-wrap gap-1">
										{#each group.items as item}
											<code class="admin-mono rounded bg-gray-100 px-1.5 py-0.5"
												>{item.target}{item.detail ? ` → ${item.detail}` : ''}</code
											>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{/each}
				{/if}
			</section>
		</div>
	</div>
{/if}

{#if showEnvWarning && data.authenticated}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="admin admin-modal-backdrop min-h-0" on:click={() => (showEnvWarning = false)}>
		<div class="admin-modal" role="dialog" aria-modal="true" on:click|stopPropagation>
			<h2 class="mb-3">⚠ {$_('Fehlende Umgebungsvariablen')}</h2>
			<p class="admin-intro">
				{$_(
					'Für folgende aktive Features sind benötigte Umgebungsvariablen nicht gesetzt. Die betroffenen Funktionen (z.B. E-Mail-Versand, Datenbankzugriff) werden nicht funktionieren.'
				)}
			</p>

			{#each data.missingEnv ?? [] as entry}
				<div class="mb-3">
					<strong>{entry.label}</strong>
					<ul class="mt-1 list-disc pl-5">
						{#each entry.missing as name}
							<li><code class="admin-mono">{name}</code></li>
						{/each}
					</ul>
				</div>
			{/each}

			<p class="admin-hint mb-4">
				<strong>{$_('Setzen')}:</strong>
				{$_('Lokal in der Datei')} <code class="admin-mono">.env</code>, {$_('auf Netlify unter')}
				<strong>Site Settings → Environment variables</strong>. {$_(
					'Hinweis: Einzelne Variablen (z.B. EMAIL_FROM_ADDRESS) haben CMS-Fallbacks – ohne sie greifen die Fallbacks bzw. der Versand entfällt.'
				)}
			</p>

			<button
				type="button"
				class="admin-btn admin-btn-primary"
				on:click={() => (showEnvWarning = false)}
			>
				{$_('Verstanden')}
			</button>
		</div>
	</div>
{/if}
