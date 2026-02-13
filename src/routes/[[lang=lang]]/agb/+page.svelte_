<script lang="ts">
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	export let data;
	const settings = data?.settings;

	const agbField = settings?.data?.agb;
</script>

<main class="prose mx-auto py-12 px-4 sm:px-6">
	<h1 class="break-words hyphens-auto">AGB</h1>
	<PrismicRichText field={Array.isArray(agbField) && agbField.length > 0 ? agbField : ""} />
</main>

<style>
	.prose {
		max-width: 65ch;
	}
	.address-block p {
		margin-bottom: 2px;
	}
</style>
