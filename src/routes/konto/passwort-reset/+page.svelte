<script lang="ts">
	export let data: { token: string };
	export let form: { step?: string; error?: string; sent?: boolean; success?: boolean } | null = null;

	$: isResetStep = !!data.token;
</script>

<svelte:head><title>Passwort zurücksetzen</title></svelte:head>

<div style="font-family: sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb;">
	<div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 1rem;">

		{#if form?.success}
			<h1 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Passwort geändert</h1>
			<p style="font-size: 0.875rem; color: #374151;">Du kannst dich jetzt mit deinem neuen Passwort anmelden.</p>
			<a href="/konto/anmelden" style="background: #111827; color: white; border-radius: 0.375rem; padding: 0.625rem 1rem; font-size: 1rem; text-align: center; text-decoration: none;">Zur Anmeldung</a>

		{:else if form?.sent}
			<h1 style="font-size: 1.25rem; font-weight: 600; margin: 0;">E-Mail gesendet</h1>
			<p style="font-size: 0.875rem; color: #374151;">Falls ein Konto mit dieser E-Mail existiert, erhältst du einen Link zum Zurücksetzen.</p>

		{:else if isResetStep}
			<h1 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Neues Passwort</h1>
			<form method="POST" action="?/reset" style="display: flex; flex-direction: column; gap: 0.75rem;">
				<input type="hidden" name="token" value={data.token} />
				<div style="display: flex; flex-direction: column; gap: 0.25rem;">
					<label for="password" style="font-size: 0.875rem;">Neues Passwort</label>
					<input id="password" name="password" type="password" minlength="8" required
						style="border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 1rem;" />
				</div>
				<div style="display: flex; flex-direction: column; gap: 0.25rem;">
					<label for="password_confirm" style="font-size: 0.875rem;">Bestätigen</label>
					<input id="password_confirm" name="password_confirm" type="password" required
						style="border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 1rem;" />
				</div>
				{#if form?.error}
					<p style="color: #dc2626; font-size: 0.875rem; margin: 0;">{form.error}</p>
				{/if}
				<button type="submit" style="background: #111827; color: white; border: none; border-radius: 0.375rem; padding: 0.625rem 1rem; font-size: 1rem; cursor: pointer;">
					Passwort speichern
				</button>
			</form>

		{:else}
			<h1 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Passwort vergessen?</h1>
			<form method="POST" action="?/request" style="display: flex; flex-direction: column; gap: 0.75rem;">
				<div style="display: flex; flex-direction: column; gap: 0.25rem;">
					<label for="email" style="font-size: 0.875rem;">E-Mail</label>
					<input id="email" name="email" type="email" required
						style="border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 1rem;" />
				</div>
				{#if form?.error}
					<p style="color: #dc2626; font-size: 0.875rem; margin: 0;">{form.error}</p>
				{/if}
				<button type="submit" style="background: #111827; color: white; border: none; border-radius: 0.375rem; padding: 0.625rem 1rem; font-size: 1rem; cursor: pointer;">
					Link senden
				</button>
			</form>
			<a href="/konto/anmelden" style="font-size: 0.875rem; color: #4b5563;">Zurück zur Anmeldung</a>
		{/if}

	</div>
</div>
