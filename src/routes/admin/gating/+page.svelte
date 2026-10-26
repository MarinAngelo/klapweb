<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form: ActionData;

	// Deep clone so we can mutate freely
	let gating = structuredClone(data.gating) as {
		plans: Record<string, { label: string; extends?: string }>;
		features: Record<string, { label: string; plans: string[] }>;
		slices: Record<
			string,
			{
				plan?: string;
				feature?: string;
				variations?: Record<string, { plan?: string; feature?: string }>;
				fields?: Record<string, { plan?: string; feature?: string }>;
			}
		>;
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
	$: allSliceNames = [...new Set([...data.sliceNames, ...Object.keys(gating.slices)])].sort();

	function getGateType(
		obj: { plan?: string; feature?: string } | undefined
	): 'none' | 'plan' | 'feature' {
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
		if (gating.plans[id]) {
			alert('Plan-ID existiert bereits.');
			return;
		}
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
		if (gating.features[id]) {
			alert('Feature-ID existiert bereits.');
			return;
		}
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
		applyGate(s, type, type === 'plan' ? (planIds[0] ?? '') : (featureIds[0] ?? ''));
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
		return JSON.stringify(
			{
				plans: gating.plans,
				features: gating.features,
				slices: cleanedSlices()
			},
			null,
			'\t'
		);
	}

	const tabs: Array<[typeof activeTab, string]> = [
		['plans', 'Pläne'],
		['features', 'Features'],
		['slices', 'Slices']
	];

	function setPlanLabel(id: string, e: Event) {
		gating.plans[id].label = (e.target as HTMLInputElement).value;
		gating = gating;
	}
	function setPlanExtends(id: string, e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		if (val) gating.plans[id].extends = val;
		else delete gating.plans[id].extends;
		gating = gating;
	}
	function setFeatureLabel(id: string, e: Event) {
		gating.features[id].label = (e.target as HTMLInputElement).value;
		gating = gating;
	}
	function setNewVarName(sliceName: string, e: Event) {
		newVarName[sliceName] = (e.target as HTMLInputElement).value;
		newVarName = newVarName;
	}
	function setNewFieldName(sliceName: string, e: Event) {
		newFieldName[sliceName] = (e.target as HTMLInputElement).value;
		newFieldName = newFieldName;
	}

	function setTab(id: typeof activeTab) {
		activeTab = id;
		saveMessage = '';
	}
</script>

<svelte:head><title>Gating Editor</title></svelte:head>

<div class="admin-container">
	<AdminHeader title="gating.json Editor" />
	<p class="admin-intro">
		Aktiver Plan: <strong class="text-gray-900">{data.activePlan}</strong>
		(in slicemachine.config.json)
	</p>

	{#if form?.success || saveMessage === 'ok'}
		<p class="admin-notice admin-notice-ok">
			Gespeichert. Der Dev-Server liest gating.json beim nächsten Rebuild.
		</p>
	{/if}

	<!-- Save button (top) -->
	<form
		method="POST"
		action="?/save"
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
		<button type="submit" class="admin-btn admin-btn-dark mb-6" disabled={saving}>
			{saving ? 'Speichern…' : 'gating.json speichern'}
		</button>
	</form>

	<!-- Tabs -->
	<div class="admin-tabs">
		{#each tabs as [id, label]}
			<button
				type="button"
				on:click={() => setTab(id)}
				class="admin-tab"
				class:is-active={activeTab === id}>{label}</button
			>
		{/each}
	</div>

	<!-- ═══════════════════════════════ PLANS ═══════════════════════════════════ -->

	{#if activeTab === 'plans'}
		<div class="admin-table-wrap">
			<table class="admin-table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Label</th>
						<th>Extends</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(gating.plans) as [id, plan]}
						<tr>
							<td class="admin-mono">{id}</td>
							<td>
								<input
									class="admin-input admin-input-sm"
									value={plan.label}
									on:input={(e) => setPlanLabel(id, e)}
								/>
							</td>
							<td>
								<select
									class="admin-input admin-input-sm w-auto"
									value={plan.extends ?? ''}
									on:change={(e) => setPlanExtends(id, e)}
								>
									<option value="">–</option>
									{#each planIds.filter((p) => p !== id) as pid}
										<option value={pid}>{pid}</option>
									{/each}
								</select>
							</td>
							<td>
								<button class="admin-link-danger text-xs" on:click={() => deletePlan(id)}
									>Löschen</button
								>
							</td>
						</tr>
					{/each}

					<!-- Add new plan row -->
					<tr class="bg-gray-50">
						<td>
							<input
								class="admin-input admin-input-sm"
								placeholder="neue-id"
								bind:value={newPlanId}
							/>
						</td>
						<td>
							<input
								class="admin-input admin-input-sm"
								placeholder="Label"
								bind:value={newPlanLabel}
							/>
						</td>
						<td>
							<select class="admin-input admin-input-sm w-auto" bind:value={newPlanExtends}>
								<option value="">–</option>
								{#each planIds as pid}
									<option value={pid}>{pid}</option>
								{/each}
							</select>
						</td>
						<td>
							<button class="admin-btn admin-btn-dark admin-btn-sm" on:click={addPlan}
								>+ Hinzufügen</button
							>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	{/if}

	<!-- ═══════════════════════════════ FEATURES ════════════════════════════════ -->

	{#if activeTab === 'features'}
		<div class="admin-table-wrap">
			<table class="admin-table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Label</th>
						<th class="min-w-[220px]">Aktiviert durch Pläne</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(gating.features) as [id, feature]}
						<tr>
							<td class="admin-mono">{id}</td>
							<td>
								<input
									class="admin-input admin-input-sm"
									value={feature.label}
									on:input={(e) => setFeatureLabel(id, e)}
								/>
							</td>
							<td>
								<div class="flex flex-wrap gap-3">
									{#each planIds as pid}
										<label class="flex cursor-pointer items-center gap-1.5 text-xs">
											<input
												type="checkbox"
												class="admin-checkbox"
												checked={feature.plans.includes(pid)}
												on:change={() => toggleFeaturePlan(id, pid)}
											/>
											{pid}
										</label>
									{/each}
								</div>
							</td>
							<td>
								<button class="admin-link-danger text-xs" on:click={() => deleteFeature(id)}
									>Löschen</button
								>
							</td>
						</tr>
					{/each}

					<!-- Add new feature row -->
					<tr class="bg-gray-50">
						<td>
							<input
								class="admin-input admin-input-sm"
								placeholder="neue_id"
								bind:value={newFeatureId}
							/>
						</td>
						<td>
							<input
								class="admin-input admin-input-sm"
								placeholder="Label"
								bind:value={newFeatureLabel}
							/>
						</td>
						<td>
							<span class="admin-muted text-xs">Pläne nach dem Erstellen auswählen</span>
						</td>
						<td>
							<button class="admin-btn admin-btn-dark admin-btn-sm" on:click={addFeature}
								>+ Hinzufügen</button
							>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	{/if}

	<!-- ═══════════════════════════════ SLICES ══════════════════════════════════ -->

	{#if activeTab === 'slices'}
		<div class="admin-intro">
			{allSliceNames.length} Slices (Filesystem + gating.json vereint). Slices ohne Gate werden beim Speichern
			nicht in gating.json geschrieben.
		</div>

		<table class="admin-table">
			<thead>
				<tr>
					<th class="w-[200px]">Slice</th>
					<th class="w-[120px]">Gate-Typ</th>
					<th>Gate-Wert</th>
					<th class="w-[90px]">Variationen</th>
					<th class="w-[70px]">Felder</th>
					<th class="w-[60px]"></th>
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
					<tr>
						<td class="admin-mono font-semibold">
							{sliceName}
						</td>

						<!-- Gate type -->
						<td>
							<select
								class="admin-input admin-input-sm w-auto"
								value={gateType}
								on:change={(e) => sliceGateTypeChanged(sliceName, e)}
							>
								<option value="none">Kein Gate</option>
								<option value="plan">Plan</option>
								<option value="feature">Feature</option>
							</select>
						</td>

						<!-- Gate value -->
						<td>
							{#if gateType === 'plan'}
								<select
									class="admin-input admin-input-sm w-auto"
									value={gateValue}
									on:change={(e) => sliceGateValueChanged(sliceName, e)}
								>
									{#each planIds as pid}
										<option value={pid}>{pid}</option>
									{/each}
								</select>
							{:else if gateType === 'feature'}
								<select
									class="admin-input admin-input-sm w-auto"
									value={gateValue}
									on:change={(e) => sliceGateValueChanged(sliceName, e)}
								>
									{#each featureIds as fid}
										<option value={fid}>{fid}</option>
									{/each}
								</select>
							{:else}
								<span class="admin-muted text-xs">–</span>
							{/if}
						</td>

						<!-- Expand toggle -->
						<td class="text-center">
							{#if varCount > 0}
								<button on:click={() => toggleExpand(sliceName)} class="admin-btn admin-btn-sm">
									{varCount}
									{isExpanded ? '▲' : '▼'}
								</button>
							{:else}
								<span class="admin-muted text-xs">–</span>
							{/if}
						</td>

						<td class="text-center">
							{#if fieldCount > 0}
								<button on:click={() => toggleExpand(sliceName)} class="admin-btn admin-btn-sm">
									{fieldCount}
									{isExpanded ? '▲' : '▼'}
								</button>
							{:else}
								<span class="admin-muted text-xs">–</span>
							{/if}
						</td>

						<td>
							<button
								on:click={() => toggleExpand(sliceName)}
								class="admin-link text-xs"
								title="Variationen/Felder bearbeiten"
							>
								{isExpanded ? '▲' : '▼'} Edit
							</button>
						</td>
					</tr>

					<!-- Expanded sub-section -->
					{#if isExpanded}
						<tr>
							<td colspan="6" class="p-0">
								<div class="ml-6 border-l-[3px] border-gray-200 px-4 py-3">
									<!-- Variations -->
									<div class="mb-3">
										<div class="admin-label text-xs">Variationen</div>
										{#if Object.keys(s?.variations ?? {}).length > 0}
											<table class="admin-table admin-subtable mb-2">
												<thead>
													<tr>
														<th>ID</th>
														<th>Gate-Typ</th>
														<th>Gate-Wert</th>
														<th class="w-[60px]"></th>
													</tr>
												</thead>
												<tbody>
													{#each Object.entries(s?.variations ?? {}) as [varId, varGate]}
														{@const vType = getGateType(varGate)}
														{@const vValue = getGateValue(varGate)}
														<tr>
															<td class="admin-mono">{varId}</td>
															<td>
																<select
																	class="admin-input admin-input-sm w-auto"
																	value={vType}
																	on:change={(e) => varGateTypeChanged(sliceName, varId, e)}
																>
																	<option value="none">Kein Gate</option>
																	<option value="plan">Plan</option>
																	<option value="feature">Feature</option>
																</select>
															</td>
															<td>
																{#if vType === 'plan'}
																	<select
																		class="admin-input admin-input-sm w-auto"
																		value={vValue}
																		on:change={(e) => varGateValueChanged(sliceName, varId, e)}
																	>
																		{#each planIds as pid}
																			<option value={pid}>{pid}</option>
																		{/each}
																	</select>
																{:else if vType === 'feature'}
																	<select
																		class="admin-input admin-input-sm w-auto"
																		value={vValue}
																		on:change={(e) => varGateValueChanged(sliceName, varId, e)}
																	>
																		{#each featureIds as fid}
																			<option value={fid}>{fid}</option>
																		{/each}
																	</select>
																{:else}
																	<span class="admin-muted">–</span>
																{/if}
															</td>
															<td>
																<button
																	class="admin-link-danger text-xs"
																	on:click={() => deleteVariation(sliceName, varId)}
																	>Entfernen</button
																>
															</td>
														</tr>
													{/each}
												</tbody>
											</table>
										{:else}
											<p class="admin-muted mb-2 text-xs">Keine Variationen.</p>
										{/if}

										<!-- Add variation -->
										<div class="flex items-center gap-2">
											<input
												class="admin-input admin-input-sm w-40"
												placeholder="variation-id"
												value={newVarName[sliceName] ?? ''}
												on:input={(e) => setNewVarName(sliceName, e)}
											/>
											<button
												class="admin-btn admin-btn-dark admin-btn-sm"
												on:click={() => addVariation(sliceName)}>+ Variation</button
											>
										</div>
									</div>

									<!-- Fields -->
									<div>
										<div class="admin-label text-xs">Felder</div>
										{#if Object.keys(s?.fields ?? {}).length > 0}
											<table class="admin-table admin-subtable mb-2">
												<thead>
													<tr>
														<th>Feld-ID</th>
														<th>Gate-Typ</th>
														<th>Gate-Wert</th>
														<th class="w-[60px]"></th>
													</tr>
												</thead>
												<tbody>
													{#each Object.entries(s?.fields ?? {}) as [fieldId, fieldGate]}
														{@const fType = getGateType(fieldGate)}
														{@const fValue = getGateValue(fieldGate)}
														<tr>
															<td class="admin-mono">{fieldId}</td>
															<td>
																<select
																	class="admin-input admin-input-sm w-auto"
																	value={fType}
																	on:change={(e) => fieldGateTypeChanged(sliceName, fieldId, e)}
																>
																	<option value="none">Kein Gate</option>
																	<option value="plan">Plan</option>
																	<option value="feature">Feature</option>
																</select>
															</td>
															<td>
																{#if fType === 'plan'}
																	<select
																		class="admin-input admin-input-sm w-auto"
																		value={fValue}
																		on:change={(e) => fieldGateValueChanged(sliceName, fieldId, e)}
																	>
																		{#each planIds as pid}
																			<option value={pid}>{pid}</option>
																		{/each}
																	</select>
																{:else if fType === 'feature'}
																	<select
																		class="admin-input admin-input-sm w-auto"
																		value={fValue}
																		on:change={(e) => fieldGateValueChanged(sliceName, fieldId, e)}
																	>
																		{#each featureIds as fid}
																			<option value={fid}>{fid}</option>
																		{/each}
																	</select>
																{:else}
																	<span class="admin-muted">–</span>
																{/if}
															</td>
															<td>
																<button
																	class="admin-link-danger text-xs"
																	on:click={() => deleteField(sliceName, fieldId)}>Entfernen</button
																>
															</td>
														</tr>
													{/each}
												</tbody>
											</table>
										{:else}
											<p class="admin-muted mb-2 text-xs">Keine Felder.</p>
										{/if}

										<!-- Add field -->
										<div class="flex items-center gap-2">
											<input
												class="admin-input admin-input-sm w-40"
												placeholder="feld_id"
												value={newFieldName[sliceName] ?? ''}
												on:input={(e) => setNewFieldName(sliceName, e)}
											/>
											<button
												class="admin-btn admin-btn-dark admin-btn-sm"
												on:click={() => addField(sliceName)}>+ Feld</button
											>
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
	<div class="mt-8">
		<form
			method="POST"
			action="?/save"
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
			<button type="submit" class="admin-btn admin-btn-dark" disabled={saving}>
				{saving ? 'Speichern…' : 'gating.json speichern'}
			</button>
		</form>
	</div>
</div>
