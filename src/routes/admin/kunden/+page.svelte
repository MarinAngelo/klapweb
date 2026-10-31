<script lang="ts">
	import type { PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';
	export let data: PageData;

	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	// Column headers are i18n keys
	const cols = ['Datum', 'Name', 'E-Mail', 'Firma', 'Adresse', 'Sprache', 'Quelle', ''];

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

<div class="admin-container">
	<AdminHeader title={$_('Kunden')} count={data.customers.length}>
		<form
			method="POST"
			action="?/deleteAll"
			on:submit={(e) => {
				if (!confirm($_('Alle Kunden löschen?'))) e.preventDefault();
			}}
		>
			<button type="submit" class="admin-btn admin-btn-danger-outline">{$_('Alle löschen')}</button>
		</form>
	</AdminHeader>

	{#if data.blobError}
		<p class="admin-notice admin-notice-error admin-mono">{$_('Fehler')}: {data.blobError}</p>
	{/if}

	<!-- Neuer Kunde -->
	<section class="admin-card">
		<button
			type="button"
			on:click={() => (isFormOpen = !isFormOpen)}
			class="admin-btn admin-btn-primary"
		>
			{isFormOpen ? `✕ ${$_('Formular schliessen')}` : `+ ${$_('Neuer Kunde')}`}
		</button>

		{#if isFormOpen}
			<form
				method="POST"
				action="?/create"
				use:enhance={handleCreate}
				class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
			>
				<div>
					<label for="kunde-vorname" class="admin-label">{$_('Vorname')} *</label>
					<input
						id="kunde-vorname"
						type="text"
						name="vorname"
						bind:value={vorname}
						required
						class="admin-input"
					/>
				</div>
				<div>
					<label for="kunde-nachname" class="admin-label">{$_('Nachname')} *</label>
					<input
						id="kunde-nachname"
						type="text"
						name="nachname"
						bind:value={nachname}
						required
						class="admin-input"
					/>
				</div>
				<div>
					<label for="kunde-firma" class="admin-label">{$_('Firma')}</label>
					<input id="kunde-firma" type="text" name="firma" bind:value={firma} class="admin-input" />
				</div>
				<div>
					<label for="kunde-email" class="admin-label">{$_('E-Mail')}</label>
					<input
						id="kunde-email"
						type="email"
						name="email"
						bind:value={email}
						class="admin-input"
					/>
				</div>
				<div class="md:col-span-2">
					<label for="kunde-adresse" class="admin-label">{$_('Adresse')}</label>
					<input
						id="kunde-adresse"
						type="text"
						name="adresse"
						bind:value={adresse}
						class="admin-input"
					/>
				</div>
				<div>
					<label for="kunde-plz" class="admin-label">{$_('PLZ')}</label>
					<input id="kunde-plz" type="text" name="plz" bind:value={plz} class="admin-input" />
				</div>
				<div>
					<label for="kunde-ort" class="admin-label">{$_('Ort')}</label>
					<input id="kunde-ort" type="text" name="ort" bind:value={ort} class="admin-input" />
				</div>
				<div>
					<label for="kunde-land" class="admin-label">{$_('Land')}</label>
					<input id="kunde-land" type="text" name="land" bind:value={land} class="admin-input" />
				</div>
				<div>
					<label for="kunde-lang" class="admin-label">{$_('Sprache')}</label>
					<select id="kunde-lang" name="lang" bind:value={lang} class="admin-input">
						{#each data.languages as language}
							<option value={language.id}>{language.name}</option>
						{/each}
					</select>
				</div>

				<div class="md:col-span-2">
					<button type="submit" disabled={isLoading} class="admin-btn admin-btn-success">
						{isLoading ? $_('Wird gespeichert …') : `✓ ${$_('Speichern')}`}
					</button>
				</div>
			</form>
		{/if}
	</section>

	<section class="admin-card">
		{#if data.customers.length === 0}
			<p class="admin-empty">{$_('Noch keine Einträge.')}</p>
		{:else}
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							{#each cols as col}
								<th>{col ? $_(col) : ''}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each data.customers as c (c.id)}
							{@const r = fmt(c)}
							<tr>
								<td class="nowrap admin-muted">{r.date}</td>
								<td>{r.name}</td>
								<td>{r.email}</td>
								<td>{r.firma}</td>
								<td>{r.adresse}</td>
								<td>
									<form method="POST" action="?/setLang" use:enhance={handleSetLang}>
										<input type="hidden" name="id" value={c.id} />
										<select
											name="lang"
											value={c.lang ?? ''}
											on:change={submitOnChange}
											aria-label={$_('Sprache')}
											class="admin-input admin-input-sm"
										>
											<option value="">–</option>
											{#each data.languages as language}
												<option value={language.id}>{language.name}</option>
											{/each}
										</select>
									</form>
								</td>
								<td class="nowrap">{$_(r.quelle)}</td>
								<td>
									<form
										method="POST"
										action="?/delete"
										on:submit|preventDefault={(e) => confirmDelete(e, r.name)}
									>
										<input type="hidden" name="id" value={c.id} />
										<button type="submit" class="admin-link-danger text-xs">{$_('Löschen')}</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
