<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import { _ } from '$lib/stores/i18n';

	/** Task (shape of /api/aufgaben-liste) */
	export let aufgabe: any;
	export let loading = false;
	export let error = '';
	export let accepted = false; // already accepted by this booking (not yet done)
	export let haftungAccepted = false;
	export let haftungsausschlussUrl = '/haftungsausschluss';
	/** Rate of the booking for time-based credits */
	export let tarif: { chfProMinute: number | null; eurProMinute: number | null } | null = null;

	const dispatch = createEventDispatcher<{ annehmen: void }>();

	$: isOffen = aufgabe.credit_typ === 'Offen (Zeitbasiert)';
	$: gesperrtDurch = (aufgabe.gesperrt_durch ?? []) as string[];
	$: disabled = loading || !haftungAccepted;

	// Shown in EUR (today's rate); CHF if no exchange rate is available
	$: tarifText = (() => {
		const eur = tarif?.eurProMinute;
		const chf = tarif?.chfProMinute;
		const value = eur ?? chf;
		if (value == null) return '';
		const amount = new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: eur != null ? 'EUR' : 'CHF'
		}).format(value);
		return `${amount} / ${$_('Min.')}`;
	})();
</script>

<div class="flex flex-col gap-3">
	<p class="text-sm">
		<span class="text-muted">{$_('Credit-Typ')}:</span>
		<span class="font-semibold">{isOffen ? $_('Zeitbasiert') : $_('Fest')}</span>
		{#if isOffen && tarifText}
			<span>({tarifText})</span>
		{/if}
		{#if !isOffen && aufgabe.credit_betrag != null}
			· {aufgabe.credit_betrag} {$_('Credits')}
		{/if}
	</p>
	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}

	{#if accepted}
		<p class="text-sm font-medium">{$_('Von dir angenommen')}</p>
	{:else if aufgabe.vergeben}
		<p class="text-sm text-muted">{$_('Bereits vergeben')}</p>
	{:else if gesperrtDurch.length > 0}
		<p class="text-sm text-muted">
			{$_('Verfügbar, sobald erledigt:')}
			{gesperrtDurch.join(', ')}
		</p>
	{:else}
		<label for="haftung-{aufgabe.uid}" class="flex items-start gap-2 cursor-pointer text-sm">
			<Checkbox id="haftung-{aufgabe.uid}" bind:checked={haftungAccepted} />
			<span>
				{$_('Ich habe den')}
				<a href={haftungsausschlussUrl} target="_blank" class="underline"
					>{$_('Haftungsausschluss')}</a
				>
				{$_('gelesen und akzeptiere diesen.')}
			</span>
		</label>
		<button
			type="button"
			{disabled}
			on:click={() => dispatch('annehmen')}
			class="btn-solid px-4 py-1.5 text-sm rounded self-start"
		>
			{loading ? $_('Wird geladen…') : $_('Aufgabe annehmen')}
		</button>
	{/if}
</div>
