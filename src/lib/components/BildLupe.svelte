<script lang="ts">
	export let imageUrl: string;
	export let zoomFactor: number = 2.5;
	export let lupeSize: number = 250;

	let containerEl: HTMLElement;
	let x = 0;
	let y = 0;
	let active = false;
	let containerW = 0;
	let containerH = 0;

	function onMove(e: MouseEvent) {
		const rect = containerEl.getBoundingClientRect();
		x = e.clientX - rect.left;
		y = e.clientY - rect.top;
		containerW = rect.width;
		containerH = rect.height;
	}

	$: bgX = -(x * zoomFactor - lupeSize / 2);
	$: bgY = -(y * zoomFactor - lupeSize / 2);
	$: lupeStyle = [
		`left: ${x}px`,
		`top: ${y}px`,
		`width: ${lupeSize}px`,
		`height: ${lupeSize}px`,
		`background-image: url(${imageUrl})`,
		`background-size: ${containerW * zoomFactor}px ${containerH * zoomFactor}px`,
		`background-position: ${bgX}px ${bgY}px`,
		`background-repeat: no-repeat`
	].join(';');
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="lupe-container"
	bind:this={containerEl}
	on:mousemove={onMove}
	on:mouseenter={() => (active = true)}
	on:mouseleave={() => (active = false)}
>
	<slot />
	{#if active && imageUrl}
		<div class="lupe-lens" style={lupeStyle}></div>
	{/if}
</div>

<style>
	.lupe-container {
		position: relative;
		cursor: crosshair;
		overflow: hidden;
	}
	.lupe-lens {
		position: absolute;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.85);
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.15),
			0 4px 24px rgba(0, 0, 0, 0.25);
		pointer-events: none;
		transform: translate(-50%, -50%);
		z-index: 10;
		background-repeat: no-repeat;
	}
</style>
