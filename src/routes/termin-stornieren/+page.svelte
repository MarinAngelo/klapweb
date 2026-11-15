<script lang="ts">
	import { enhance } from '$app/forms';
	import { _ } from '$lib/stores/i18n';
	import Bounded from '$lib/components/Bounded.svelte';
	import Button from '$lib/components/Button.svelte';
	import { formatPrice } from '$lib/pricing';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let submitting = false;
	let acceptFee = false;

	const fill = (text: string, values: Record<string, string | number>) =>
		text.replace(/\{(\w+)\}/g, (_m, key) => String(values[key] ?? ''));

	$: terms = data.state === 'ok' ? data.terms : null;
	$: error = form && 'error' in form ? form.error : null;
	$: state = error === 'gone' ? 'gone' : data.state;
</script>

<svelte:head><title>{$_('Termin stornieren')}</title></svelte:head>

<Bounded as="section" yPadding="lg">
	<div class="max-w-prose mx-auto">
		<h1>{$_('Termin stornieren')}</h1>

		{#if form && 'cancelled' in form && form.cancelled}
			<p>{$_('Ihre Buchung wurde storniert. Der Termin ist wieder verfügbar.')}</p>
			{#if form.withFee}
				<p>{$_('Die Rechnung für die Stornogebühr erhalten Sie per E-Mail.')}</p>
			{/if}
			<div class="mt-8"><Button href="/" text={$_('Zurück zur Homepage')} /></div>
		{:else if state === 'gone'}
			<p>{$_('Diese Buchung wurde bereits storniert oder existiert nicht mehr.')}</p>
		{:else if state === 'invalid'}
			<p>{$_('Der Stornierungs-Link ist ungültig.')}</p>
		{:else if state === 'error'}
			<p class="text-red-600">
				{$_('Die Buchung konnte nicht geprüft werden. Bitte versuchen Sie es später erneut.')}
			</p>
		{:else if data.state === 'ok' && terms}
			<p><strong>{$_('Angebot')}:</strong> {data.titel}</p>
			<p><strong>{$_('Datum')}:</strong> {data.datum}</p>

			{#if terms.status === 'past'}
				<p class="mt-6">
					{$_('Dieser Termin hat bereits begonnen und kann nicht mehr storniert werden.')}
				</p>
			{:else if terms.status === 'contact'}
				<p class="mt-6">
					{fill($_('Die kostenlose Stornierung war bis {datum} Uhr möglich.'), {
						datum: terms.freeUntilLabel ?? ''
					})}
					{$_('Eine Online-Stornierung ist nicht mehr möglich. Bitte kontaktieren Sie uns direkt.')}
				</p>
				{#if data.contactEmail}
					<p><a href="mailto:{data.contactEmail}">{data.contactEmail}</a></p>
				{/if}
			{:else}
				<form
					method="POST"
					class="mt-6"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
				>
					{#if terms.status === 'free'}
						{#if terms.freeUntilLabel}
							<p>
								{fill($_('Kostenlos stornierbar bis {datum} Uhr.'), {
									datum: terms.freeUntilLabel
								})}
							</p>
						{/if}
					{:else if terms.status === 'fee' && terms.fee && terms.price}
						<p>
							{fill($_('Die kostenlose Stornierung war bis {datum} Uhr möglich.'), {
								datum: terms.freeUntilLabel ?? ''
							})}
						</p>
						<p>
							<strong
								>{fill($_('Stornogebühr: {betrag} ({prozent}% von {preis})'), {
									betrag: formatPrice(terms.fee, 'CHF'),
									prozent: terms.feePercent ?? '',
									preis: formatPrice(terms.price, 'CHF')
								})}</strong
							>
						</p>
						<label class="mt-4 flex items-start gap-2">
							<input type="checkbox" name="acceptFee" bind:checked={acceptFee} class="mt-1" />
							<span>{$_('Ich akzeptiere die Stornogebühr und erhalte dafür eine Rechnung.')}</span>
						</label>
					{/if}
					{#if error === 'fee_not_accepted'}
						<p class="text-red-600">{$_('Bitte bestätigen Sie die Stornogebühr.')}</p>
					{:else if error === 'past' || error === 'contact'}
						<p class="text-red-600">
							{$_(
								'Die Stornierungsfrist ist inzwischen abgelaufen. Bitte laden Sie die Seite neu.'
							)}
						</p>
					{/if}
					<div class="mt-6">
						<Button
							text={terms.status === 'fee'
								? $_('Kostenpflichtig stornieren')
								: $_('Buchung stornieren')}
							disabled={submitting || (terms.status === 'fee' && !acceptFee)}
						/>
					</div>
				</form>
			{/if}
		{/if}
	</div>
</Bounded>
