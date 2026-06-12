<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let selectedPlan = data.currentPlan;
	let selectedOverrides: string[] = [...data.overrideFeatures];

	function getPlans() {
		return Object.entries(data.plans ?? {}).map(([id, plan]: [string, any]) => ({ id, label: plan.label }));
	}

	function getAvailableOverrides() {
		const activePlansFeatures = data.activeFeatures;
		return Object.entries(data.features ?? {})
			.filter(([id]) => !activePlansFeatures.includes(id))
			.map(([id, feature]: [string, any]) => ({ id, label: feature.label }));
	}

	function toggleOverride(featureId: string) {
		if (selectedOverrides.includes(featureId)) {
			selectedOverrides = selectedOverrides.filter((f) => f !== featureId);
		} else {
			selectedOverrides = [...selectedOverrides, featureId];
		}
	}

	function handleSubmit(e: Event) {
		const form = e.currentTarget as HTMLFormElement;
		const overridesInput = form.querySelector('input[name="overrides"]') as HTMLInputElement;
		if (overridesInput) {
			overridesInput.value = JSON.stringify(selectedOverrides);
		}
	}
</script>

<div class="container">
	<h1>Agency Gating Editor</h1>

	<form method="POST" action="?/save" on:submit={handleSubmit} class="form">
		<div class="form-group">
			<label for="plan">Plan</label>
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
				<legend>Zusätzliche Features (Overrides)</legend>
				{#if getAvailableOverrides().length === 0}
					<p class="text-muted">Alle Features bereits im Plan enthalten.</p>
				{:else}
					{#each getAvailableOverrides() as { id, label }}
						<label class="checkbox-label">
							<input
								type="checkbox"
								checked={selectedOverrides.includes(id)}
								on:change={() => toggleOverride(id)}
							/>
							{label}
						</label>
					{/each}
				{/if}
			</fieldset>
		</div>

		<input type="hidden" name="overrides" value="{JSON.stringify(selectedOverrides)}" />

		<button type="submit" class="btn">Speichern</button>
	</form>

	<div class="info">
		<strong>Aktuell aktiv:</strong>
		<p>Plan: {getPlans().find((p) => p.id === selectedPlan)?.label}</p>
		<p>Features: {data.activeFeatures.join(', ') || 'keine'}</p>
		{#if selectedOverrides.length > 0}
			<p>Overrides: {selectedOverrides.join(', ')}</p>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 600;
	}

	select {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
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
	}

	.btn {
		padding: 0.75rem 1.5rem;
		background-color: #333;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: background-color 0.2s;
		align-self: flex-start;
	}

	.btn:hover {
		background-color: #555;
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
</style>
