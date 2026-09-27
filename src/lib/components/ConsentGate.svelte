<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/stores/i18n';
	import Button from '$lib/components/Button.svelte';
	import { consentServices } from '$lib/consent/services';
	import {
		allowCategory,
		isServiceAllowed,
		registerServiceUsage,
		consentSettingsOpen
	} from '$lib/stores/consent';

	/** Service id from consent/services.ts */
	export let service: string;
	/** Placeholder height, should match the embedded content to avoid layout shift */
	export let minHeight = 200;

	// Content renders client-only: the stored rejection is only known in the browser
	let mounted = false;
	let loadedOnce = false;

	$: definition = consentServices[service] ?? consentServices.external_embed;
	$: allowed = $isServiceAllowed(service) || loadedOnce;

	// Re-register if the service changes (e.g. map provider resolved after mount)
	let unregister: (() => void) | null = null;
	$: if (mounted) {
		unregister?.();
		unregister = registerServiceUsage(service);
	}

	onMount(() => {
		mounted = true;
		return () => unregister?.();
	});
</script>

{#if mounted && allowed}
	<slot />
{:else if mounted}
	<div class="consent-placeholder" style="min-height: {minHeight}px;">
		<p class="consent-placeholder-title">{$_(definition.label)}</p>
		<p class="consent-placeholder-text">
			{$_('Dieser Inhalt wird nicht geladen, weil Sie externe Inhalte abgelehnt haben.')}
			{$_('Beim Laden werden Daten an folgenden Anbieter übertragen')}: {$_(definition.provider)}.
		</p>
		<div class="consent-placeholder-actions">
			<Button
				text={$_('Einmal laden')}
				size="sm"
				mb={false}
				bgColor="transparent"
				color="currentColor"
				hoverBgColor="var(--page-color)"
				hoverColor="var(--page-bg-color)"
				on:click={() => (loadedOnce = true)}
			/>
			<Button
				text={$_('Immer erlauben')}
				size="sm"
				mb={false}
				on:click={() => allowCategory(definition.category)}
			/>
			<button type="button" class="consent-link" on:click={() => consentSettingsOpen.set(true)}>
				{$_('Cookie-Einstellungen')}
			</button>
		</div>
	</div>
{:else}
	<!-- SSR / before hydration: reserve space only -->
	<div style="min-height: {minHeight}px;" aria-hidden="true"></div>
{/if}

<style>
	.consent-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1.5rem;
		text-align: center;
		border: 1px dashed color-mix(in srgb, currentColor 35%, transparent);
		border-radius: 1.5rem;
		background-color: color-mix(in srgb, currentColor 5%, transparent);
	}

	.consent-placeholder-title {
		font-weight: 600;
		margin: 0;
	}

	.consent-placeholder-text {
		max-width: 32rem;
		margin: 0;
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.consent-placeholder-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.consent-link {
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		font-size: 0.875rem;
		text-decoration: underline;
		cursor: pointer;
	}
</style>
