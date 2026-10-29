<script lang="ts">
	import { page } from '$app/stores';
	import { _ } from '$lib/stores/i18n';
	import LoginCard from '$lib/components/auth/LoginCard.svelte';
	import RememberMe from '$lib/components/auth/RememberMe.svelte';
	import CancelLogin from '$lib/components/auth/CancelLogin.svelte';

	export let form: { error?: string; redirect?: string } | null = null;

	$: redirectParam = $page.url.searchParams.get('redirect') || form?.redirect || '/';
</script>

<svelte:head>
	<title>{$_('Anmelden')}</title>
</svelte:head>

<LoginCard title={$_('Passwortgeschützte Seite')}>
	<input type="hidden" name="redirect" value={redirectParam} />
	<div>
		<label class="block text-sm" for="password">{$_('Passwort')}</label>
		<input
			id="password"
			name="password"
			type="password"
			required
			autocomplete="current-password"
			class="form-input"
		/>
	</div>
	<RememberMe />
	{#if form?.error}
		<p role="alert" class="m-0 text-sm text-red-600">{$_(form.error)}</p>
	{/if}
	<button type="submit" class="btn-solid rounded px-6 py-2 text-sm font-medium">
		{$_('Anmelden')}
	</button>
	<CancelLogin />
</LoginCard>
