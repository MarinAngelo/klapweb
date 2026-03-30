<script lang="ts">
	import { page } from '$app/stores';
	export let form: { error?: string; redirect?: string } | null = null;

	$: redirectParam = $page.url.searchParams.get('redirect') || form?.redirect || '/';
</script>

<svelte:head>
	<title>Anmelden</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="w-full max-w-sm p-8 bg-white rounded-lg shadow">
		<h1 class="text-xl font-semibold mb-6">Passwortgeschützte Seite</h1>

		<form method="POST">
			<input type="hidden" name="redirect" value={redirectParam} />

			<label class="block mb-2 text-sm" for="password">Passwort</label>
			<input
				id="password"
				name="password"
				type="password"
				class="w-full border rounded px-3 py-2 mb-4 text-sm"
				autofocus
			/>

			{#if form?.error}
				<p class="text-red-600 text-sm mb-4">{form.error}</p>
			{/if}

			<button type="submit" class="w-full bg-black text-white rounded px-4 py-2 text-sm">
				Anmelden
			</button>
		</form>
	</div>
</div>
