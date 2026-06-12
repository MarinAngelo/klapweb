<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let selectedPlan = data.authenticated ? data.currentPlan : '';
	let selectedOverrides: string[] = data.authenticated ? [...data.overrideFeatures] : [];
	let passwordInput = '';
	let loginError = '';

	function getPlans() {
		if (!data.authenticated) return [];
		return Object.entries(data.plans ?? {}).map(([id, plan]: [string, any]) => ({ id, label: plan.label }));
	}

	function getAllFeatures() {
		if (!data.authenticated) return [];
		return Object.entries(data.features ?? {}).map(([id, feature]: [string, any]) => ({
			id,
			label: feature.label,
			inPlan: data.activeFeatures.includes(id)
		}));
	}

	function isFeatureActive(featureId: string) {
		return data.activeFeatures.includes(featureId) || selectedOverrides.includes(featureId);
	}

	function toggleFeature(featureId: string) {
		const isCurrentlyActive = isFeatureActive(featureId);
		const isInPlan = data.activeFeatures.includes(featureId);

		if (isCurrentlyActive) {
			// Wenn aktiv und im Plan: zu Overrides hinzufügen zum Ausschalten
			// Wenn aktiv aber nicht im Plan: aus Overrides entfernen
			if (isInPlan) {
				selectedOverrides = [...selectedOverrides, featureId];
			} else {
				selectedOverrides = selectedOverrides.filter((f) => f !== featureId);
			}
		} else {
			// Wenn nicht aktiv und im Plan: aus Overrides entfernen zum Einschalten
			// Wenn nicht aktiv und nicht im Plan: zu Overrides hinzufügen
			if (isInPlan) {
				selectedOverrides = selectedOverrides.filter((f) => f !== featureId);
			} else {
				selectedOverrides = [...selectedOverrides, featureId];
			}
		}
	}

	function handleSave(e: Event) {
		const form = e.currentTarget as HTMLFormElement;
		const overridesInput = form.querySelector('input[name="overrides"]') as HTMLInputElement;
		if (overridesInput) {
			overridesInput.value = JSON.stringify(selectedOverrides);
		}
	}
</script>

<div class="container">
	{#if !data.authenticated}
		<!-- Login Form -->
		<div class="login-container">
			<h1>Agency Gating Editor</h1>
			<p class="intro">Bitte geben Sie das Agentur-Passwort ein:</p>

			<form method="POST" action="?/login" class="login-form">
				<div class="form-group">
					<label for="secret">Passwort</label>
					<input
						id="secret"
						name="secret"
						type="password"
						bind:value={passwordInput}
						placeholder="Passwort eingeben"
						required
					/>
				</div>

				{#if loginError}
					<div class="error-message">{loginError}</div>
				{/if}

				<button type="submit" class="btn btn-primary">Anmelden</button>
			</form>
		</div>
	{:else}
		<!-- Editor -->
		<div class="editor-container">
			<div class="header">
				<h1>Agency Gating Editor</h1>
				<form method="POST" action="?/logout" style="display: inline;">
					<button type="submit" class="btn btn-secondary">Abmelden</button>
				</form>
			</div>

			<form method="POST" action="?/save" on:submit={handleSave} class="form">
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
						<legend>Features</legend>
						{#each getAllFeatures() as { id, label, inPlan }}
							<label class="checkbox-label">
								<input
									type="checkbox"
									checked={isFeatureActive(id)}
									on:change={() => toggleFeature(id)}
								/>
								<span>
									{label}
									{#if inPlan}
										<span class="badge">im Plan</span>
									{/if}
								</span>
							</label>
						{/each}
					</fieldset>
				</div>

				<input type="hidden" name="overrides" value="{JSON.stringify(selectedOverrides)}" />

				<button type="submit" class="btn btn-primary">Speichern</button>
			</form>

			<div class="info">
				<strong>Übersicht:</strong>
				<p>Plan: {getPlans().find((p) => p.id === selectedPlan)?.label}</p>
				<p>Plan-Features: {data.activeFeatures.join(', ') || 'keine'}</p>
				<p>Aktiviert in Overrides: {selectedOverrides.filter((f) => !data.activeFeatures.includes(f)).join(', ') || 'keine'}</p>
				<p>Deaktiviert in Overrides: {selectedOverrides.filter((f) => data.activeFeatures.includes(f)).join(', ') || 'keine'}</p>
				<hr style="margin: 1rem 0; border: none; border-top: 1px solid #ddd;" />
				<p><strong>Alle aktiven Features:</strong> {[...new Set([...data.activeFeatures, ...selectedOverrides.filter((f) => !data.activeFeatures.includes(f))])].join(', ')}</p>
			</div>
		</div>
	{/if}
</div>

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

	.info p {
		margin: 0.5rem 0;
	}
</style>
