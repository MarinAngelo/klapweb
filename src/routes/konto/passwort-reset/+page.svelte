<script lang="ts">
	export let data: { token: string };
	export let form: { step?: string; error?: string; sent?: boolean; success?: boolean } | null =
		null;

	$: isResetStep = !!data.token;
</script>

<svelte:head><title>Passwort zurücksetzen</title></svelte:head>

<div class="admin-container-narrow flex min-h-[70vh] items-center justify-center">
	<div class="admin-card mb-0 flex w-full max-w-sm flex-col gap-4">
		{#if form?.success}
			<h1>Passwort geändert</h1>
			<p class="admin-muted text-sm">Du kannst dich jetzt mit deinem neuen Passwort anmelden.</p>
			<a href="/konto/anmelden" class="admin-btn admin-btn-dark py-2">Zur Anmeldung</a>
		{:else if form?.sent}
			<h1>E-Mail gesendet</h1>
			<p class="admin-muted text-sm">
				Falls ein Konto mit dieser E-Mail existiert, erhältst du einen Link zum Zurücksetzen.
			</p>
		{:else if isResetStep}
			<h1>Neues Passwort</h1>
			<form method="POST" action="?/reset" class="flex flex-col gap-3">
				<input type="hidden" name="token" value={data.token} />
				<div>
					<label for="password" class="admin-label">Neues Passwort</label>
					<input
						id="password"
						name="password"
						type="password"
						minlength="8"
						required
						class="admin-input"
					/>
				</div>
				<div>
					<label for="password_confirm" class="admin-label">Bestätigen</label>
					<input
						id="password_confirm"
						name="password_confirm"
						type="password"
						required
						class="admin-input"
					/>
				</div>
				{#if form?.error}
					<p class="admin-error-text">{form.error}</p>
				{/if}
				<button type="submit" class="admin-btn admin-btn-dark mt-1 py-2">
					Passwort speichern
				</button>
			</form>
		{:else}
			<h1>Passwort vergessen?</h1>
			<form method="POST" action="?/request" class="flex flex-col gap-3">
				<div>
					<label for="email" class="admin-label">E-Mail</label>
					<input id="email" name="email" type="email" required class="admin-input" />
				</div>
				{#if form?.error}
					<p class="admin-error-text">{form.error}</p>
				{/if}
				<button type="submit" class="admin-btn admin-btn-dark mt-1 py-2"> Link senden </button>
			</form>
			<a href="/konto/anmelden" class="admin-link text-sm font-normal">Zurück zur Anmeldung</a>
		{/if}
	</div>
</div>
