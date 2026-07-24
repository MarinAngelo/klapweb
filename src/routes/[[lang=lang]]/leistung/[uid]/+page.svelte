<script lang="ts">
	import { page } from '$app/stores';
	import { SliceZone } from '@prismicio/svelte';
	import { isFilled } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import { _ } from '$lib/stores/i18n';
	import { components } from '$lib/slices';

	export let data;

	$: leistung = data.leistung;
	$: slices = leistung?.data?.slices ?? [];
	$: langPrefix = $page.params.lang ? `/${$page.params.lang}` : '';
</script>

<svelte:head>
	<title>{data.title} - {$page.data?.siteName || ''}</title>
	<meta name="description" content={data.meta_description} />
</svelte:head>

<article>
	<!-- Slices -->
	{#if slices.length > 0}
		<SliceZone {slices} {components} />
	{:else if isFilled.richText(leistung.data.beschreibung)}
		<Bounded as="header" class="py-12">
			<div class="text-lg text-muted-foreground max-w-2xl">
				<PrismicRichText field={leistung.data.beschreibung} />
			</div>
		</Bounded>
	{:else}
		<Bounded>
			<div class="py-12 text-center text-muted-foreground">
				{$_('Keine weiteren Inhalte verfügbar')}
			</div>
		</Bounded>
	{/if}

	<!-- CTA: All Services -->
	<Bounded as="footer" class="py-12 text-center">
		<Button
			href="{langPrefix}/leistungen"
			text={$_('Alle Leistungen anzeigen')}
		/>
	</Bounded>
</article>
