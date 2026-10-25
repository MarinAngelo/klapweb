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

	const dispatch = createEventDispatcher<{ annehmen: void }>();

	$: isOffen = aufgabe.credit_typ === 'Offen (Zeitbasiert)';
	$: gesperrtDurch = (aufgabe.gesperrt_durch ?? []) as string[];
	$: disabled = loading || !haftungAccepted;
</script>

<div class="flex flex-col gap-3">
	<p class="text-sm opacity-60">
		{isOffen ? $_('Zeitbasiert') : $_('Fest')}
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
		<p class="text-sm opacity-60">{$_('Bereits vergeben')}</p>
	{:else if gesperrtDurch.length > 0}
		<p class="text-sm opacity-60">
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
			class="px-4 py-1.5 text-sm rounded self-start"
			style="background-color: var(--page-color); color: var(--page-bg-color); opacity: {disabled
				? 0.4
				: 1};"
		>
			{loading ? $_('Wird geladen…') : $_('Aufgabe annehmen')}
		</button>
	{/if}
</div>
