<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import AdminBulkActions from '$lib/components/admin/AdminBulkActions.svelte';
	import { _ } from '$lib/stores/i18n';
	import { formatDateShort } from '$lib/utils/formatDate';

	export let data: PageData;
	export let form: ActionData;

	const chf = (n: number) =>
		n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const today = () =>
		new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date());

	// Form: new entry, or edit an existing manual entry
	type Entry = PageData['entries'][number];
	let editing: Entry | null = null;
	let typ: 'einnahme' | 'ausgabe' = 'ausgabe';
	let kategorie = '';
	let datum = today();
	let text = '';
	let betrag = '';
	let removeBeleg = false;
	let formCard: HTMLElement;

	function startEdit(entry: Entry) {
		editing = entry;
		typ = entry.typ;
		datum = entry.datum;
		text = entry.text;
		betrag = entry.betrag.toFixed(2);
		removeBeleg = false;
		// after typ so the category list matches
		setTimeout(() => (kategorie = entry.kategorie));
		formCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
	function resetForm() {
		editing = null;
		typ = 'ausgabe';
		kategorie = '';
		datum = today();
		text = '';
		betrag = '';
		removeBeleg = false;
	}
	$: kategorien = data.kategorien[typ];
	$: if (!kategorien.includes(kategorie)) kategorie = '';
	let saving = false;

	// Selection for bulk actions; only manual entries (paid invoices are changed in «Rechnungen»)
	let selectedIds: string[] = [];
	$: selectable = data.entries.filter((b) => !b.rechnungId).map((b) => b.id);
	$: selectedIds = selectedIds.filter((id) => selectable.includes(id));
	$: allSelected = selectable.length > 0 && selectedIds.length === selectable.length;
	$: someSelected = selectedIds.length > 0 && !allSelected;
	$: bulkActions = [
		{ value: 'delete', label: $_('Löschen'), confirm: $_('{n} Einträge löschen?') }
	];
	function resetAfterSave(formElement: HTMLFormElement) {
		// Only the file input needs clearing; all other fields are bound (form.reset() would
		// empty them in the DOM while the variables keep their value)
		const file = formElement.querySelector('input[name=beleg]') as HTMLInputElement | null;
		if (file) file.value = '';
		resetForm();
	}

	$: einnahmen = data.entries.filter((b) => b.typ === 'einnahme');
	$: ausgaben = data.entries.filter((b) => b.typ === 'ausgabe');
	$: sumIn = einnahmen.reduce((s, b) => s + b.betrag, 0);
	$: sumOut = ausgaben.reduce((s, b) => s + b.betrag, 0);

	const MONTHS = [
		'Januar',
		'Februar',
		'März',
		'April',
		'Mai',
		'Juni',
		'Juli',
		'August',
		'September',
		'Oktober',
		'November',
		'Dezember'
	];
	$: months = MONTHS.map((name, i) => {
		const prefix = `${data.year}-${String(i + 1).padStart(2, '0')}`;
		const inMonth = data.entries.filter((b) => b.datum.startsWith(prefix));
		const income = inMonth.filter((b) => b.typ === 'einnahme').reduce((s, b) => s + b.betrag, 0);
		const expense = inMonth.filter((b) => b.typ === 'ausgabe').reduce((s, b) => s + b.betrag, 0);
		return { name, income, expense, count: inMonth.length };
	}).filter((m) => m.count > 0);
</script>

<svelte:head><title>{$_('Buchhaltung')}</title></svelte:head>

<div class="admin-container">
	<AdminHeader title={$_('Buchhaltung')} count={data.entries.length}>
		<select
			class="admin-input w-auto"
			aria-label={$_('Jahr')}
			value={data.year}
			on:change={(e) => goto(`?jahr=${e.currentTarget.value}`)}
		>
			{#each data.years as y}
				<option value={y}>{y}</option>
			{/each}
		</select>
		{#if data.entries.length}
			<a href="/admin/buchhaltung/buchhaltung.csv?jahr={data.year}" class="admin-btn" download>
				↓ {$_('CSV-Export')}
			</a>
		{/if}
	</AdminHeader>

	<p class="admin-intro">
		{$_(
			'Einnahmen und Ausgaben. Bezahlte Rechnungen erscheinen automatisch als Einnahme (Datum = Zahlungsdatum).'
		)}
	</p>

	{#if data.loadError}
		<p class="admin-notice admin-notice-error admin-mono">{$_('Fehler')}: {data.loadError}</p>
	{/if}
	{#if form?.error}
		<p class="admin-notice admin-notice-error">{$_(form.error)}</p>
	{/if}

	<!-- Summary -->
	<section class="admin-card">
		<h2 class="admin-card-title">{$_('Übersicht')} {data.year}</h2>
		<div class="grid gap-4 sm:grid-cols-3">
			<div>
				<p class="admin-muted">{$_('Einnahmen')}</p>
				<p class="text-xl font-semibold">CHF {chf(sumIn)}</p>
			</div>
			<div>
				<p class="admin-muted">{$_('Ausgaben')}</p>
				<p class="text-xl font-semibold">CHF {chf(sumOut)}</p>
			</div>
			<div>
				<p class="admin-muted">{$_('Ergebnis')}</p>
				<p class="text-xl font-semibold" class:text-red-600={sumIn - sumOut < 0}>
					CHF {chf(sumIn - sumOut)}
				</p>
			</div>
		</div>
		{#if months.length}
			<div class="admin-table-wrap mt-4">
				<table class="admin-table">
					<thead>
						<tr>
							<th>{$_('Monat')}</th>
							<th class="text-right">{$_('Einnahmen')}</th>
							<th class="text-right">{$_('Ausgaben')}</th>
							<th class="text-right">{$_('Ergebnis')}</th>
						</tr>
					</thead>
					<tbody>
						{#each months as m}
							<tr>
								<td>{$_(m.name)}</td>
								<td class="text-right">{chf(m.income)}</td>
								<td class="text-right">{chf(m.expense)}</td>
								<td class="text-right">{chf(m.income - m.expense)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<!-- New entry / edit entry -->
	<section class="admin-card" bind:this={formCard}>
		<h2 class="admin-card-title">{editing ? $_('Eintrag bearbeiten') : $_('Neuer Eintrag')}</h2>
		<form
			method="POST"
			action={editing ? '?/update' : '?/create'}
			enctype="multipart/form-data"
			class="grid gap-3 sm:grid-cols-2"
			use:enhance={() => {
				saving = true;
				return async ({ result, update, formElement }) => {
					saving = false;
					await update({ reset: false });
					if (result.type === 'success') resetAfterSave(formElement);
				};
			}}
		>
			{#if editing}<input type="hidden" name="id" value={editing.id} />{/if}
			<label class="admin-label">
				{$_('Typ')}
				<select name="typ" bind:value={typ} class="admin-input">
					<option value="ausgabe">{$_('Ausgabe')}</option>
					<option value="einnahme">{$_('Einnahme')}</option>
				</select>
			</label>
			<label class="admin-label">
				{$_('Datum')}
				<input type="date" name="datum" bind:value={datum} required class="admin-input" />
			</label>
			<label class="admin-label sm:col-span-2">
				{$_('Text')}
				<input
					type="text"
					name="text"
					bind:value={text}
					required
					maxlength="300"
					class="admin-input"
				/>
			</label>
			<label class="admin-label">
				{$_('Betrag (CHF, inkl. MwSt.)')}
				<input
					type="text"
					name="betrag"
					bind:value={betrag}
					inputmode="decimal"
					required
					class="admin-input"
				/>
			</label>
			<label class="admin-label">
				{$_('Kategorie')}
				<select name="kategorie" bind:value={kategorie} required class="admin-input">
					<option value="">{$_('Kategorie wählen …')}</option>
					{#each kategorien as k}
						<option value={k}>{$_(k)}</option>
					{/each}
				</select>
			</label>
			<label class="admin-label sm:col-span-2">
				{$_('Beleg (PDF oder Bild, optional, max. 10 MB)')}
				<input
					type="file"
					name="beleg"
					accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
					class="admin-input"
				/>
			</label>
			{#if editing?.beleg}
				<div class="admin-muted flex sm:col-span-2 flex-wrap items-center gap-3">
					<a
						href="/admin/buchhaltung/beleg/{editing.id}"
						target="_blank"
						rel="noopener"
						class="admin-link">{editing.beleg.name}</a
					>
					<label class="flex items-center gap-1">
						<input
							type="checkbox"
							name="beleg-entfernen"
							bind:checked={removeBeleg}
							class="admin-checkbox"
						/>
						{$_('Beleg entfernen')}
					</label>
				</div>
			{/if}
			<div class="flex gap-2 sm:col-span-2">
				<button type="submit" class="admin-btn admin-btn-primary" disabled={saving}>
					{saving ? $_('Wird gespeichert …') : $_('Speichern')}
				</button>
				{#if editing}
					<button type="button" class="admin-btn" on:click={resetForm}>{$_('Abbrechen')}</button>
				{/if}
			</div>
		</form>
	</section>

	<!-- Bookings -->
	<section class="admin-card">
		<h2 class="admin-card-title">{$_('Buchungen')} {data.year}</h2>
		{#if !data.entries.length}
			<p class="admin-empty">{$_('Keine Buchungen in diesem Jahr.')}</p>
		{:else}
			<AdminBulkActions
				{selectedIds}
				actions={bulkActions}
				formAction="?/bulk"
				on:done={() => (selectedIds = [])}
			/>
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th class="w-8">
								<input
									type="checkbox"
									class="admin-checkbox"
									aria-label={$_('Alle auswählen')}
									checked={allSelected}
									indeterminate={someSelected}
									disabled={!selectable.length}
									on:change={(e) => (selectedIds = e.currentTarget.checked ? [...selectable] : [])}
								/>
							</th>
							<th>{$_('Datum')}</th>
							<th>{$_('Kategorie')}</th>
							<th>{$_('Text')}</th>
							<th class="text-right">{$_('Einnahme')}</th>
							<th class="text-right">{$_('Ausgabe')}</th>
							<th>{$_('Beleg')}</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.entries as b (b.id)}
							<tr>
								<td>
									{#if !b.rechnungId}
										<input
											type="checkbox"
											class="admin-checkbox"
											aria-label={$_('Auswählen')}
											bind:group={selectedIds}
											value={b.id}
										/>
									{/if}
								</td>
								<td class="nowrap">{formatDateShort(b.datum)}</td>
								<td>{$_(b.kategorie)}</td>
								<td>{b.text}</td>
								<td class="text-right nowrap">{b.typ === 'einnahme' ? chf(b.betrag) : ''}</td>
								<td class="text-right nowrap">{b.typ === 'ausgabe' ? chf(b.betrag) : ''}</td>
								<td>
									{#if b.beleg}
										<a
											href="/admin/buchhaltung/beleg/{b.id}"
											target="_blank"
											rel="noopener"
											class="admin-link">{$_('Anzeigen')}</a
										>
									{/if}
								</td>
								<td class="nowrap">
									{#if b.rechnungId}
										<a href="/admin/rechnungen" class="admin-link">{$_('Rechnung')}</a>
									{:else}
										<button type="button" class="admin-link" on:click={() => startEdit(b)}>
											{$_('Bearbeiten')}
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
