<script lang="ts">
	import type { RichTextField } from '@prismicio/client';
	import { _ } from '$lib/stores/i18n';
	import Heading from '$lib/components/Heading.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Button from '$lib/components/Button.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	/** Formular slice, variation "stunden" (time sheet → /api/stunden, admin «Stunden») */
	export let primary: {
		heading?: string | null;
		intro_text?: RichTextField;
		project_options?: string | null;
		submit_label?: string | null;
		success_text?: RichTextField;
	};
	/** Unique per slice on the page (ids of the inputs) */
	export let idPrefix = 'stunden';

	let name = '';
	let von = '';
	let bis = '';
	let projekt = '';
	let taetigkeit = '';
	let spesen = '';
	let spesenText = '';
	let state: 'idle' | 'sending' | 'done' = 'idle';
	let errorKey = '';

	const EMPTY = [] as unknown as RichTextField;
	$: introText = primary.intro_text ?? EMPTY;
	$: successText = primary.success_text ?? EMPTY;
	$: projectOptions = (primary.project_options ?? '')
		.split(',')
		.map((p) => p.trim())
		.filter(Boolean);

	/** Duration preview «2 Std. 30 Min.» while typing */
	$: minutes =
		von && bis ? Math.round((Date.parse(`${bis}:00Z`) - Date.parse(`${von}:00Z`)) / 60000) : 0;
	$: durationLabel =
		minutes > 0 ? `${Math.floor(minutes / 60)} ${$_('Std.')} ${minutes % 60} ${$_('Min.')}` : '';

	// «Bis» starts on the same day as «Von» (saves typing the date twice)
	function onVonChange() {
		if (von && (!bis || bis.slice(0, 10) !== von.slice(0, 10)))
			bis = `${von.slice(0, 10)}T${bis.slice(11) || von.slice(11)}`;
	}

	async function submit() {
		errorKey = '';
		state = 'sending';
		try {
			const res = await fetch('/api/stunden', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, von, bis, projekt, taetigkeit, spesen, spesenText })
			});
			if (res.ok) {
				state = 'done';
				return;
			}
			const { error } = await res.json().catch(() => ({ error: '' }));
			errorKey = error || 'Der Eintrag konnte nicht gespeichert werden.';
		} catch {
			errorKey = 'Der Eintrag konnte nicht gespeichert werden.';
		}
		state = 'idle';
	}

	/** Next entry: keep name and project, clear the rest */
	function nextEntry() {
		von = bis = taetigkeit = spesen = spesenText = '';
		state = 'idle';
	}
</script>

<div class="stunden-erfassung">
	{#if primary.heading}
		<Heading tag="h2" class="mt-0">{primary.heading}</Heading>
	{/if}

	{#if state === 'done'}
		<div role="status" class="flex flex-col gap-4">
			{#if successText.length}
				<PrismicRichText field={successText} />
			{:else}
				<p>{$_('Der Eintrag wurde gespeichert.')}</p>
			{/if}
			<div>
				<Button
					link={undefined}
					mb={false}
					text={$_('Weiteren Eintrag erfassen')}
					on:click={nextEntry}
				/>
			</div>
		</div>
	{:else}
		{#if introText.length}
			<PrismicRichText field={introText} />
		{/if}

		<form on:submit|preventDefault={submit} class="flex flex-col gap-4 mt-4">
			<InputField
				field={{ field_name: $_('Name'), field_type: 'Textfeld', required: true }}
				inputId="{idPrefix}-name"
				bind:value={name}
			/>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-base font-bold" for="{idPrefix}-von">{$_('Von')} *</label>
					<input
						id="{idPrefix}-von"
						type="datetime-local"
						required
						bind:value={von}
						on:change={onVonChange}
						class="input form-input rounded-md w-full"
					/>
				</div>
				<div>
					<label class="block text-base font-bold" for="{idPrefix}-bis">{$_('Bis')} *</label>
					<input
						id="{idPrefix}-bis"
						type="datetime-local"
						required
						min={von || undefined}
						bind:value={bis}
						class="input form-input rounded-md w-full"
					/>
				</div>
			</div>
			{#if durationLabel}
				<p class="text-muted m-0 text-sm">{$_('Dauer')}: {durationLabel}</p>
			{/if}

			{#if projectOptions.length}
				<InputField
					field={{
						field_name: $_('Projekt / Kunde'),
						field_type: 'Auswahlliste',
						required: false,
						options: projectOptions.join(',')
					}}
					inputId="{idPrefix}-projekt"
					bind:value={projekt}
				/>
			{:else}
				<InputField
					field={{ field_name: $_('Projekt / Kunde'), field_type: 'Textfeld', required: false }}
					inputId="{idPrefix}-projekt"
					bind:value={projekt}
				/>
			{/if}

			<InputField
				field={{ field_name: $_('Tätigkeit'), field_type: 'Textbereich', required: false }}
				inputId="{idPrefix}-taetigkeit"
				bind:value={taetigkeit}
			/>

			<div class="grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-4 items-start">
				<div>
					<label class="block text-base font-bold" for="{idPrefix}-spesen"
						>{$_('Spesen (CHF)')}</label
					>
					<input
						id="{idPrefix}-spesen"
						type="number"
						min="0"
						step="0.05"
						inputmode="decimal"
						placeholder="0.00"
						bind:value={spesen}
						class="input form-input rounded-md w-full"
					/>
				</div>
				<InputField
					field={{
						field_name: $_('Spesen-Beschreibung'),
						field_type: 'Textfeld',
						required: false,
						placeholder: $_('z.B. Zugbillett, Parkgebühr')
					}}
					inputId="{idPrefix}-spesen-text"
					bind:value={spesenText}
				/>
			</div>

			{#if errorKey}
				<p role="alert" class="text-sm text-red-600">{$_(errorKey)}</p>
			{/if}

			<div>
				<Button
					link={undefined}
					mb={false}
					disabled={state === 'sending'}
					text={state === 'sending'
						? $_('Wird gespeichert …')
						: primary.submit_label || $_('Eintrag speichern')}
				/>
			</div>
		</form>
	{/if}
</div>
