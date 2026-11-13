<script lang="ts">
	import { page } from '$app/stores';
	export let form: { error?: string } | null = null;
</script>

<svelte:head><title>Registrieren</title></svelte:head>

<div class="admin-container-narrow flex min-h-[70vh] items-center justify-center">
	<div class="admin-card mb-0 flex w-full max-w-sm flex-col gap-4">
		<h1>Konto erstellen</h1>

		<form method="POST" class="flex flex-col gap-3">
			<!-- Honeypot: von Bots ausgefüllt, von Menschen ignoriert -->
			<input
				name="website"
				tabindex="-1"
				autocomplete="off"
				aria-hidden="true"
				class="absolute -left-[9999px] h-px w-px overflow-hidden"
			/>

			<div>
				<label for="name" class="admin-label">Name</label>
				<input id="name" name="name" type="text" autocomplete="name" required class="admin-input" />
			</div>

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
					autocomplete="new-password"
					minlength="8"
					required
					class="admin-input"
				/>
			</div>

			<div>
				<label for="password_confirm" class="admin-label">Passwort bestätigen</label>
				<input
					id="password_confirm"
					name="password_confirm"
					type="password"
					autocomplete="new-password"
					required
					class="admin-input"
				/>
			</div>

			{#if form?.error}
				<p class="admin-error-text">{form.error}</p>
			{/if}

			<button type="submit" class="admin-btn admin-btn-dark mt-1 py-2"> Registrieren </button>
		</form>

		<div class="border-t border-gray-100 pt-3 text-sm">
			<a href="/konto/anmelden" class="admin-link font-normal">Bereits ein Konto? Anmelden</a>
		</div>
	</div>
</div>
