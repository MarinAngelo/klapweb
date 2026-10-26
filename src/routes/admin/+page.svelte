<script lang="ts">
	import { page } from '$app/stores';
	import { _ } from '$lib/stores/i18n';

	export let form: { error?: string } | null;

	// Keep the target page (?next=) when submitting
	$: action = `?/login${$page.url.searchParams.get('next') ? `&next=${encodeURIComponent($page.url.searchParams.get('next') ?? '')}` : ''}`;
</script>

<svelte:head><title>{$_('Admin')}</title></svelte:head>

<div class="admin-container-narrow flex min-h-[70vh] items-center justify-center">
	<form method="POST" {action} class="admin-card flex w-full max-w-xs flex-col gap-4">
		<h1>{$_('Admin')}</h1>
		<input
			type="password"
			name="password"
			required
			autocomplete="current-password"
			aria-label={$_('Passwort')}
			placeholder={$_('Passwort')}
			class="admin-input"
		/>
		{#if form?.error}
			<p role="alert" class="admin-error-text">{$_(form.error)}</p>
		{/if}
		<button type="submit" class="admin-btn admin-btn-dark">{$_('Anmelden')}</button>
	</form>
</div>
