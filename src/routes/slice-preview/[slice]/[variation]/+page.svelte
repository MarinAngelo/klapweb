<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { components } from '$lib/slices';

	$: Component = components[$page.params.slice as keyof typeof components];

	let mockSlice: any = null;
	let bg = '#ffffff';

	$: {
		const bgParam = $page.url.searchParams.get('bg');
		const raw = $page.url.searchParams.get('data');
		if (bgParam) bg = bgParam;
		if (raw) {
			try {
				mockSlice = JSON.parse(decodeURIComponent(raw));
			} catch {}
		}
	}

	onMount(() => {
		const handler = (e: MessageEvent) => {
			if (e.data?.type === 'previewUpdate') mockSlice = e.data.slice;
		};
		window.addEventListener('message', handler);
		return () => window.removeEventListener('message', handler);
	});
</script>

<div style="background: {bg};">
	{#if mockSlice && Component}
		<svelte:component
			this={Component}
			slice={mockSlice}
			index={0}
			slices={[mockSlice]}
			context={{}}
		/>
	{/if}
</div>
