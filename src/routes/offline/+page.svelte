<script lang="ts">
	import { _ } from '$lib/stores/i18n';
	import Bounded from '$lib/components/Bounded.svelte';
	import Button from '$lib/components/Button.svelte';

	const retry = () => location.reload();
</script>

<svelte:head>
	<title>{$_('Keine Verbindung')}</title>
</svelte:head>

<Bounded as="section" class="text-center">
	<div class="offline-content">
		<h1>{$_('Keine Verbindung')}</h1>
		<p>
			{$_(
				'Diese Seite ist ohne Internet nicht verfügbar. Bereits besuchte Seiten kannst du weiterhin öffnen.'
			)}
		</p>
		<div class="offline-actions">
			<Button text={$_('Erneut versuchen')} mb={false} on:click={retry} />
			<Button href="/" text={$_('Zur Startseite')} mb={false} />
		</div>
	</div>
</Bounded>

<style>
	.offline-content {
		max-width: 36rem;
		margin: 0 auto;
		min-height: 50vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.offline-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
	}
</style>
