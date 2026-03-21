<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { _ } from '$lib/stores/i18n';
	$: bg = $theme.headerBgColor || '#1f2937';
	$: fg = $theme.headerLinkColor || '#e5e7eb';
</script>

<svelte:head><title>{$_('Slice-Katalog')}</title></svelte:head>

<div class="flex items-center justify-center" style="min-height: calc(100vh - 4rem);">
	<div class="px-10 py-8 rounded-xl" style="background-color: {bg}; color: {fg};">
		<h1>← {$_('Wähle einen Slice aus der Navigation')}</h1>
	</div>
</div>
