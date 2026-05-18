<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form: ActionData;

	$: secret = $page.url.searchParams.get('secret') ?? '';

	// Deep clone so we can mutate freely
	let gating = structuredClone(data.gating) as {
		plans: Record<string, { label: string; extends?: string }>;
		features: Record<string, { label: string; plans: string[] }>;
		slices: Record<string, {
			plan?: string;
			feature?: string;
			variations?: Record<string, { plan?: string; feature?: string }>;
			fields?: Record<string, { plan?: string; feature?: string }>;
		}>;
	};

	// Active tab
	let activeTab: 'plans' | 'features' | 'slices' = 'plans';

	// Save state
	let saving = false;
	let saveMessage = '';

	// ─── HELPERS ────────────────────────────────────────────────────────────────

	$: planIds = Object.keys(gating.plans);
	$: featureIds = Object.keys(gating.features);

	// All slice names: union of filesystem + gating.json
	$: allSliceNames = [
		...new Set([...data.sliceNames, ...Object.keys(gating.slices)])
	].sort();

	function getGateType(obj: { plan?: string; feature?: string } | undefined): 'none' | 'plan' | 'feature' {
		if (!obj) return 'none';
		if (obj.plan) return 'plan';
		if (obj.feature) return 'feature';
		return 'none';
	}

	function getGateValue(obj: { plan?: string; feature?: string } | undefined): string {
		if (!obj) return '';
		return obj.plan ?? obj.feature ?? '';
	}

	function applyGate(
		obj: { plan?: string; feature?: string },
		type: 'none' | 'plan' | 'feature',
		value: string
	) {
		delete obj.plan;
		delete obj.feature;
		if (type === 'plan' && value) obj.plan = value;
		if (type === 'feature' && value) obj.feature = value;
	}

	// Ensure slice entry exists
	function ensureSlice(name: string) {
		if (!gating.slices[name]) {
			gating.slices[name] = {};
		}
	}

	// ─── PLANS ──────────────────────────────────────────────────────────────────

	let newPlanId = '';
	let newPlanLabel = '';
	let newPlanExtends = '';

	function addPlan() {
		const id = newPlanId.trim();
		const label = newPlanLabel.trim();
		if (!id || !label) return;
		if (gating.plans[id]) { alert('Plan-ID existiert bereits.'); return; }
		gating.plans[id] = { label };
		if (newPlanExtends) gating.plans[id].extends = newPlanExtends;
		gating = gating;
		newPlanId = '';
		newPlanLabel = '';
		newPlanExtends = '';
	}

	function deletePlan(id: string) {
		if (!confirm(`Plan "${id}" wirklich löschen?`)) return;
		delete gating.plans[id];
		// clean up references in features
		for (const f of Object.values(gating.features)) {
			f.plans = f.plans.filter((p) => p !== id);
		}
		gating = gating;
	}

	// ─── FEATURES ───────────────────────────────────────────────────────────────

	let newFeatureId = '';
	let newFeatureLabel = '';

	function addFeature() {
		const id = newFeatureId.trim();
		const label = newFeatureLabel.trim();
		if (!id || !label) return;
		if (gating.features[id]) { alert('Feature-ID existiert bereits.'); return; }
		gating.features[id] = { label, plans: [] };
		gating = gating;
		newFeatureId = '';
		newFeatureLabel = '';
	}

	function deleteFeature(id: string) {
		if (!confirm(`Feature "${id}" wirklich löschen?`)) return;
		delete gating.features[id];
		gating = gating;
	}

	function toggleFeaturePlan(featureId: string, planId: string) {
		const f = gating.features[featureId];
		if (f.plans.includes(planId)) {
			f.plans = f.plans.filter((p) => p !== planId);
		} else {
			f.plans = [...f.plans, planId];
		}
		gating = gating;
	}

	// ─── SLICES ─────────────────────────────────────────────────────────────────

	// Track which slices have their sub-sections expanded
	let expanded: Record<string, boolean> = {};

	function toggleExpand(name: string) {
		expanded[name] = !expanded[name];
		expanded = expanded;
	}

	// Slice-level gate
	function setSliceGateType(name: string, type: 'none' | 'plan' | 'feature') {
		ensureSlice(name);
		const s = gating.slices[name];
		applyGate(s, type, type === 'plan' ? planIds[0] ?? '' : featureIds[0] ?? '');
		gating = gating;
	}

	function setSliceGateValue(name: string, value: string) {
		const s = gating.slices[name];
		if (!s) return;
		if (s.plan !== undefined) s.plan = value;
		if (s.feature !== undefined) s.feature = value;
		gating = gating;
	}

	function sliceGateTypeChanged(name: string, e: Event) {
		const val = (e.target as HTMLSelectElement).value as 'none' | 'plan' | 'feature';
		ensureSlice(name);
		const s = gating.slices[name];
		delete s.plan;
		delete s.feature;
		if (val === 'plan') s.plan = planIds[0] ?? '';
		if (val === 'feature') s.feature = featureIds[0] ?? '';
		gating = gating;
	}

	function sliceGateValueChanged(name: string, e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		const s = gating.slices[name];
		if (!s) return;
		if (s.plan !== undefined) s.plan = val;
		else if (s.feature !== undefined) s.feature = val;
		gating = gating;
	}

	// Variation gate
	function ensureVariation(sliceName: string, varName: string) {
		ensureSlice(sliceName);
		if (!gating.slices[sliceName].variations) gating.slices[sliceName].variations = {};
		if (!gating.slices[sliceName].variations![varName]) {
			gating.slices[sliceName].variations![varName] = {};
		}
	}

	function varGateTypeChanged(sliceName: string, varName: string, e: Event) {
		const val = (e.target as HTMLSelectElement).value as 'none' | 'plan' | 'feature';
		ensureVariation(sliceName, varName);
		const v = gating.slices[sliceName].variations![varName];
		delete v.plan;
		delete v.feature;
		if (val === 'plan') v.plan = planIds[0] ?? '';
		if (val === 'feature') v.feature = featureIds[0] ?? '';
		gating = gating;
	}

	function varGateValueChanged(sliceName: string, varName: string, e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		const v = gating.slices[sliceName]?.variations?.[varName];
		if (!v) return;
		if (v.plan !== undefined) v.plan = val;
		else if (v.feature !== undefined) v.feature = val;
		gating = gating;
	}

	function deleteVariation(sliceName: string, varName: string) {
		if (!confirm(`Variation "${varName}" aus "${sliceName}" entfernen?`)) return;
		delete gating.slices[sliceName].variations![varName];
		if (Object.keys(gating.slices[sliceName].variations!).length === 0) {
			delete gating.slices[sliceName].variations;
		}
		gating = gating;
	}

	let newVarName: Record<string, string> = {};

	function addVariation(sliceName: string) {
		const name = (newVarName[sliceName] ?? '').trim();
		if (!name) return;
		ensureVariation(sliceName, name);
		gating = gating;
		newVarName[sliceName] = '';
		newVarName = newVarName;
		expanded[sliceName] = true;
		expanded = expanded;
	}

	// Field gate
	function ensureField(sliceName: string, fieldName: string) {
		ensureSlice(sliceName);
		if (!gating.slices[sliceName].fields) gating.slices[sliceName].fields = {};
		if (!gating.slices[sliceName].fields![fieldName]) {
			gating.slices[sliceName].fields![fieldName] = {};
		}
	}

	function fieldGateTypeChanged(sliceName: string, fieldName: string, e: Event) {
		const val = (e.target as HTMLSelectElement).value as 'none' | 'plan' | 'feature';
		ensureField(sliceName, fieldName);
		const f = gating.slices[sliceName].fields![fieldName];
		delete f.plan;
		delete f.feature;
		if (val === 'plan') f.plan = planIds[0] ?? '';
		if (val === 'feature') f.feature = featureIds[0] ?? '';
		gating = gating;
	}

	function fieldGateValueChanged(sliceName: string, fieldName: string, e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		const f = gating.slices[sliceName]?.fields?.[fieldName];
		if (!f) return;
		if (f.plan !== undefined) f.plan = val;
		else if (f.feature !== undefined) f.feature = val;
		gating = gating;
	}

	function deleteField(sliceName: string, fieldName: string) {
		if (!confirm(`Feld "${fieldName}" aus "${sliceName}" entfernen?`)) return;
		delete gating.slices[sliceName].fields![fieldName];
		if (Object.keys(gating.slices[sliceName].fields!).length === 0) {
			delete gating.slices[sliceName].fields;
		}
		gating = gating;
	}

	let newFieldName: Record<string, string> = {};

	function addField(sliceName: string) {
		const name = (newFieldName[sliceName] ?? '').trim();
		if (!name) return;
		ensureField(sliceName, name);
		gating = gating;
		newFieldName[sliceName] = '';
		newFieldName = newFieldName;
		expanded[sliceName] = true;
		expanded = expanded;
	}

	// ─── SAVE ───────────────────────────────────────────────────────────────────

	// Clean slices: remove empty entries (no plan, no feature, no variations, no fields)
	function cleanedSlices() {
		const result: typeof gating.slices = {};
		for (const [name, s] of Object.entries(gating.slices)) {
			const hasGate = s.plan || s.feature;
			const hasVars = s.variations && Object.keys(s.variations).length > 0;
			const hasFields = s.fields && Object.keys(s.fields).length > 0;
			if (hasGate || hasVars || hasFields) {
				result[name] = s;
			}
		}
		return result;
	}

	function buildPayload() {
		return JSON.stringify({
			plans: gating.plans,
			features: gating.features,
			slices: cleanedSlices()
		}, null, '\t');
	}

	const tabs: Array<[typeof activeTab, string]> = [['plans', 'Pläne'], ['features', 'Features'], ['slices', 'Slices']];

	function setTab(id: typeof activeTab) {
		activeTab = id;
		saveMessage = '';
	}

	// Styles
	const btn = 'background: #1e2d5a; color: white; border: none; border-radius: 0.375rem; padding: 0.4rem 1rem; font-size: 0.875rem; cursor: pointer;';
	const btnSmall = 'background: #1e2d5a; color: white; border: none; border-radius: 0.25rem; padding: 0.2rem 0.6rem; font-size: 0.75rem; cursor: pointer;';
	const btnDanger = 'background: none; border: none; color: #dc2626; font-size: 0.75rem; cursor: pointer; padding: 0;';
	const input = 'border: 1px solid #d1d5db; border-radius: 0.25rem; padding: 0.3rem 0.5rem; font-size: 0.875rem; font-family: sans-serif;';
	const select = 'border: 1px solid #d1d5db; border-radius: 0.25rem; padding: 0.25rem 0.4rem; font-size: 0.8rem; font-family: sans-serif; background: white;';
	const td = 'padding: 0.5rem 0.75rem; vertical-align: middle;';
	const th = 'padding: 0.5rem 0.75rem; text-align: left; font-weight: 600; font-size: 0.8rem; color: #374151; background: #f9fafb; border-bottom: 2px solid #e5e7eb;';
	const subTd = 'padding: 0.35rem 0.75rem; vertical-align: middle; background: #fafafa;';
	const subTh = 'padding: 0.35rem 0.75rem; text-align: left; font-weight: 500; font-size: 0.75rem; color: #6b7280; background: #f3f4f6; border-bottom: 1px solid #e5e7eb;';
</script>

<svelte:head><title>Gating Editor</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 1100px; margin: 0 auto;">

	<!-- Header -->
	<div style="display: flex; align-items: baseline; gap: 2rem; margin-bottom: 1.5rem;">
		<a href="/admin/dashboard?secret={secret}" style="font-size: 0.875rem; color: #6b7280;">← Dashboard</a>
		<h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">gating.json Editor</h1>
		<span style="font-size: 0.8rem; color: #6b7280;">
			Aktiver Plan: <strong style="color: #1e2d5a;">{data.activePlan}</strong>
			<span style="opacity: 0.6;">(in slicemachine.config.json)</span>
		</span>
	</div>

	{#if form?.success || saveMessage === 'ok'}
		<div style="background: #d1fae5; color: #065f46; border-radius: 0.375rem; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.875rem;">
			Gespeichert. Der Dev-Server liest gating.json beim nächsten Rebuild.
		</div>
	{/if}

	<!-- Save button (top) -->
	<form
		method="POST"
		action="?/save&secret={secret}"
		use:enhance={() => {
			saving = true;
			saveMessage = '';
			return async ({ update }) => {
				await update();
				saving = false;
				saveMessage = 'ok';
			};
		}}
	>
		<input type="hidden" name="gating" value={buildPayload()} />
		<button type="submit" style="{btn} margin-bottom: 1.5rem;" disabled={saving}>
			{saving ? 'Speichern…' : 'gating.json speichern'}
		</button>
	</form>

	<!-- Tabs -->
	<div style="display: flex; gap: 0; margin-bottom: 1.5rem; border-bottom: 2px solid #e5e7eb;">
		{#each tabs as [id, label]}
			<button
				on:click={() => setTab(id)}
				style="
					padding: 0.5rem 1.25rem;
					border: none;
					border-bottom: 2px solid {activeTab === id ? '#1e2d5a' : 'transparent'};
					margin-bottom: -2px;
					background: none;
					font-size: 0.9rem;
					font-weight: {activeTab === id ? '600' : '400'};
					color: {activeTab === id ? '#1e2d5a' : '#6b7280'};
					cursor: pointer;
					font-family: sans-serif;
				"
			>{label}</button>
		{/each}
	</div>

	<!-- ═══════════════════════════════ PLANS ═══════════════════════════════════ -->

	{#if activeTab === 'plans'}
		<div style="overflow-x: auto;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
				<thead>
					<tr>
						<th style={th}>ID</th>
						<th style={th}>Label</th>
						<th style={th}>Extends</th>
						<th style={th}></th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(gating.plans) as [id, plan]}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style="{td} font-family: monospace; color: #1e2d5a;">{id}</td>
							<td style={td}>
								<input
									style={input}
									value={plan.label}
									on:input={(e) => { gating.plans[id].label = (e.target as HTMLInputElement).value; gating = gating; }}
								/>
							</td>
							<td style={td}>
								<select
									style={select}
									value={plan.extends ?? ''}
									on:change={(e) => {
										const val = (e.target as HTMLSelectElement).value;
										if (val) gating.plans[id].extends = val;
										else delete gating.plans[id].extends;
										gating = gating;
									}}
								>
									<option value="">–</option>
									{#each planIds.filter(p => p !== id) as pid}
										<option value={pid}>{pid}</option>
									{/each}
								</select>
							</td>
							<td style={td}>
								<button style={btnDanger} on:click={() => deletePlan(id)}>Löschen</button>
							</td>
						</tr>
					{/each}

					<!-- Add new plan row -->
					<tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
						<td style={td}>
							<input style={input} placeholder="neue-id" bind:value={newPlanId} />
						</td>
						<td style={td}>
							<input style={input} placeholder="Label" bind:value={newPlanLabel} />
						</td>
						<td style={td}>
							<select style={select} bind:value={newPlanExtends}>
								<option value="">–</option>
								{#each planIds as pid}
									<option value={pid}>{pid}</option>
								{/each}
							</select>
						</td>
						<td style={td}>
							<button style={btnSmall} on:click={addPlan}>+ Hinzufügen</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	{/if}

	<!-- ═══════════════════════════════ FEATURES ════════════════════════════════ -->

	{#if activeTab === 'features'}
		<div style="overflow-x: auto;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
				<thead>
					<tr>
						<th style={th}>ID</th>
						<th style={th}>Label</th>
						<th style="{th} min-width: 220px;">Aktiviert durch Pläne</th>
						<th style={th}></th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(gating.features) as [id, feature]}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style="{td} font-family: monospace; color: #1e2d5a;">{id}</td>
							<td style={td}>
								<input
									style={input}
									value={feature.label}
									on:input={(e) => { gating.features[id].label = (e.target as HTMLInputElement).value; gating = gating; }}
								/>
							</td>
							<td style={td}>
								<div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
									{#each planIds as pid}
										<label style="display: flex; align-items: center; gap: 0.3rem; cursor: pointer; font-size: 0.8rem;">
											<input
												type="checkbox"
												checked={feature.plans.includes(pid)}
												on:change={() => toggleFeaturePlan(id, pid)}
											/>
											{pid}
										</label>
									{/each}
								</div>
							</td>
							<td style={td}>
								<button style={btnDanger} on:click={() => deleteFeature(id)}>Löschen</button>
							</td>
						</tr>
					{/each}

					<!-- Add new feature row -->
					<tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
						<td style={td}>
							<input style={input} placeholder="neue_id" bind:value={newFeatureId} />
						</td>
						<td style={td}>
							<input style={input} placeholder="Label" bind:value={newFeatureLabel} />
						</td>
						<td style={td}>
							<span style="font-size: 0.75rem; color: #9ca3af;">Pläne nach dem Erstellen auswählen</span>
						</td>
						<td style={td}>
							<button style={btnSmall} on:click={addFeature}>+ Hinzufügen</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	{/if}

	<!-- ═══════════════════════════════ SLICES ══════════════════════════════════ -->

	{#if activeTab === 'slices'}
		<div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 1rem;">
			{allSliceNames.length} Slices (Filesystem + gating.json vereint). Slices ohne Gate werden beim Speichern nicht in gating.json geschrieben.
		</div>

		<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
			<thead>
				<tr>
					<th style="{th} width: 200px;">Slice</th>
					<th style="{th} width: 120px;">Gate-Typ</th>
					<th style={th}>Gate-Wert</th>
					<th style="{th} width: 90px;">Variationen</th>
					<th style="{th} width: 70px;">Felder</th>
					<th style="{th} width: 60px;"></th>
				</tr>
			</thead>
			<tbody>
				{#each allSliceNames as sliceName}
					{@const s = gating.slices[sliceName]}
					{@const gateType = getGateType(s)}
					{@const gateValue = getGateValue(s)}
					{@const varCount = Object.keys(s?.variations ?? {}).length}
					{@const fieldCount = Object.keys(s?.fields ?? {}).length}
					{@const isExpanded = expanded[sliceName]}

					<!-- Slice row -->
					<tr style="border-bottom: {isExpanded ? '0' : '1px'} solid #e5e7eb; background: white;">
						<td style="{td} font-family: monospace; font-weight: 600; color: #1e2d5a;">
							{sliceName}
						</td>

						<!-- Gate type -->
						<td style={td}>
							<select style={select} value={gateType} on:change={(e) => sliceGateTypeChanged(sliceName, e)}>
								<option value="none">Kein Gate</option>
								<option value="plan">Plan</option>
								<option value="feature">Feature</option>
							</select>
						</td>

						<!-- Gate value -->
						<td style={td}>
							{#if gateType === 'plan'}
								<select style={select} value={gateValue} on:change={(e) => sliceGateValueChanged(sliceName, e)}>
									{#each planIds as pid}
										<option value={pid}>{pid}</option>
									{/each}
								</select>
							{:else if gateType === 'feature'}
								<select style={select} value={gateValue} on:change={(e) => sliceGateValueChanged(sliceName, e)}>
									{#each featureIds as fid}
										<option value={fid}>{fid}</option>
									{/each}
								</select>
							{:else}
								<span style="color: #9ca3af; font-size: 0.75rem;">–</span>
							{/if}
						</td>

						<!-- Expand toggle -->
						<td style="{td} text-align: center;">
							{#if varCount > 0}
								<button
									on:click={() => toggleExpand(sliceName)}
									style="background: none; border: none; cursor: pointer; font-size: 0.75rem; color: #4b5563; padding: 0.2rem 0.5rem; border-radius: 0.25rem; background: #e5e7eb;"
								>
									{varCount} {isExpanded ? '▲' : '▼'}
								</button>
							{:else}
								<span style="color: #9ca3af; font-size: 0.75rem;">–</span>
							{/if}
						</td>

						<td style="{td} text-align: center;">
							{#if fieldCount > 0}
								<button
									on:click={() => toggleExpand(sliceName)}
									style="background: none; border: none; cursor: pointer; font-size: 0.75rem; color: #4b5563; padding: 0.2rem 0.5rem; border-radius: 0.25rem; background: #e5e7eb;"
								>
									{fieldCount} {isExpanded ? '▲' : '▼'}
								</button>
							{:else}
								<span style="color: #9ca3af; font-size: 0.75rem;">–</span>
							{/if}
						</td>

						<td style={td}>
							<button
								on:click={() => toggleExpand(sliceName)}
								style="background: none; border: none; cursor: pointer; font-size: 0.75rem; color: #6b7280;"
								title="Variationen/Felder bearbeiten"
							>
								{isExpanded ? '▲' : '▼'} Edit
							</button>
						</td>
					</tr>

					<!-- Expanded sub-section -->
					{#if isExpanded}
						<tr>
							<td colspan="6" style="padding: 0; border-bottom: 1px solid #e5e7eb;">
								<div style="margin: 0 0 0 1.5rem; border-left: 3px solid #e5e7eb; padding: 0.75rem 1rem;">

									<!-- Variations -->
									<div style="margin-bottom: 0.75rem;">
										<div style="font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.4rem;">Variationen</div>
										{#if Object.keys(s?.variations ?? {}).length > 0}
											<table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 0.5rem;">
												<thead>
													<tr>
														<th style={subTh}>ID</th>
														<th style={subTh}>Gate-Typ</th>
														<th style={subTh}>Gate-Wert</th>
														<th style="{subTh} width: 60px;"></th>
													</tr>
												</thead>
												<tbody>
													{#each Object.entries(s?.variations ?? {}) as [varId, varGate]}
														{@const vType = getGateType(varGate)}
														{@const vValue = getGateValue(varGate)}
														<tr style="border-bottom: 1px solid #e5e7eb;">
															<td style="{subTd} font-family: monospace;">{varId}</td>
															<td style={subTd}>
																<select style={select} value={vType} on:change={(e) => varGateTypeChanged(sliceName, varId, e)}>
																	<option value="none">Kein Gate</option>
																	<option value="plan">Plan</option>
																	<option value="feature">Feature</option>
																</select>
															</td>
															<td style={subTd}>
																{#if vType === 'plan'}
																	<select style={select} value={vValue} on:change={(e) => varGateValueChanged(sliceName, varId, e)}>
																		{#each planIds as pid}
																			<option value={pid}>{pid}</option>
																		{/each}
																	</select>
																{:else if vType === 'feature'}
																	<select style={select} value={vValue} on:change={(e) => varGateValueChanged(sliceName, varId, e)}>
																		{#each featureIds as fid}
																			<option value={fid}>{fid}</option>
																		{/each}
																	</select>
																{:else}
																	<span style="color: #9ca3af;">–</span>
																{/if}
															</td>
															<td style={subTd}>
																<button style={btnDanger} on:click={() => deleteVariation(sliceName, varId)}>Entfernen</button>
															</td>
														</tr>
													{/each}
												</tbody>
											</table>
										{:else}
											<p style="font-size: 0.75rem; color: #9ca3af; margin: 0 0 0.5rem;">Keine Variationen.</p>
										{/if}

										<!-- Add variation -->
										<div style="display: flex; gap: 0.5rem; align-items: center;">
											<input
												style="{input} width: 160px;"
												placeholder="variation-id"
												value={newVarName[sliceName] ?? ''}
												on:input={(e) => { newVarName[sliceName] = (e.target as HTMLInputElement).value; newVarName = newVarName; }}
											/>
											<button style={btnSmall} on:click={() => addVariation(sliceName)}>+ Variation</button>
										</div>
									</div>

									<!-- Fields -->
									<div>
										<div style="font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.4rem;">Felder</div>
										{#if Object.keys(s?.fields ?? {}).length > 0}
											<table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 0.5rem;">
												<thead>
													<tr>
														<th style={subTh}>Feld-ID</th>
														<th style={subTh}>Gate-Typ</th>
														<th style={subTh}>Gate-Wert</th>
														<th style="{subTh} width: 60px;"></th>
													</tr>
												</thead>
												<tbody>
													{#each Object.entries(s?.fields ?? {}) as [fieldId, fieldGate]}
														{@const fType = getGateType(fieldGate)}
														{@const fValue = getGateValue(fieldGate)}
														<tr style="border-bottom: 1px solid #e5e7eb;">
															<td style="{subTd} font-family: monospace;">{fieldId}</td>
															<td style={subTd}>
																<select style={select} value={fType} on:change={(e) => fieldGateTypeChanged(sliceName, fieldId, e)}>
																	<option value="none">Kein Gate</option>
																	<option value="plan">Plan</option>
																	<option value="feature">Feature</option>
																</select>
															</td>
															<td style={subTd}>
																{#if fType === 'plan'}
																	<select style={select} value={fValue} on:change={(e) => fieldGateValueChanged(sliceName, fieldId, e)}>
																		{#each planIds as pid}
																			<option value={pid}>{pid}</option>
																		{/each}
																	</select>
																{:else if fType === 'feature'}
																	<select style={select} value={fValue} on:change={(e) => fieldGateValueChanged(sliceName, fieldId, e)}>
																		{#each featureIds as fid}
																			<option value={fid}>{fid}</option>
																		{/each}
																	</select>
																{:else}
																	<span style="color: #9ca3af;">–</span>
																{/if}
															</td>
															<td style={subTd}>
																<button style={btnDanger} on:click={() => deleteField(sliceName, fieldId)}>Entfernen</button>
															</td>
														</tr>
													{/each}
												</tbody>
											</table>
										{:else}
											<p style="font-size: 0.75rem; color: #9ca3af; margin: 0 0 0.5rem;">Keine Felder.</p>
										{/if}

										<!-- Add field -->
										<div style="display: flex; gap: 0.5rem; align-items: center;">
											<input
												style="{input} width: 160px;"
												placeholder="feld_id"
												value={newFieldName[sliceName] ?? ''}
												on:input={(e) => { newFieldName[sliceName] = (e.target as HTMLInputElement).value; newFieldName = newFieldName; }}
											/>
											<button style={btnSmall} on:click={() => addField(sliceName)}>+ Feld</button>
										</div>
									</div>

								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	{/if}

	<!-- Save button (bottom) -->
	<div style="margin-top: 2rem;">
		<form
			method="POST"
			action="?/save&secret={secret}"
			use:enhance={() => {
				saving = true;
				saveMessage = '';
				return async ({ update }) => {
					await update();
					saving = false;
					saveMessage = 'ok';
					window.scrollTo({ top: 0, behavior: 'smooth' });
				};
			}}
		>
			<input type="hidden" name="gating" value={buildPayload()} />
			<button type="submit" style={btn} disabled={saving}>
				{saving ? 'Speichern…' : 'gating.json speichern'}
			</button>
		</form>
	</div>

</div>
