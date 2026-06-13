<script lang="ts">
	export let form: { error?: string } | null = null;
</script>

<svelte:head><title>Anmelden</title></svelte:head>

<div style="font-family: sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb;">
	<div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 1rem;">
		<h1 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Anmelden</h1>

		<form method="POST" style="display: flex; flex-direction: column; gap: 0.75rem;">
			<div style="display: flex; flex-direction: column; gap: 0.25rem;">
				<label for="email" style="font-size: 0.875rem;">E-Mail</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					style="border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 1rem;"
				/>
			</div>

			<div style="display: flex; flex-direction: column; gap: 0.25rem;">
				<label for="password" style="font-size: 0.875rem;">Passwort</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					style="border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 1rem;"
				/>
			</div>

			{#if form?.error}
				<p style="color: #dc2626; font-size: 0.875rem; margin: 0;">{form.error}</p>
			{/if}

			<button
				type="submit"
				style="background: #111827; color: white; border: none; border-radius: 0.375rem; padding: 0.625rem 1rem; font-size: 1rem; cursor: pointer; margin-top: 0.25rem;"
			>
				Anmelden
			</button>
		</form>

		<div style="font-size: 0.875rem; display: flex; flex-direction: column; gap: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #f3f4f6;">
			<a href="/konto/registrierung" style="color: #4b5563;">Noch kein Konto? Registrieren</a>
			<a href="/konto/passwort-reset" style="color: #4b5563;">Passwort vergessen?</a>
		</div>
	</div>
</div>
