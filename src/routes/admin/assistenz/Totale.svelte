<script lang="ts">
	/** Key figures of a month or year, visible without scrolling the wide tables */
	import { _ } from '$lib/stores/i18n';
	import { fmtChf, rappen, type Betraege } from '$lib/assistenz';

	export let total: Betraege;
	/** e.g. «Monatstotal» / «Jahrestotal» (already translated) */
	export let titel: string;

	$: quellensteuer = rappen(total.abzuegeTotal - total.sozialabzuege);
	$: kennzahlen = [
		{ label: 'Lohn brutto CHF', wert: total.brutto },
		{ label: 'Sozialabzüge CHF', wert: total.sozialabzuege },
		{ label: 'Quellensteuer CHF', wert: quellensteuer },
		{ label: 'Abzüge total CHF', wert: total.abzuegeTotal },
		{ label: 'Lohn netto CHF', wert: total.netto }
	];
</script>

<h2 class="mb-2 text-base font-semibold">{titel}</h2>
<div class="admin-stats mb-4 md:grid-cols-5">
	{#each kennzahlen as k (k.label)}
		<div class="admin-stat">
			<span class="admin-stat-value">{fmtChf(k.wert)}</span>
			<span class="admin-stat-label">{$_(k.label)}</span>
		</div>
	{/each}
</div>
