<script lang="ts">
	import { onMount } from 'svelte';

	export let url: string;
	export let alt: string = '';

	let src: string | null = null;
	let done = false;
	let hostname = '';

	try { hostname = new URL(url).hostname; } catch {}

	onMount(async () => {
		try {
			const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
			const data = await res.json();
			src = data.image ?? null;
		} catch {}
		done = true;
	});
</script>

{#if src}
	<img {src} {alt} class="w-full h-full object-cover" loading="lazy" decoding="async" />
{:else if done}
	<div class="w-full h-full flex items-center justify-center" style="opacity:0.15;">
		{#if hostname}
			<img
				src="https://www.google.com/s2/favicons?domain={hostname}&sz=64"
				alt=""
				class="w-10 h-10"
			/>
		{/if}
	</div>
{:else}
	<div class="w-full h-full animate-pulse" style="background: color-mix(in srgb, currentColor 8%, transparent);"></div>
{/if}
