<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import { PrismicRichText } from '@prismicio/svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import { components } from '$lib/slices';

	export let data: {
		doc: any;
		title: string;
		ressource: {
			uid: string;
			name: string;
			beschreibung: any[];
			maxPersonen: number;
			minNaechte: number;
			preisProNacht: number;
			zimmerEinzelbuchbar: boolean;
			saisonpreise: Array<{ von: string; bis: string; preis_pro_nacht: number }>;
			schlafzimmer: Array<{ zimmer_name: string; bett_typ: string; anzahl_betten: number; bild: { url: string; alt: string } | null }>;
		};
	};

	const safeComponents = components as any;
	$: beschreibung = data.doc.data.beschreibung as any;
</script>

{#if beschreibung?.length}
	<Bounded yPadding="sm">
		<PrismicRichText field={beschreibung} />
	</Bounded>
{/if}

<SliceZone
	slices={data.doc.data.slices ?? []}
	components={safeComponents}
	context={{ ressource: data.ressource }}
/>
