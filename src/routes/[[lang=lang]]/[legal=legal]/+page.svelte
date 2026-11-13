<script lang="ts">
	import ImpressumContent from '$lib/components/legal/ImpressumContent.svelte';
	import PrivacyContent from '$lib/components/legal/PrivacyContent.svelte';
	import AGBContent from '$lib/components/legal/AGBContent.svelte';
	import HaftungsausschlussContent from '$lib/components/legal/HaftungsausschlussContent.svelte';

	export let data;

	// Key from staticRoutes (i18n.ts) → content component
	const components: Record<string, any> = {
		impressum: ImpressumContent,
		datenschutz: PrivacyContent,
		agb: AGBContent,
		haftungsausschluss: HaftungsausschlussContent
	};
	$: component = components[data.legalPage];
</script>

<svelte:component this={component} {data} />
