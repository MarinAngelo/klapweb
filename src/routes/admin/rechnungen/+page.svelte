<script lang="ts">
	import { enhance } from '$app/forms';
	import { env as publicEnv } from '$env/dynamic/public';
	import type { PageData, SubmitFunction } from './$types';

	export let data: PageData;

	let isFormOpen = false;
	let vorname = '';
	let nachname = '';
	let firma = '';
	let email = '';
	let adresse = '';
	let plz = '';
	let ort = '';
	let land = '';
	let notes = '';

	let items: Array<{ description: string; quantity: number; unitPrice: number }> = [
		{ description: '', quantity: 1, unitPrice: 0 }
	];

	let isPreviewOpen = false;
	let previewPdfBase64 = '';
	let currentInvoiceNumber = '';
	let sendEmail = false;
	let isLoading = false;

	const adminSecret = publicEnv.PUBLIC_ADMIN_SECRET || '';

	function addItem() {
		items = [...items, { description: '', quantity: 1, unitPrice: 0 }];
	}

	function removeItem(idx: number) {
		items = items.filter((_, i) => i !== idx);
	}

	const handlePreview: SubmitFunction = async ({ formData }) => {
		isLoading = true;
		const itemsJson = JSON.stringify(items);
		formData.set('items-json', itemsJson);
		formData.set('x-admin-secret', adminSecret);

		return async ({ result }) => {
			isLoading = false;
			if (result.type === 'success' && result.data.pdfBase64) {
				previewPdfBase64 = result.data.pdfBase64;
				currentInvoiceNumber = result.data.invoiceNumber;
				isPreviewOpen = true;
			}
		};
	};

	const handleSave: SubmitFunction = async ({ formData }) => {
		isLoading = true;
		const itemsJson = JSON.stringify(items);
		formData.set('items-json', itemsJson);
		formData.set('invoice-number', currentInvoiceNumber);
		formData.set('send-email', String(sendEmail));
		formData.set('x-admin-secret', adminSecret);

		return async ({ result }) => {
			isLoading = false;
			if (result.type === 'success') {
				alert(`Rechnung ${result.data.invoiceNumber} gespeichert${sendEmail ? ' und E-Mail gesendet' : ''}.`);
				resetForm();
				isPreviewOpen = false;
				isFormOpen = false;
			}
		};
	};

	function resetForm() {
		vorname = '';
		nachname = '';
		firma = '';
		email = '';
		adresse = '';
		plz = '';
		ort = '';
		land = '';
		notes = '';
		items = [{ description: '', quantity: 1, unitPrice: 0 }];
		sendEmail = false;
		previewPdfBase64 = '';
		currentInvoiceNumber = '';
	}

	function downloadPdf() {
		if (!previewPdfBase64) return;
		const link = document.createElement('a');
		link.href = `data:application/pdf;base64,${previewPdfBase64}`;
		link.download = `Rechnung_${currentInvoiceNumber}.pdf`;
		link.click();
	}

	function calculateTotal() {
		return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
	}
</script>

<div class="container mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">Manuelle Rechnungen</h1>

	<!-- Übersicht ---Rechnungen -->
	<div class="bg-white rounded-lg shadow p-6 mb-6">
		<h2 class="text-xl font-bold mb-4">Gespeicherte Rechnungen ({data.invoices.length})</h2>

		{#if data.invoices.length === 0}
			<p class="text-gray-500">Noch keine Rechnungen vorhanden.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b">
							<th class="text-left py-2">Nummer</th>
							<th class="text-left py-2">Datum</th>
							<th class="text-left py-2">Kunde</th>
							<th class="text-left py-2">E-Mail</th>
						</tr>
					</thead>
					<tbody>
						{#each data.invoices as inv}
							<tr class="border-b hover:bg-gray-50">
								<td class="py-2 font-mono text-blue-600">{inv.invoiceNumber}</td>
								<td class="py-2">{new Date(inv.date).toLocaleDateString('de-CH')}</td>
								<td class="py-2">{inv.vorname} {inv.nachname}</td>
								<td class="py-2 text-gray-600">{inv.email || '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Neue Rechnung erstellen -->
	<div class="bg-white rounded-lg shadow p-6">
		<button
			on:click={() => (isFormOpen = !isFormOpen)}
			class="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
		>
			{isFormOpen ? '✕ Formular schliessen' : '+ Neue Rechnung'}
		</button>

		{#if isFormOpen}
			<form method="POST" action="?/preview" use:enhance={handlePreview} class="space-y-4">
				<!-- Kundeninfos -->
				<fieldset class="border rounded p-4 bg-gray-50">
					<legend class="px-2 font-bold">Kundenangaben</legend>

					<div class="grid grid-cols-2 gap-4 mt-4">
						<input
							type="text"
							name="vorname"
							placeholder="Vorname"
							bind:value={vorname}
							class="border rounded px-2 py-1"
							required
						/>
						<input
							type="text"
							name="nachname"
							placeholder="Nachname"
							bind:value={nachname}
							class="border rounded px-2 py-1"
							required
						/>
						<input
							type="text"
							name="firma"
							placeholder="Firma (optional)"
							bind:value={firma}
							class="border rounded px-2 py-1"
						/>
						<input
							type="email"
							name="email"
							placeholder="E-Mail (für E-Mail-Versand)"
							bind:value={email}
							class="border rounded px-2 py-1"
						/>
						<input
							type="text"
							name="adresse"
							placeholder="Adresse"
							bind:value={adresse}
							class="border rounded px-2 py-1 col-span-2"
						/>
						<input
							type="text"
							name="plz"
							placeholder="PLZ"
							bind:value={plz}
							class="border rounded px-2 py-1"
						/>
						<input
							type="text"
							name="ort"
							placeholder="Ort"
							bind:value={ort}
							class="border rounded px-2 py-1"
						/>
						<input
							type="text"
							name="land"
							placeholder="Land"
							bind:value={land}
							class="border rounded px-2 py-1"
						/>
					</div>
				</fieldset>

				<!-- Leistungsposten -->
				<fieldset class="border rounded p-4 bg-gray-50">
					<legend class="px-2 font-bold">Leistungsposten</legend>

					<div class="space-y-3 mt-4">
						{#each items as item, idx}
							<div class="flex gap-2 items-end">
								<input
									type="text"
									placeholder="Beschreibung"
									bind:value={item.description}
									class="flex-1 border rounded px-2 py-1"
									required
								/>
								<input
									type="number"
									placeholder="Menge"
									bind:value={item.quantity}
									min="1"
									step="1"
									class="w-16 border rounded px-2 py-1"
									required
								/>
								<input
									type="number"
									placeholder="Preis"
									bind:value={item.unitPrice}
									min="0"
									step="0.01"
									class="w-20 border rounded px-2 py-1"
									required
								/>
								<button
									type="button"
									on:click={() => removeItem(idx)}
									class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
								>
									−
								</button>
							</div>
						{/each}
					</div>

					<button
						type="button"
						on:click={addItem}
						class="mt-3 bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
					>
						+ Posten hinzufügen
					</button>

					<div class="mt-4 pt-4 border-t font-bold text-lg">
						Total: {data.companyInfo.currency} {calculateTotal().toFixed(2)}
					</div>
				</fieldset>

				<!-- Notizen -->
				<fieldset class="border rounded p-4 bg-gray-50">
					<legend class="px-2 font-bold">Notizen (optional)</legend>
					<textarea
						name="notes"
						placeholder="Z.B. Zahlungsweiterleitung, Referenz, etc."
						bind:value={notes}
						class="w-full border rounded px-2 py-1 mt-2 h-20"
					/>
				</fieldset>

				<button
					type="submit"
					disabled={isLoading}
					class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
				>
					{isLoading ? 'Wird generiert...' : '📄 PDF Vorschau'}
				</button>
			</form>
		{/if}
	</div>

	<!-- PDF Vorschau & Speichern -->
	{#if isPreviewOpen && previewPdfBase64}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div class="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-auto">
				<div class="p-6">
					<h2 class="text-xl font-bold mb-4">Rechnung {currentInvoiceNumber}</h2>

					<div class="mb-4 border rounded p-4 bg-gray-50 h-96">
						<iframe
							title="PDF Preview"
							src="data:application/pdf;base64,{previewPdfBase64}"
							class="w-full h-full border-0"
						/>
					</div>

					<form method="POST" action="?/save" use:enhance={handleSave} class="space-y-4">
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={sendEmail} class="rounded" />
							<span>E-Mail an Kunde senden</span>
						</label>

						<div class="flex gap-2 justify-end">
							<button
								type="button"
								on:click={() => {
									isPreviewOpen = false;
									downloadPdf();
								}}
								class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
							>
								⬇ Speichern & Download
							</button>
							<button
								type="submit"
								disabled={isLoading}
								class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
							>
								{isLoading ? 'Wird gespeichert...' : '✓ Speichern'}
							</button>
							<button
								type="button"
								on:click={() => (isPreviewOpen = false)}
								class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
							>
								Abbrechen
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		@apply bg-gray-100;
	}
</style>
