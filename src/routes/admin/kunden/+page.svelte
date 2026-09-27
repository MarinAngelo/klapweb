<script lang="ts">
	import type { PageData } from './$types';
	import Button from '$lib/components/Button.svelte';
	import { _ } from '$lib/stores/i18n';
	export let data: PageData;

	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	// Column headers are i18n keys
	const cols = ['Datum', 'Name', 'E-Mail', 'Firma', 'Adresse', 'Sprache', 'Quelle', ''];
	$: secret = $page.url.searchParams.get('secret') ?? '';

	const inputStyle =
		'width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;';
	const labelStyle =
		'display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;';

	let isFormOpen = false;
	let vorname = '';
	let nachname = '';
	let firma = '';
	let email = '';
	let adresse = '';
	let plz = '';
	let ort = '';
	let land = '';
	// Default: Prismic master language (first entry)
	let lang = data.languages[0]?.id ?? '';
	let isLoading = false;

	function confirmDelete(e: SubmitEvent, name: string) {
		if (!confirm(`${name} ${$_('wirklich löschen?')}`)) return;
		(e.currentTarget as HTMLFormElement).submit();
	}

	// Submit the row form as soon as a language is chosen
	function submitOnChange(event: Event) {
		(event.currentTarget as HTMLSelectElement).form?.requestSubmit();
	}

	function fmt(c: (typeof data.customers)[0]) {
		const name = [c.vorname, c.nachname].filter(Boolean).join(' ') || '–';
		const date = new Date(c.date).toLocaleString('de-CH', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
		const adresse = [c.adresse, c.plz, c.ort].filter(Boolean).join(', ') || '–';
		const quelle =
			c.paymentMethod === 'manuell'
				? 'Manuell erfasst'
				: c.paymentMethod === 'terminbuchung'
					? 'Terminbuchung'
					: 'E-Commerce';
		return { date, name, email: c.email ?? '–', firma: c.firma ?? '–', adresse, quelle };
	}

	const handleCreate: SubmitFunction = async () => {
		isLoading = true;

		return async ({ result }) => {
			isLoading = false;
			if (result.type === 'success') {
				alert($_('Kunde erfasst'));
				vorname = '';
				nachname = '';
				firma = '';
				email = '';
				adresse = '';
				plz = '';
				ort = '';
				land = '';
				lang = data.languages[0]?.id ?? '';
				isFormOpen = false;
				// Reload to show new customer
				location.reload();
			} else if (result.type === 'failure') {
				alert(`${$_('Fehler beim Erfassen')}: ${result.data?.message || $_('Unbekannter Fehler')}`);
			} else if (result.type === 'error') {
				alert(`${$_('Fehler beim Erfassen')}: ${result.error?.message || $_('Server-Fehler')}`);
			} else {
				alert(`${$_('Fehler beim Erfassen')}: ${$_('Unbekannter Fehler')}`);
			}
		};
	};

	const handleSetLang: SubmitFunction = () => {
		return async ({ result, update }) => {
			if (result.type === 'failure' || result.type === 'error') {
				alert($_('Sprache konnte nicht gespeichert werden'));
			}
			await update({ reset: false });
		};
	};
</script>

<svelte:head><title>{$_('Kundenliste')}</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 1200px; margin: 0 auto;">
	<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
		<h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">
			{$_('Kunden')} ({data.customers.length})
		</h1>
		<div style="margin-left: auto; display: flex; gap: 0.5rem; align-items: center;">
			<Button
				href="/admin/dashboard?secret={secret}"
				text={$_('Dashboard')}
				leadingIcon="left"
				color="#374151"
				bgColor="transparent"
				hoverColor="#111827"
				hoverBgColor="transparent"
				size="sm"
				mb={false}
			/>
			<form
				method="POST"
				action="?/deleteAll&secret={secret}"
				on:submit={(e) => {
					if (!confirm($_('Alle Kunden löschen?'))) e.preventDefault();
				}}
			>
				<input type="hidden" name="secret" value={secret} />
				<Button
					text={$_('Alle löschen')}
					color="#dc2626"
					bgColor="transparent"
					hoverColor="#991b1b"
					hoverBgColor="transparent"
					size="sm"
					mb={false}
				/>
			</form>
		</div>
	</div>

	{#if data.blobError}
		<p style="color: red; font-family: monospace; font-size: 0.8rem;">
			{$_('Fehler')}: {data.blobError}
		</p>
	{/if}

	<!-- Neuer Kunde Form -->
	<div
		style="margin-bottom: 2rem; background: #f9fafb; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e5e7eb;"
	>
		<button
			on:click={() => (isFormOpen = !isFormOpen)}
			style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer; font-weight: 500;"
		>
			{isFormOpen ? `✕ ${$_('Formular schliessen')}` : `+ ${$_('Neuer Kunde')}`}
		</button>

		{#if isFormOpen}
			<form
				method="POST"
				action="?/create&secret={secret}"
				use:enhance={handleCreate}
				style="margin-top: 1rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;"
			>
				<input type="hidden" name="secret" value={secret} />

				<div style="grid-column: 1;">
					<label for="kunde-vorname" style={labelStyle}>{$_('Vorname')} *</label>
					<input
						id="kunde-vorname"
						type="text"
						name="vorname"
						bind:value={vorname}
						required
						style={inputStyle}
					/>
				</div>

				<div style="grid-column: 2;">
					<label for="kunde-nachname" style={labelStyle}>{$_('Nachname')} *</label>
					<input
						id="kunde-nachname"
						type="text"
						name="nachname"
						bind:value={nachname}
						required
						style={inputStyle}
					/>
				</div>

				<div style="grid-column: 1;">
					<label for="kunde-firma" style={labelStyle}>{$_('Firma')}</label>
					<input id="kunde-firma" type="text" name="firma" bind:value={firma} style={inputStyle} />
				</div>

				<div style="grid-column: 2;">
					<label for="kunde-email" style={labelStyle}>{$_('E-Mail')}</label>
					<input id="kunde-email" type="email" name="email" bind:value={email} style={inputStyle} />
				</div>

				<div style="grid-column: 1 / -1;">
					<label for="kunde-adresse" style={labelStyle}>{$_('Adresse')}</label>
					<input
						id="kunde-adresse"
						type="text"
						name="adresse"
						bind:value={adresse}
						style={inputStyle}
					/>
				</div>

				<div style="grid-column: 1;">
					<label for="kunde-plz" style={labelStyle}>{$_('PLZ')}</label>
					<input id="kunde-plz" type="text" name="plz" bind:value={plz} style={inputStyle} />
				</div>

				<div style="grid-column: 2;">
					<label for="kunde-ort" style={labelStyle}>{$_('Ort')}</label>
					<input id="kunde-ort" type="text" name="ort" bind:value={ort} style={inputStyle} />
				</div>

				<div style="grid-column: 1;">
					<label for="kunde-land" style={labelStyle}>{$_('Land')}</label>
					<input id="kunde-land" type="text" name="land" bind:value={land} style={inputStyle} />
				</div>

				<div style="grid-column: 2;">
					<label for="kunde-lang" style={labelStyle}>{$_('Sprache')}</label>
					<select id="kunde-lang" name="lang" bind:value={lang} style={inputStyle}>
						{#each data.languages as language}
							<option value={language.id}>{language.name}</option>
						{/each}
					</select>
				</div>

				<div style="grid-column: 1 / -1; display: flex; gap: 0.5rem;">
					<button
						type="submit"
						disabled={isLoading}
						style="background: #10b981; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer; font-weight: 500; disabled-opacity: 0.5;"
					>
						{isLoading ? $_('Wird gespeichert …') : `✓ ${$_('Speichern')}`}
					</button>
				</div>
			</form>
		{/if}
	</div>

	{#if data.customers.length === 0}
		<p style="opacity: 0.5;">{$_('Noch keine Einträge.')}</p>
	{:else}
		<div style="overflow-x: auto;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each cols as col}
							<th style="padding: 0.5rem 0.75rem; white-space: nowrap;">{col ? $_(col) : ''}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.customers as c (c.id)}
						{@const r = fmt(c)}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style="padding: 0.5rem 0.75rem; white-space: nowrap; opacity: 0.6;">{r.date}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.name}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.email}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.firma}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.adresse}</td>
							<td style="padding: 0.5rem 0.75rem;">
								<form method="POST" action="?/setLang&secret={secret}" use:enhance={handleSetLang}>
									<input type="hidden" name="id" value={c.id} />
									<select
										name="lang"
										value={c.lang ?? ''}
										on:change={submitOnChange}
										aria-label={$_('Sprache')}
										style="padding: 0.25rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.8rem;"
									>
										<option value="">–</option>
										{#each data.languages as language}
											<option value={language.id}>{language.name}</option>
										{/each}
									</select>
								</form>
							</td>
							<td style="padding: 0.5rem 0.75rem; white-space: nowrap;">{$_(r.quelle)}</td>
							<td style="padding: 0.5rem 0.75rem;">
								<form
									method="POST"
									action="?/delete&secret={secret}"
									on:submit|preventDefault={(e) => confirmDelete(e, r.name)}
								>
									<input type="hidden" name="id" value={c.id} />
									<button
										type="submit"
										style="color: #dc2626; font-size: 0.75rem; background: none; border: none; cursor: pointer; padding: 0;"
									>
										{$_('Löschen')}
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
