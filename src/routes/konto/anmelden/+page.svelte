<script lang="ts">
	export let form: { error?: string } | null = null;
</script>

<svelte:head><title>Anmelden</title></svelte:head>

<div class="admin-container-narrow flex min-h-[70vh] items-center justify-center">
	<div class="admin-card mb-0 flex w-full max-w-sm flex-col gap-4">
		<h1>Anmelden</h1>

		<form method="POST" class="flex flex-col gap-3">
			<div>
				<label for="email" class="admin-label">E-Mail</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					class="admin-input"
				/>
			</div>

			<div>
				<label for="password" class="admin-label">Passwort</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					class="admin-input"
				/>
			</div>

			{#if form?.error}
				<p class="admin-error-text">{form.error}</p>
			{/if}

			<button type="submit" class="admin-btn admin-btn-dark mt-1 py-2"> Anmelden </button>
		</form>

		<div class="flex flex-col gap-2 border-t border-gray-100 pt-3 text-sm">
			<a href="/konto/registrierung" class="admin-link font-normal">Noch kein Konto? Registrieren</a
			>
			<a href="/konto/passwort-reset" class="admin-link font-normal">Passwort vergessen?</a>
		</div>
	</div>
</div>
