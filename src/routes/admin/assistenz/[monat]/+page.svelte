<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { tick } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';
	import {
		addMonate,
		berechneMonat,
		fmtChf,
		fmtStunden,
		jahrVonMonat,
		monatName,
		parseStunden,
		type MonatsStunden,
		type Person
	} from '$lib/assistenz';

	export let data: PageData;
	export let form: ActionData;

	/** Raw input per person (strings, as typed) */
	let eingaben: Record<string, { tag: string; nacht: string }> = {};
	let geladen = '';
	let dirty = false;

	// (Re)initialise when another month or a fresh state after saving arrives
	$: if (geladen !== `${data.monat}|${data.daten?.updatedAt ?? ''}`) {
		geladen = `${data.monat}|${data.daten?.updatedAt ?? ''}`;
		eingaben = Object.fromEntries(
			data.config.personen.map((p) => {
				const e = data.daten?.stunden[p.id];
				return [
					p.id,
					{
						tag: e?.tag != null ? String(e.tag) : '',
						nacht: e?.nacht != null ? String(e.nacht) : ''
					}
				];
			})
		);
		dirty = false;
	}

	/** Values as typed → live calculation (invalid input counts as empty) */
	$: vorschau = {
		monat: data.monat,
		stunden: Object.fromEntries(
			Object.entries(eingaben).map(([id, e]) => {
				const tag = parseStunden(e.tag);
				const nacht = parseStunden(e.nacht);
				return [
					id,
					{
						tag: tag !== undefined && !Number.isNaN(tag) ? tag : undefined,
						nacht: nacht !== undefined && !Number.isNaN(nacht) ? nacht : undefined
					}
				];
			})
		)
	} satisfies MonatsStunden;

	$: resultat = berechneMonat(data.config, data.monat, {
		...vorschau,
		// Rows: persons active in the month + persons with stored hours
		stunden: { ...(data.daten?.stunden ?? {}), ...vorschau.stunden }
	});
	$: abzuege = resultat.saetze?.abzuege ?? [];
	$: jahr = jahrVonMonat(data.monat, data.config.jahresbeginn);

	// Saved (also when the month became empty and nothing else changed)
	$: if (form?.saved) dirty = false;

	const ungueltig = (v: string) => Number.isNaN(parseStunden(v));

	let formular: HTMLFormElement;

	/** Removes the hours of one person in this month: empty the row and save right away */
	async function zeileLoeschen(person: Person) {
		const text = $_('Stunden von {name} im {monat} löschen?')
			.replace('{name}', person.name)
			.replace('{monat}', monatName(data.monat));
		if (!confirm(text)) return;
		eingaben[person.id] = { tag: '', nacht: '' };
		dirty = true;
		await tick();
		formular.requestSubmit();
	}

	// Unsaved input: ask before leaving (closing the tab / reloading → browser's own dialog)
	beforeNavigate(({ cancel, type }) => {
		if (!dirty || type === 'form') return;
		if (type === 'leave') cancel();
		else if (!confirm($_('Änderungen nicht gespeichert. Trotzdem verlassen?'))) cancel();
	});

	/** Save without reloading the page: typed values stay on validation errors */
	const speichern: SubmitFunction = () => {
		return async ({ update }) => {
			await update({ reset: false });
		};
	};
</script>

<svelte:head><title>{$_('Assistenz')} · {monatName(data.monat)}</title></svelte:head>

<div class="admin-container">
	<AdminHeader title={$_('Assistenz')}>
		<a href="/admin/assistenz/assistenz.csv?monat={data.monat}" class="admin-btn" download
			>↓ {$_('CSV-Export')}</a
		>
		<a href="/admin/assistenz/einstellungen" class="admin-btn">{$_('Personen & Sätze')}</a>
	</AdminHeader>

	<div class="mb-4 flex flex-wrap items-center gap-3">
		<a
			href="/admin/assistenz/{addMonate(data.monat, -1)}"
			class="admin-btn admin-btn-sm"
			aria-label={$_('Vorheriger Monat')}>←</a
		>
		<h2 class="m-0 text-lg font-semibold">{monatName(data.monat)}</h2>
		<a
			href="/admin/assistenz/{addMonate(data.monat, 1)}"
			class="admin-btn admin-btn-sm"
			aria-label={$_('Nächster Monat')}>→</a
		>
		<a href="/admin/assistenz?jahr={jahr}" class="admin-link ml-auto">{$_('Jahresübersicht')}</a>
	</div>

	{#if form?.error}
		<p class="admin-notice admin-notice-error">{$_(form.error)}</p>
	{:else if form?.saved && !dirty}
		<p class="admin-notice admin-notice-ok">✓ {$_('Gespeichert')}</p>
	{/if}

	{#if resultat.saetze}
		<p class="admin-muted mb-3 text-sm">
			{$_('Tag')} CHF {fmtChf(resultat.saetze.tag)} / {$_('Std.')} · {$_('Nacht')} CHF
			{fmtChf(resultat.saetze.nacht)} / {$_('Std.')}
			{#each abzuege as a}{` · ${a.name} ${fmtStunden(a.prozent)} %`}{/each}
			· {$_('gültig ab')}
			{monatName(resultat.saetze.gueltigAb)}
		</p>
	{:else}
		<p class="admin-notice admin-notice-warn">
			{$_(
				'Für diesen Monat sind keine Stundensätze erfasst — Beträge werden erst danach berechnet.'
			)}
			<a href="/admin/assistenz/einstellungen" class="admin-link">{$_('Personen & Sätze')} →</a>
		</p>
	{/if}

	{#if resultat.zeilen.length === 0}
		<section class="admin-card">
			<p class="admin-empty">
				{$_('In diesem Monat ist keine Person aktiv.')}
				<a href="/admin/assistenz/einstellungen" class="admin-link">{$_('Personen & Sätze')} →</a>
			</p>
		</section>
	{:else}
		<form
			bind:this={formular}
			method="POST"
			action="?/save"
			use:enhance={speichern}
			on:input={() => (dirty = true)}
		>
			<section class="admin-card">
				<div class="admin-table-wrap">
					<table class="admin-table">
						<thead>
							<tr>
								<th>{$_('Person')}</th>
								<th>{$_('Anstellung')}</th>
								<th class="text-right">{$_('Tagstunden')}</th>
								<th class="text-right">{$_('Nachtstunden')}</th>
								<th class="text-right">{$_('Stunden total')}</th>
								<th class="text-right">{$_('Taglohn CHF')}</th>
								<th class="text-right">{$_('Nachtlohn CHF')}</th>
								<th class="text-right">{$_('Lohn brutto CHF')}</th>
								{#each abzuege as a}
									<th class="text-right">{a.name} CHF</th>
								{/each}
								<th class="text-right">{$_('Abzüge total CHF')}</th>
								<th class="text-right">{$_('Lohn netto CHF')}</th>
								<th><span class="sr-only">{$_('Löschen')}</span></th>
							</tr>
						</thead>
						<tbody>
							{#each resultat.zeilen as z (z.person.id)}
								<tr class:admin-row-muted={z.leer}>
									<td class="nowrap">{z.person.name}</td>
									<td>{z.person.anstellung || '–'}</td>
									<td class="text-right">
										<input
											name="tag_{z.person.id}"
											bind:value={eingaben[z.person.id].tag}
											inputmode="decimal"
											class="admin-input w-20 text-right"
											class:border-red-500={ungueltig(eingaben[z.person.id].tag)}
											aria-label="{z.person.name} · {$_('Tagstunden')}"
										/>
									</td>
									<td class="text-right">
										<input
											name="nacht_{z.person.id}"
											bind:value={eingaben[z.person.id].nacht}
											inputmode="decimal"
											class="admin-input w-20 text-right"
											class:border-red-500={ungueltig(eingaben[z.person.id].nacht)}
											aria-label="{z.person.name} · {$_('Nachtstunden')}"
										/>
									</td>
									{#if z.leer}
										<td colspan={6 + abzuege.length}></td>
									{:else}
										<td class="nowrap text-right">{fmtStunden(z.stunden)}</td>
										{#if resultat.saetze}
											<td class="nowrap text-right">{z.tag ? fmtChf(z.taglohn) : ''}</td>
											<td class="nowrap text-right">{z.nacht ? fmtChf(z.nachtlohn) : ''}</td>
											<td class="nowrap text-right">{fmtChf(z.brutto)}</td>
											{#each abzuege as a}
												<td class="nowrap text-right">{fmtChf(z.abzuege[a.name] ?? 0)}</td>
											{/each}
											<td class="nowrap text-right">{fmtChf(z.abzuegeTotal)}</td>
											<td class="nowrap text-right">{fmtChf(z.netto)}</td>
										{:else}
											<td colspan={5 + abzuege.length}></td>
										{/if}
									{/if}
									<td class="nowrap text-right">
										{#if !z.leer || eingaben[z.person.id].tag || eingaben[z.person.id].nacht}
											<button
												type="button"
												class="admin-btn admin-btn-danger admin-btn-sm"
												on:click={() => zeileLoeschen(z.person)}
												aria-label="{z.person.name} · {$_('Löschen')}">{$_('Löschen')}</button
											>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
						<tfoot>
							<tr class="font-semibold">
								<td colspan="2">{$_('Monatstotal')}</td>
								<td class="nowrap text-right">{fmtStunden(resultat.total.tag)}</td>
								<td class="nowrap text-right">{fmtStunden(resultat.total.nacht)}</td>
								<td class="nowrap text-right">{fmtStunden(resultat.total.stunden)}</td>
								{#if resultat.saetze}
									<td class="nowrap text-right">{fmtChf(resultat.total.taglohn)}</td>
									<td class="nowrap text-right">{fmtChf(resultat.total.nachtlohn)}</td>
									<td class="nowrap text-right">{fmtChf(resultat.total.brutto)}</td>
									{#each abzuege as a}
										<td class="nowrap text-right">{fmtChf(resultat.total.abzuege[a.name] ?? 0)}</td>
									{/each}
									<td class="nowrap text-right">{fmtChf(resultat.total.abzuegeTotal)}</td>
									<td class="nowrap text-right">{fmtChf(resultat.total.netto)}</td>
								{:else}
									<td colspan={5 + abzuege.length}></td>
								{/if}
								<td></td>
							</tr>
						</tfoot>
					</table>
				</div>
				<p class="admin-hint">
					{$_('Stunden als Zahl, z.B. 8 oder 8.5. Leere Felder zählen nicht.')}
				</p>
				<div class="mt-4 flex gap-2">
					<button type="submit" class="admin-btn admin-btn-dark">{$_('Speichern')}</button>
				</div>
			</section>
		</form>
	{/if}
</div>
