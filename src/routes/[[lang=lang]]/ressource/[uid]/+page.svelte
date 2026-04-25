<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import { components } from '$lib/slices';

	export let data: {
		doc: any;
		title: string;
		ressource: {
			uid: string;
			name: string;
			maxPersonen: number;
			minNaechte: number;
			preisProNacht: number;
			zimmerEinzelbuchbar: boolean;
			saisonpreise: Array<{ von: string; bis: string; preis_pro_nacht: number }>;
			schlafzimmer: Array<{ zimmer_name: string; bett_typ: string; anzahl_betten: number; bild: { url: string; alt: string } | null }>;
		};
	};
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<SliceZone
	slices={data.doc.data.slices ?? []}
	{components}
	context={{ ressource: data.ressource }}
/>
