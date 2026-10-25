<script lang="ts">
	import type { RichTextField } from '@prismicio/client';
	import { _ } from '$lib/stores/i18n';
	import Heading from '$lib/components/Heading.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import Button from '$lib/components/Button.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	/** Formular slice, variation "newsletterSignup" */
	export let primary: {
		heading?: string | null;
		intro_text?: RichTextField;
		show_name_fields?: boolean;
		consent_text?: RichTextField;
		submit_label?: string | null;
		success_text?: RichTextField;
	};
	export let lang: string;
	/** Unique per slice on the page (ids of the inputs) */
	export let idPrefix = 'newsletter';

	let email = '';
	let vorname = '';
	let nachname = '';
	let consent = false;
	let website = ''; // honeypot
	let state: 'idle' | 'sending' | 'done' = 'idle';
	let errorKey = '';

	// Empty rich text fields → built-in default texts
	const EMPTY = [] as unknown as RichTextField;
	$: introText = primary.intro_text ?? EMPTY;
	$: consentText = primary.consent_text ?? EMPTY;
	$: successText = primary.success_text ?? EMPTY;

	async function submit() {
		errorKey = '';
		if (!consent) {
			errorKey = 'Bitte bestätigen Sie, dass Sie Info-Mails erhalten möchten.';
			return;
		}
		state = 'sending';
		try {
			const res = await fetch('/api/newsletter/anmelden', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, vorname, nachname, consent, website, lang })
			});
			if (res.ok) {
				state = 'done';
				return;
			}
			const { error } = await res.json().catch(() => ({ error: '' }));
			errorKey =
				error === 'email'
					? 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
					: 'Die Anmeldung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.';
		} catch {
			errorKey = 'Die Anmeldung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.';
		}
		state = 'idle';
	}
</script>

<div class="newsletter-signup">
	{#if primary.heading}
		<Heading tag="h2" class="mt-0">{primary.heading}</Heading>
	{/if}

	{#if state === 'done'}
		<div role="status">
			{#if successText.length}
				<PrismicRichText field={successText} />
			{:else}
				<p>
					{$_(
						'Fast geschafft! Wir haben Ihnen eine E-Mail geschickt. Bitte bestätigen Sie Ihre Anmeldung über den Link darin.'
					)}
				</p>
			{/if}
		</div>
	{:else}
		{#if introText.length}
			<PrismicRichText field={introText} />
		{/if}

		<form on:submit|preventDefault={submit} class="flex flex-col gap-4 mt-4" novalidate>
			{#if primary.show_name_fields !== false}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<InputField
						field={{ field_name: $_('Vorname'), field_type: 'Textfeld', required: false }}
						inputId="{idPrefix}-vorname"
						bind:value={vorname}
					/>
					<InputField
						field={{ field_name: $_('Nachname'), field_type: 'Textfeld', required: false }}
						inputId="{idPrefix}-nachname"
						bind:value={nachname}
					/>
				</div>
			{/if}
			<InputField
				field={{ field_name: $_('E-Mail'), field_type: 'E-Mail', required: true }}
				inputId="{idPrefix}-email"
				bind:value={email}
			/>

			<!-- Honeypot: hidden from people and screen readers, bots fill it -->
			<div class="honeypot" aria-hidden="true">
				<label for="{idPrefix}-website">Website</label>
				<input
					id="{idPrefix}-website"
					type="text"
					tabindex="-1"
					autocomplete="off"
					bind:value={website}
				/>
			</div>

			<label class="flex items-start gap-3 cursor-pointer" for="{idPrefix}-consent">
				<Checkbox id="{idPrefix}-consent" bind:checked={consent} />
				<span class="consent-text">
					{#if consentText.length}
						<PrismicRichText field={consentText} />
					{:else}
						{$_(
							'Ich möchte Info-Mails erhalten. Die Einwilligung kann ich jederzeit über den Abmelde-Link in jeder E-Mail widerrufen.'
						)}
					{/if}
				</span>
			</label>

			{#if errorKey}
				<p role="alert" class="text-sm" style="color: #dc2626;">{$_(errorKey)}</p>
			{/if}

			<div>
				<Button
					text={state === 'sending'
						? $_('Wird gesendet …')
						: primary.submit_label || $_('Anmelden')}
					mb={false}
					disabled={state === 'sending'}
				/>
			</div>
		</form>
	{/if}
</div>

<style>
	.honeypot {
		position: absolute;
		left: -10000px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	.consent-text :global(p) {
		margin: 0;
	}
</style>
