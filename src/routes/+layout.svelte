<script lang="ts">
	import '../app.css';

	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { page } from '$app/stores';
	import { repositoryName } from '$lib/prismicio';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	export let data;
</script>

<svelte:head>
	<title>{$page.data?.title || 'Default Title'}</title>
	{#if $page.data?.meta_description}
		<meta name="description" content={$page.data.meta_description} />
	{/if}
	{#if $page.data?.meta_title}
		<meta name="og:title" content={$page.data.meta_title} />
	{/if}
	{#if $page.data?.meta_image}
		<meta name="og:image" content={$page.data.meta_image.url} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
</svelte:head>
<!--Hier wird die Textfarbe zugewiesen, zuweisung Hintergrundfarbe funktioniert nicht-->
<div class="text-slate-800">
	<Header
		navigation={data?.navigation || []}
		settings={data?.settings || {}}
		prismicTheme={data?.prismicTheme || {}}
	/>
	<main><slot /></main>
	<Footer
		navigation={data?.navigation || []}
		settings={data?.settings || {}}
		prismicTheme={data?.prismicTheme || {}}
	/>
</div>
<PrismicPreview {repositoryName} />
