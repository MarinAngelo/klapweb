<script lang="ts">
	import { goto } from '$app/navigation';

	let secret = '';
	let error = false;

	function handleSubmit() {
		if (!secret.trim()) return;
		error = false;
		goto(`/admin/dashboard?secret=${encodeURIComponent(secret.trim())}`);
	}
</script>

<svelte:head><title>Admin</title></svelte:head>

<div style="font-family: sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb;">
	<form
		on:submit|preventDefault={handleSubmit}
		style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); width: 100%; max-width: 320px; display: flex; flex-direction: column; gap: 1rem;"
	>
		<h1 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Admin</h1>
		<input
			type="password"
			bind:value={secret}
			placeholder="Passwort"
			autofocus
			style="border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 1rem; outline: none;"
		/>
		{#if error}
			<p style="color: #dc2626; font-size: 0.875rem; margin: 0;">Falsches Passwort.</p>
		{/if}
		<button
			type="submit"
			style="background: #111827; color: white; border: none; border-radius: 0.375rem; padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer;"
		>
			Anmelden
		</button>
	</form>
</div>
