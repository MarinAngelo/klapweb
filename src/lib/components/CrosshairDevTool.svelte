<script lang="ts">
	import { showCrosshair } from '$lib/stores/showCrosshair';
</script>
<!-- Dev-Overlay: Fadenkreuz für Bildschirmmitte -->
{#if $showCrosshair}
	<div class="crosshair-def-tool"></div>
{/if}
