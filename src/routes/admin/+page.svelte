<script lang="ts">
	import { page } from '$app/stores';
	import { _ } from '$lib/stores/i18n';
	import Bounded from '$lib/components/Bounded.svelte';

	export let form: { error?: string } | null;

	// Keep the target page (?next=) when submitting
	$: action = `?/login${$page.url.searchParams.get('next') ? `&next=${encodeURIComponent($page.url.searchParams.get('next') ?? '')}` : ''}`;
</script>

<svelte:head><title>{$_('Admin')}</title></svelte:head>

<!-- Login in the look of the site (theme colors/fonts), admin pages afterwards are neutral -->
<Bounded as="section" class="bg-page-bg text-page">
	<div class="flex min-h-[50vh] items-center justify-center">
		<form
			method="POST"
			{action}
			class="panel-tinted flex w-full max-w-sm flex-col gap-5 rounded-lg p-8"
		>
			<h2 class="m-0">{$_('Admin')}</h2>
			<input
				type="password"
				name="password"
				required
				autocomplete="current-password"
				aria-label={$_('Passwort')}
				placeholder={$_('Passwort')}
				class="form-input"
			/>
			{#if form?.error}
				<p role="alert" class="m-0 text-sm text-red-600">{$_(form.error)}</p>
			{/if}
			<button type="submit" class="btn-solid rounded px-6 py-2 text-sm font-medium">
				{$_('Anmelden')}
			</button>
		</form>
	</div>
</Bounded>
