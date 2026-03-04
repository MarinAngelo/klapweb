<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { variables } from '$lib/stores/variables';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import { mapAnimation } from '$lib/utils/animationMapper';

	export let slice: any;
	export let slices: any;
	export let context: any;
	export let index: any;

	const { pageColor, pageBgColor } = get(theme);

	$: anim = mapAnimation(
		slice.primary.animate,
		slice.primary.anim_direction,
		slice.primary.anim_delay,
		slice.primary.anim_duration
	);

	// Rows: only shown when their token is present in the store.
	// Rabatt row shows the percent value with a "%" suffix.
	$: rows = [
		{
			label: slice.primary.label_abrechnungsart || 'Abrechnungsart',
			value: $variables['Abrechnungsart'],
			suffix: ''
		},
		{
			label: slice.primary.label_preis || 'Gesamtpreis',
			value: $variables['Preis'],
			suffix: ''
		},
		{
			label: slice.primary.label_rabatt || 'Rabatt',
			value: $variables['Rabatt'],
			suffix: ' %'
		},
		{
			label: slice.primary.label_anzahlung || 'Anzahlung nach Auftragserteilung',
			value: $variables['AnzahlungBetrag'],
			suffix: ''
		},
		{
			label: slice.primary.label_restbetrag || 'Restpreis nach Veröffentlichung',
			value: $variables['Restbetrag'],
			suffix: ''
		}
	].filter((r) => r.value != null && r.value !== '');
</script>

{#if rows.length > 0}
	<Bounded
		as="section"
		style="color: {pageColor}; background-color: {pageBgColor};"
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		animate={anim.animate}
		animationOptions={anim.options}
	>
		<table class="w-full border-collapse">
			{#each rows as row}
				<tr class="border-b" style="border-color: {pageColor}22;">
					<td class="py-2 pr-8">{row.label}</td>
					<td class="py-2 text-right tabular-nums">{row.value}{row.suffix}</td>
				</tr>
			{/each}
		</table>
	</Bounded>
{/if}
