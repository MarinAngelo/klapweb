<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { variables } from '$lib/stores/variables';
	import { addonRows } from '$lib/stores/addonRows';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import { mapAnimation } from '$lib/utils/animationMapper';

	export let slice: any;
	export let slices: any;
	export let context: any;
	export let index: any;
	const p = slice.primary ?? ({} as any);

	const { pageColor, pageBgColor } = get(theme);

	$: anim = mapAnimation(
		p.animate,
		p.anim_direction,
		p.anim_delay,
		p.anim_duration
	);
	$: mobileVollbreite = (slice.primary as any).mobile_vollbreite ?? false;

	const billingTypeSuffix: Record<string, string> = {
		Einmalig: 'Einmalig',
		Jährlich: 'pro Jahr',
		Monatlich: 'pro Monat'
	};

	function withBillingType(base: string, bt: string | null | undefined): string {
		if (!bt) return base;
		const suffix = billingTypeSuffix[bt] ?? bt;
		return `${base} (${suffix})`;
	}

	// Rows: only shown when their token is present in the store.
	$: mainRows = [
		{
			label: withBillingType(
				p.label_preis || 'Gesamtpreis',
				$variables['Abrechnungsart']
			),
			value: $variables['Preis'],
			suffix: ''
		},
		{
			label: p.label_rabatt || 'Rabatt',
			value: $variables['Rabatt'],
			suffix: ' %'
		},
		{
			label: p.label_anzahlung || 'Anzahlung nach Auftragserteilung',
			value: $variables['AnzahlungBetrag'],
			suffix: ''
		},
		{
			label: p.label_restbetrag || 'Restpreis nach Veröffentlichung',
			value: $variables['Restbetrag'],
			suffix: ''
		}
	].filter((r) => r.value != null && r.value !== '');

	$: addonRowsFormatted = $addonRows.map((a) => ({
		label: withBillingType(a.label, a.billingType),
		value: a.price,
		suffix: ''
	}));
</script>

{#if mainRows.length > 0 || addonRowsFormatted.length > 0}
	<Bounded
		as="section"
		style="color: {pageColor}; background-color: {pageBgColor};"
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		animate={anim.animate}
		animationOptions={anim.options}
		class="{mobileVollbreite ? 'overflow-x-clip' : ''}"
	>
		<div class="{mobileVollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}">
		<table class="w-full border-collapse">
			{#each mainRows as row}
				<tr class="border-b" style="border-color: {pageColor}22;">
					<td class="py-2 pr-8">{row.label}</td>
					<td class="py-2 text-right tabular-nums">{row.value}{row.suffix}</td>
				</tr>
			{/each}
			{#each addonRowsFormatted as row}
				<tr class="border-b" style="border-color: {pageColor}22;">
					<td class="py-2 pr-8">{row.label}</td>
					<td class="py-2 text-right tabular-nums">{row.value}</td>
				</tr>
			{/each}
			{#if $variables['Total'] && addonRowsFormatted.length > 0}
				<tr>
					<td class="pt-3 pr-8 font-bold">{p.label_total || 'Total'}</td>
					<td class="pt-3 text-right tabular-nums font-bold">{$variables['Total']}</td>
				</tr>
			{/if}
		</table>
		</div>
	</Bounded>
{/if}
