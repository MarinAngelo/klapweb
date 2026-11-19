<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';
	import { formatDateShort } from '$lib/utils/formatDate';

	export let data: PageData;
	export let form: ActionData;

	const chf = (n: number) =>
		n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const today = () =>
		new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date());

	// New entry
	let typ: 'einnahme' | 'ausgabe' = 'ausgabe';
	let kategorie = '';
	$: kategorien = data.kategorien[typ];
	$: if (!kategorien.includes(kategorie)) kategorie = '';
	let saving = false;
	function resetAfterSave(formElement: HTMLFormElement) {
		kategorie = '';
		const datum = formElement.querySelector('input[name=datum]') as HTMLInputElement | null;
		if (datum) datum.value = today();
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

	<!-- New entry -->
	<section class="admin-card">
		<h2 class="admin-card-title">{$_('Neuer Eintrag')}</h2>
		<form
			method="POST"
			action="?/create"
			enctype="multipart/form-data"
			class="grid gap-3 sm:grid-cols-2"
			use:enhance={() => {
				saving = true;
				return async ({ result, update, formElement }) => {
					saving = false;
					await update({ reset: result.type === 'success' });
					if (result.type === 'success') resetAfterSave(formElement);
				};
			}}
		>
			<label class="admin-label">
				{$_('Typ')}
				<select name="typ" bind:value={typ} class="admin-input">
					<option value="ausgabe">{$_('Ausgabe')}</option>
					<option value="einnahme">{$_('Einnahme')}</option>
				</select>
			</label>
			<label class="admin-label">
				{$_('Datum')}
				<input type="date" name="datum" value={today()} required class="admin-input" />
			</label>
			<label class="admin-label sm:col-span-2">
				{$_('Text')}
				<input type="text" name="text" required maxlength="300" class="admin-input" />
			</label>
			<label class="admin-label">
				{$_('Betrag (CHF, inkl. MwSt.)')}
				<input type="text" name="betrag" inputmode="decimal" required class="admin-input" />
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
			<div class="sm:col-span-2">
				<button type="submit" class="admin-btn admin-btn-primary" disabled={saving}>
					{saving ? $_('Wird gespeichert …') : $_('Speichern')}
				</button>
			</div>
		</form>
	</section>

	<!-- Bookings -->
	<section class="admin-card">
		<h2 class="admin-card-title">{$_('Buchungen')} {data.year}</h2>
		{#if !data.entries.length}
			<p class="admin-empty">{$_('Keine Buchungen in diesem Jahr.')}</p>
		{:else}
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
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
										<form
											method="POST"
											action="?/delete"
											use:enhance={({ cancel }) => {
												if (!confirm($_('Eintrag löschen?'))) cancel();
											}}
										>
											<input type="hidden" name="id" value={b.id} />
											<button type="submit" class="admin-link-danger">{$_('Löschen')}</button>
										</form>
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
