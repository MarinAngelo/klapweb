<script lang="ts">
	import { _ } from '$lib/stores/i18n';
	import LoginCard from '$lib/components/auth/LoginCard.svelte';
	import RememberMe from '$lib/components/auth/RememberMe.svelte';
	import CancelLogin from '$lib/components/auth/CancelLogin.svelte';

	export let form: { error?: string } | null = null;
</script>

<svelte:head><title>{$_('Anmelden')}</title></svelte:head>

<!-- Login in the look of the site (same as /admin) -->
<LoginCard title={$_('Anmelden')}>
	<div>
		<label for="email" class="block text-sm">{$_('E-Mail')}</label>
		<input id="email" name="email" type="email" autocomplete="email" required class="form-input" />
	</div>
	<div>
		<label for="password" class="block text-sm">{$_('Passwort')}</label>
		<input
			id="password"
			name="password"
			type="password"
			autocomplete="current-password"
			required
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
	<div class="scope-border flex flex-col gap-2 border-t pt-4 text-sm">
		<a href="/konto/registrierung">{$_('Noch kein Konto? Registrieren')}</a>
		<a href="/konto/passwort-reset">{$_('Passwort vergessen?')}</a>
	</div>
</LoginCard>
