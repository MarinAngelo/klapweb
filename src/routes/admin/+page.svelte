<script lang="ts">
	import { page } from '$app/stores';
	import { _ } from '$lib/stores/i18n';
	import LoginCard from '$lib/components/auth/LoginCard.svelte';
	import RememberMe from '$lib/components/auth/RememberMe.svelte';
	import CancelLogin from '$lib/components/auth/CancelLogin.svelte';

	export let form: { error?: string } | null;

	// Keep the target page (?next=) when submitting
	$: action = `?/login${$page.url.searchParams.get('next') ? `&next=${encodeURIComponent($page.url.searchParams.get('next') ?? '')}` : ''}`;
</script>

<svelte:head><title>{$_('Admin')}</title></svelte:head>

<!-- Login in the look of the site; admin pages afterwards are neutral -->
<LoginCard title={$_('Admin')} {action}>
	<input
		type="password"
		name="password"
		required
		autocomplete="current-password"
		aria-label={$_('Passwort')}
		placeholder={$_('Passwort')}
		class="form-input"
	/>
	<RememberMe />
	{#if form?.error}
		<p role="alert" class="m-0 text-sm text-red-600">{$_(form.error)}</p>
	{/if}
	<button type="submit" class="btn-solid rounded px-6 py-2 text-sm font-medium">
		{$_('Anmelden')}
	</button>
	<CancelLogin />
</LoginCard>
