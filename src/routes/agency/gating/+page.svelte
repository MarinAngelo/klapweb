<script lang="ts">
	import type { PageData } from './$types';
	import { _ } from '$lib/stores/i18n';

	export let data: PageData;

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

	let selectedPlan = data.authenticated ? data.currentPlan : '';
	let selectedFeatures: string[] = data.authenticated ? [...data.activeFeatures] : [];
	let disabledSections: string[] = data.authenticated
		? [...(data.adminSectionsDisabled ?? [])]
		: [];
	let passwordInput = '';
	let loginError = '';
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

	function getAllAdminSections() {
		if (!data.authenticated) return [];
		return Object.entries(data.adminSections ?? {}).map(([id, s]: [string, any]) => ({
			id,
			label: s.label
		}));
	}

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

<div class="container">
	{#if !data.authenticated}
		<!-- Login Form -->
		<div class="login-container">
			<h1>{$_('Agency Gating Editor')}</h1>
			<p class="intro">{$_('Bitte geben Sie das Agentur-Passwort ein:')}</p>

			<form method="POST" action="?/login" class="login-form">
				<div class="form-group">
					<label for="secret">{$_('Passwort')}</label>
					<input
						id="secret"
						name="secret"
						type="password"
						bind:value={passwordInput}
						placeholder={$_('Passwort eingeben')}
						required
					/>
				</div>

				{#if loginError}
					<div class="error-message">{loginError}</div>
				{/if}

				<button type="submit" class="btn btn-primary">{$_('Anmelden')}</button>
			</form>
		</div>
	{:else}
		<!-- Editor -->
		<div class="editor-container">
			<div class="header">
				<h1>{$_('Agency Gating Editor')}</h1>
				<form method="POST" action="?/logout" style="display: inline;">
					<button type="submit" class="btn btn-secondary">{$_('Abmelden')}</button>
				</form>
			</div>

			<form method="POST" action="?/save" on:submit={handleSave} class="form">
				<div class="form-group">
					<label for="plan">{$_('Plan')}</label>
					<select id="plan" name="plan" bind:value={selectedPlan}>
						{#each getPlans() as { id, label }}
							<option value={id}>
								{label}
							</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<fieldset>
						<legend>{$_('Features')}</legend>
						{#each allFeatures as { id, label, inPlan }}
							<label class="checkbox-label">
								<input
									type="checkbox"
									checked={selectedFeatures.includes(id)}
									on:change={() => toggleFeature(id)}
								/>
								<span>
									{label}
									{#if inPlan}
										<span class="badge">{$_('im Plan')}</span>
									{/if}
									{#if getMissingEnv(id).length > 0}
										<span
											class="badge badge-warning"
											title="{$_('Fehlende Umgebungsvariablen')}: {getMissingEnv(id).join(', ')}"
										>
											⚠ Env
										</span>
									{/if}
								</span>
							</label>
						{/each}
					</fieldset>
				</div>

				<input type="hidden" name="overrides" value={JSON.stringify(selectedFeatures)} />
				<input
					type="hidden"
					name="admin_sections_disabled"
					value={JSON.stringify(disabledSections)}
				/>

				<div class="form-group">
					<fieldset>
						<legend>{$_('Admin-Bereiche')}</legend>
						{#each getAllAdminSections() as { id, label }}
							<label class="checkbox-label">
								<input
									type="checkbox"
									checked={!disabledSections.includes(id)}
									on:change={() => toggleSection(id)}
								/>
								<span>{label}</span>
							</label>
						{/each}
					</fieldset>
				</div>

				<button type="submit" class="btn btn-primary">{$_('Speichern')}</button>
			</form>

			<div class="info">
				<strong>{$_('Übersicht')}:</strong>
				<p>{$_('Plan')}: {getPlans().find((p) => p.id === selectedPlan)?.label}</p>
				<p>{$_('Plan-Features')}: {planFeatures.join(', ') || $_('keine')}</p>
				<p>
					<strong>{$_('Ausgewählte Features')}:</strong>
					{selectedFeatures.join(', ') || $_('keine')}
				</p>
				<p style="color: #666; font-size: 0.9rem;">
					{$_('Zusätzlich')}: {selectedFeatures
						.filter((f) => !planFeatures.includes(f))
						.join(', ') || $_('keine')} / {$_('Entfernt')}: {planFeatures
						.filter((f) => !selectedFeatures.includes(f))
						.join(', ') || $_('keine')}
				</p>
			</div>

			{#if data.canEditDefinition}
				<form method="POST" action="?/savePlanDefinition" class="form definition">
					<input type="hidden" name="feature_plans" value={JSON.stringify(changedFeaturePlans)} />
					<fieldset>
						<legend>{$_('Plan-Definition (global)')}</legend>
						<p class="definition-warning">
							⚠ {$_(
								'Ändert gating.json – gilt nach Commit und Merge für alle Branches bzw. Kunden, nicht nur für dieses Projekt.'
							)}
						</p>
						{#each allFeatures as { id, label }}
							<div class="definition-row">
								<label for="def-{id}">
									{label}
									{#if getFeaturePlanList(id).length > 1}
										<span class="badge" title={getFeaturePlanList(id).join(', ')}
											>{$_('Mehrere Pläne')}</span
										>
									{/if}
								</label>
								<select id="def-{id}" bind:value={featurePlans[id]}>
									{#each getPlans() as plan}
										<option value={plan.id}>{$_('ab')} {plan.label}</option>
									{/each}
								</select>
							</div>
						{/each}
					</fieldset>
					<button type="submit" class="btn btn-primary" disabled={!definitionChanged}>
						{$_('Plan-Definition speichern')}
					</button>
				</form>
			{/if}

			{#if (data.missingEnv?.length ?? 0) > 0}
				<button type="button" class="env-warning-bar" on:click={() => (showEnvWarning = true)}>
					⚠ {data.missingEnv?.length}
					{data.missingEnv?.length === 1
						? $_('aktives Feature mit fehlenden Umgebungsvariablen')
						: $_('aktive Features mit fehlenden Umgebungsvariablen')}
					— {$_('Details anzeigen')}
				</button>
			{/if}
		</div>
	{/if}
</div>

{#if showEnvWarning && data.authenticated}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="modal-backdrop" on:click={() => (showEnvWarning = false)}>
		<div class="modal" role="dialog" aria-modal="true" on:click|stopPropagation>
			<h2>⚠ {$_('Fehlende Umgebungsvariablen')}</h2>
			<p class="modal-intro">
				{$_(
					'Für folgende aktive Features sind benötigte Umgebungsvariablen nicht gesetzt. Die betroffenen Funktionen (z.B. E-Mail-Versand, Datenbankzugriff) werden nicht funktionieren.'
				)}
			</p>

			{#each data.missingEnv ?? [] as entry}
				<div class="modal-feature">
					<strong>{entry.label}</strong>
					<ul>
						{#each entry.missing as name}
							<li><code>{name}</code></li>
						{/each}
					</ul>
				</div>
			{/each}

			<p class="modal-hint">
				<strong>{$_('Setzen')}:</strong>
				{$_('Lokal in der Datei')} <code>.env</code>, {$_('auf Netlify unter')}
				<strong>Site Settings → Environment variables</strong>. {$_(
					'Hinweis: Einzelne Variablen (z.B. EMAIL_FROM_ADDRESS) haben CMS-Fallbacks – ohne sie greifen die Fallbacks bzw. der Versand entfällt.'
				)}
			</p>

			<button type="button" class="btn btn-primary" on:click={() => (showEnvWarning = false)}>
				{$_('Verstanden')}
			</button>
		</div>
	</div>
{/if}

<style>
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
	}

	.login-container {
		text-align: center;
	}

	.login-container h1 {
		margin-bottom: 1rem;
	}

	.intro {
		color: #666;
		margin-bottom: 2rem;
	}

	.login-form {
		background: #f9f9f9;
		padding: 2rem;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}

	.editor-container .header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e0e0e0;
	}

	.editor-container h1 {
		margin: 0;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 600;
		font-size: 0.95rem;
	}

	input[type='password'],
	select {
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
	}

	input[type='password']:focus,
	select:focus {
		outline: none;
		border-color: #333;
		box-shadow: 0 0 0 2px rgba(51, 51, 51, 0.1);
	}

	fieldset {
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		padding: 1rem;
		margin: 0;
	}

	legend {
		padding: 0 0.5rem;
		font-weight: 600;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0.5rem 0;
		cursor: pointer;
	}

	.checkbox-label input[type='checkbox'] {
		cursor: pointer;
	}

	.text-muted {
		color: #666;
		font-style: italic;
		margin: 0;
	}

	.error-message {
		background: #fee;
		color: #c33;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.95rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: background-color 0.2s;
		font-family: inherit;
	}

	.btn-primary {
		background-color: #333;
		color: white;
	}

	.btn-primary:hover {
		background-color: #555;
	}

	.btn-secondary {
		background-color: #999;
		color: white;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
	}

	.btn-secondary:hover {
		background-color: #777;
	}

	.info {
		margin-top: 2rem;
		padding: 1rem;
		background-color: #f5f5f5;
		border-radius: 4px;
	}

	.info p {
		margin: 0.5rem 0;
	}

	.badge {
		display: inline-block;
		background-color: #ddd;
		color: #333;
		padding: 0.2rem 0.5rem;
		border-radius: 3px;
		font-size: 0.8rem;
		margin-left: 0.5rem;
		font-weight: normal;
	}

	.checkbox-label span {
		display: flex;
		align-items: center;
	}

	.badge-warning {
		background: #fff3cd;
		color: #856404;
	}

	.definition {
		margin-top: 2rem;
		gap: 1rem;
	}

	.definition-warning {
		background: #fff3cd;
		color: #856404;
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		font-size: 0.9rem;
		margin: 0 0 1rem;
	}

	.definition-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin: 0.5rem 0;
	}

	.definition-row label {
		display: flex;
		align-items: center;
	}

	.definition-row select {
		padding: 0.4rem 0.5rem;
		font-size: 0.9rem;
	}

	.btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.env-warning-bar {
		width: 100%;
		padding: 0.75rem 1rem;
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffeeba;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.95rem;
		font-family: inherit;
		text-align: left;
	}

	.env-warning-bar:hover {
		background: #ffeeba;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal {
		background: #fff;
		border-radius: 8px;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
	}

	.modal h2 {
		margin: 0 0 1rem;
		font-size: 1.25rem;
	}

	.modal-intro {
		color: #666;
		margin-bottom: 1.5rem;
	}

	.modal-feature {
		background: #fff3cd;
		border: 1px solid #ffeeba;
		border-radius: 4px;
		padding: 0.75rem 1rem;
		margin-bottom: 0.75rem;
	}

	.modal-feature ul {
		margin: 0.5rem 0 0;
		padding-left: 1.25rem;
	}

	.modal-feature code,
	.modal-hint code {
		background: rgba(0, 0, 0, 0.08);
		padding: 0.1rem 0.35rem;
		border-radius: 3px;
		font-size: 0.85rem;
	}

	.modal-hint {
		color: #666;
		font-size: 0.9rem;
		margin: 1.5rem 0;
	}

	.info p {
		margin: 0.5rem 0;
	}
</style>
