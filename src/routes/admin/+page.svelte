<script lang="ts">
	import { page } from '$app/stores';
	import { _ } from '$lib/stores/i18n';

	export let form: { error?: string } | null;

	// Keep the target page (?next=) when submitting
	$: action = `?/login${$page.url.searchParams.get('next') ? `&next=${encodeURIComponent($page.url.searchParams.get('next') ?? '')}` : ''}`;
</script>

<svelte:head><title>{$_('Admin')}</title></svelte:head>

<div
	style="font-family: sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb;"
>
	<form
		method="POST"
		{action}
		style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); width: 100%; max-width: 320px; display: flex; flex-direction: column; gap: 1rem;"
	>
		<h1 style="font-size: 1.25rem; font-weight: 600; margin: 0;">{$_('Admin')}</h1>
		<input
			type="password"
			name="password"
			required
			autocomplete="current-password"
			aria-label={$_('Passwort')}
			placeholder={$_('Passwort')}
			style="border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 1rem; outline: none;"
		/>
		{#if form?.error}
			<p role="alert" style="color: #dc2626; font-size: 0.875rem; margin: 0;">{$_(form.error)}</p>
		{/if}
		<button
			type="submit"
			style="background: #111827; color: white; border: none; border-radius: 0.375rem; padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer;"
		>
			{$_('Anmelden')}
		</button>
	</form>
</div>
