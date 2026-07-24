<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	const cols = ['Datum', 'Name', 'E-Mail', 'Firma', 'Adresse', 'Quelle', ''];
	$: secret = $page.url.searchParams.get('secret') ?? '';

	let isFormOpen = false;
	let vorname = '';
	let nachname = '';
	let firma = '';
	let email = '';
	let adresse = '';
	let plz = '';
	let ort = '';
	let land = '';
	let isLoading = false;

	function confirmDelete(e: SubmitEvent, name: string) {
		if (!confirm(`${name} wirklich löschen?`)) return;
		(e.currentTarget as HTMLFormElement).submit();
	}

	function fmt(c: (typeof data.customers)[0]) {
		const name = [c.vorname, c.nachname].filter(Boolean).join(' ') || '–';
		const date = new Date(c.date).toLocaleString('de-CH', {
			day: '2-digit', month: '2-digit', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
		const adresse = [c.adresse, c.plz, c.ort].filter(Boolean).join(', ') || '–';
		const quelle = c.paymentMethod === 'manuell' ? 'Manuell erfasst' : 'E-Commerce';
		return { date, name, email: c.email ?? '–', firma: c.firma ?? '–', adresse, quelle };
	}

	const handleCreate: SubmitFunction = async ({ formData }) => {
		isLoading = true;

		return async ({ result }) => {
			isLoading = false;
			if (result.type === 'success') {
				alert('Kunde erfasst');
				vorname = '';
				nachname = '';
				firma = '';
				email = '';
				adresse = '';
				plz = '';
				ort = '';
				land = '';
				isFormOpen = false;
				// Reload to show new customer
				location.reload();
			} else if (result.type === 'failure') {
				alert('Fehler beim Erfassen: ' + (result.data?.message || 'Unbekannter Fehler'));
			} else if (result.type === 'error') {
				alert('Fehler beim Erfassen: ' + (result.error?.message || 'Server-Fehler'));
			} else {
				alert('Fehler beim Erfassen: Unbekannter Fehler');
			}
		};
	};
</script>

<svelte:head><title>Kundenliste</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 1200px; margin: 0 auto;">
	<div style="display: flex; align-items: baseline; gap: 2rem; margin-bottom: 1.5rem;">
		<a href="/admin/dashboard?secret={secret}" style="font-size: 0.875rem; color: #6b7280;">← Dashboard</a>
		<h1 style="font-size: 1.5rem; font-weight: bold;">Kunden ({data.customers.length})</h1>
	</div>

	{#if data.blobError}
		<p style="color: red; font-family: monospace; font-size: 0.8rem;">Fehler: {data.blobError}</p>
	{/if}

	<!-- Neuer Kunde Form -->
	<div style="margin-bottom: 2rem; background: #f9fafb; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
		<button
			on:click={() => (isFormOpen = !isFormOpen)}
			style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer; font-weight: 500;"
		>
			{isFormOpen ? '✕ Formular schliessen' : '+ Neuer Kunde'}
		</button>

		{#if isFormOpen}
			<form method="POST" action="?/create&secret={secret}" use:enhance={handleCreate} style="margin-top: 1rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
				<input type="hidden" name="secret" value={secret} />

				<div style="grid-column: 1;">
					<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Vorname *</label>
					<input type="text" name="vorname" bind:value={vorname} required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
				</div>

				<div style="grid-column: 2;">
					<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Nachname *</label>
					<input type="text" name="nachname" bind:value={nachname} required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
				</div>

				<div style="grid-column: 1;">
					<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Firma</label>
					<input type="text" name="firma" bind:value={firma} style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
				</div>

				<div style="grid-column: 2;">
					<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">E-Mail</label>
					<input type="email" name="email" bind:value={email} style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
				</div>

				<div style="grid-column: 1 / -1;">
					<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Adresse</label>
					<input type="text" name="adresse" bind:value={adresse} style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
				</div>

				<div style="grid-column: 1;">
					<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">PLZ</label>
					<input type="text" name="plz" bind:value={plz} style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
				</div>

				<div style="grid-column: 2;">
					<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Ort</label>
					<input type="text" name="ort" bind:value={ort} style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
				</div>

				<div style="grid-column: 1;">
					<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Land</label>
					<input type="text" name="land" bind:value={land} style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
				</div>

				<div style="grid-column: 1 / -1; display: flex; gap: 0.5rem;">
					<button type="submit" disabled={isLoading} style="background: #10b981; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer; font-weight: 500; disabled-opacity: 0.5;">
						{isLoading ? 'Wird gespeichert...' : '✓ Speichern'}
					</button>
				</div>
			</form>
		{/if}
	</div>

	{#if data.customers.length === 0}
		<p style="opacity: 0.5;">Noch keine Einträge.</p>
	{:else}
		<div style="overflow-x: auto;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each cols as col}
							<th style="padding: 0.5rem 0.75rem; white-space: nowrap;">{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.customers as c}
						{@const r = fmt(c)}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style="padding: 0.5rem 0.75rem; white-space: nowrap; opacity: 0.6;">{r.date}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.name}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.email}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.firma}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.adresse}</td>
							<td style="padding: 0.5rem 0.75rem; white-space: nowrap;">{r.quelle}</td>
							<td style="padding: 0.5rem 0.75rem;">
								<form
									method="POST"
									action="?/delete&secret={secret}"
									on:submit|preventDefault={(e) => confirmDelete(e, r.name)}
								>
									<input type="hidden" name="id" value={c.id} />
									<button type="submit" style="color: #dc2626; font-size: 0.75rem; background: none; border: none; cursor: pointer; padding: 0;">
										Löschen
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
