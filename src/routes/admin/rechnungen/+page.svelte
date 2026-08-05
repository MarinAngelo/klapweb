<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData, SubmitFunction } from './$types';
	import { onMount } from 'svelte';
	import { formatDateShort } from '$lib/utils/formatDate';

	export let data: PageData;

	let isFormOpen = false;
	let selectedCustomerId = '';
	let notes = '';
	let adminSecret = '';

	let items: Array<{ description: string; quantity: number; unitPrice: number }> = [
		{ description: '', quantity: 1, unitPrice: 0 }
	];

	let isPreviewOpen = false;
	let previewPdfBase64 = '';
	let currentInvoiceNumber = '';
	let sendEmail = false;
	let isLoading = false;

	let isEditModalOpen = false;
	let editingInvoiceId = '';
	let editingInvoice: any = null;
	let editModalTab: 'view' | 'edit' | 'pdf' = 'view';
	let editPdfBase64 = '';
	let editPdfLoading = false;

	// Neuer Kunde Modal
	let isNewCustomerModalOpen = false;
	let newCustomerForm = {
		vorname: '',
		nachname: '',
		firma: '',
		email: '',
		adresse: '',
		plz: '',
		ort: '',
		land: ''
	};
	let newCustomerLoading = false;

	onMount(() => {
		adminSecret = new URLSearchParams(window.location.search).get('secret') || '';
	});

	function getSelectedCustomer() {
		return data.customers.find((c) => c.id === selectedCustomerId);
	}

	function addItem() {
		items = [...items, { description: '', quantity: 1, unitPrice: 0 }];
	}

	function removeItem(idx: number) {
		items = items.filter((_, i) => i !== idx);
	}

	function updateItem(idx: number, field: 'description' | 'quantity' | 'unitPrice', value: any) {
		if (field === 'quantity' || field === 'unitPrice') {
			const normalized = String(value).replace(',', '.');
			items[idx][field] = parseFloat(normalized) || 0;
		} else {
			items[idx][field] = value;
		}
		items = items;
	}

	const handlePreview: SubmitFunction = async ({ formData }) => {
		if (!selectedCustomerId) {
			alert('Bitte wähle einen Kunden');
			return;
		}

		const customer = getSelectedCustomer();
		if (!customer) {
			alert('Kunde nicht gefunden');
			return;
		}

		isLoading = true;
		const itemsJson = JSON.stringify(items);
		formData.set('items-json', itemsJson);
		formData.set('vorname', customer.vorname);
		formData.set('nachname', customer.nachname);
		formData.set('firma', customer.firma || '');
		formData.set('email', customer.email || '');
		formData.set('adresse', customer.adresse || '');
		formData.set('plz', customer.plz || '');
		formData.set('ort', customer.ort || '');
		formData.set('land', customer.land || '');

		return async ({ result }) => {
			isLoading = false;
			if (result.type === 'success' && result.data?.pdfBase64) {
				previewPdfBase64 = result.data.pdfBase64;
				currentInvoiceNumber = result.data.invoiceNumber;
				isPreviewOpen = true;
			} else if (result.type === 'failure') {
				alert('Fehler bei PDF-Generierung: ' + (result.data?.message || 'Unbekannter Fehler'));
			}
		};
	};

	const handleSave: SubmitFunction = async ({ formData }) => {
		isLoading = true;
		const itemsJson = JSON.stringify(items);
		formData.set('items-json', itemsJson);
		formData.set('invoice-number', currentInvoiceNumber);
		formData.set('send-email', String(sendEmail));

		const customer = getSelectedCustomer();
		if (!customer) {
			isLoading = false;
			alert('Kunde nicht gefunden');
			return;
		}

		formData.set('vorname', customer.vorname);
		formData.set('nachname', customer.nachname);
		formData.set('firma', customer.firma || '');
		formData.set('email', customer.email || '');
		formData.set('adresse', customer.adresse || '');
		formData.set('plz', customer.plz || '');
		formData.set('ort', customer.ort || '');
		formData.set('land', customer.land || '');

		return async ({ result }) => {
			isLoading = false;
			if (result.type === 'success') {
				alert(
					`Rechnung ${result.data?.invoiceNumber} gespeichert${sendEmail ? ' und E-Mail gesendet' : ''}.`
				);

				if (result.data?.invoice) {
					data.invoices = [result.data.invoice, ...data.invoices];
				}

				resetForm();
				isPreviewOpen = false;
				isFormOpen = false;
			} else if (result.type === 'failure') {
				alert('Fehler beim Speichern: ' + (result.data?.message || 'Unbekannter Fehler'));
			}
		};
	};

	function resetForm() {
		selectedCustomerId = '';
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

	async function deleteInvoice(invoiceId: string, invoiceNumber: string) {
		if (!confirm(`Wirklich löschen: ${invoiceNumber}?`)) return;

		const formData = new FormData();
		formData.set('secret', adminSecret);
		formData.set('invoice-id', invoiceId);

		try {
			const res = await fetch('?/delete', {
				method: 'POST',
				body: formData
			});

			if (res.ok) {
				alert('Rechnung gelöscht');
				location.reload();
			} else {
				alert('Fehler beim Löschen');
			}
		} catch (e) {
			alert('Fehler: ' + (e as Error).message);
		}
	}

	function openEdit(invoiceId: string) {
		const invoice = data.invoices.find((inv) => inv.id === invoiceId);

		if (!invoice) {
			alert('Rechnung nicht gefunden');
			return;
		}

		editingInvoice = {
			...invoice,
			items: Array.isArray(invoice.items) ? [...invoice.items] : []
		};
		editingInvoiceId = invoiceId;
		editModalTab = 'view';
		editPdfBase64 = '';
		isEditModalOpen = true;
	}

	async function generateEditPdf() {
		if (!editingInvoice) return;

		editPdfLoading = true;
		const formData = new FormData();
		formData.set('secret', adminSecret);
		formData.set('invoice-number', editingInvoice.invoiceNumber);
		formData.set('vorname', editingInvoice.vorname);
		formData.set('nachname', editingInvoice.nachname);
		formData.set('firma', editingInvoice.firma || '');
		formData.set('email', editingInvoice.email || '');
		formData.set('adresse', editingInvoice.adresse || '');
		formData.set('plz', editingInvoice.plz || '');
		formData.set('ort', editingInvoice.ort || '');
		formData.set('land', editingInvoice.land || '');
		formData.set('notes', editingInvoice.notes || '');
		formData.set('items-json', JSON.stringify(editingInvoice.items));

		try {
			const res = await fetch('?/previewEditPdf', {
				method: 'POST',
				body: formData
			});

			if (res.ok) {
				const result = await res.json();
				editPdfBase64 = result.data?.pdfBase64 || result.pdfBase64 || '';
				editModalTab = 'pdf';
			} else {
				alert('PDF konnte nicht generiert werden');
			}
		} catch (e) {
			alert('Fehler: ' + (e as Error).message);
		} finally {
			editPdfLoading = false;
		}
	}

	async function sendInvoiceEmail() {
		if (!editingInvoice?.email) {
			alert('Keine E-Mail-Adresse vorhanden');
			return;
		}

		if (!confirm(`Rechnung an ${editingInvoice.email} versenden?`)) return;

		isLoading = true;
		const formData = new FormData();
		formData.set('secret', adminSecret);
		formData.set('invoice-id', editingInvoiceId);

		try {
			const res = await fetch('?/sendInvoiceEmail', {
				method: 'POST',
				body: formData
			});

			isLoading = false;

			if (res.ok) {
				alert('Rechnung versendet und Status aktualisiert');
				editingInvoice.status = 'gesendet';
				editingInvoice.emailSentAt = new Date().toISOString();

				const invIndex = data.invoices.findIndex((inv) => inv.id === editingInvoiceId);
				if (invIndex !== -1) {
					data.invoices[invIndex].status = 'gesendet';
					data.invoices[invIndex].emailSentAt = new Date().toISOString();
					data.invoices = [...data.invoices];
				}
			} else {
				alert('Fehler beim Versenden');
			}
		} catch (e) {
			isLoading = false;
			alert('Fehler: ' + (e as Error).message);
		}
	}

	async function saveEdit() {
		isLoading = true;

		const formData = new FormData();
		formData.set('secret', adminSecret);
		formData.set('invoice-id', editingInvoiceId);
		formData.set('vorname', editingInvoice.vorname);
		formData.set('nachname', editingInvoice.nachname);
		formData.set('firma', editingInvoice.firma || '');
		formData.set('email', editingInvoice.email || '');
		formData.set('adresse', editingInvoice.adresse || '');
		formData.set('plz', editingInvoice.plz || '');
		formData.set('ort', editingInvoice.ort || '');
		formData.set('land', editingInvoice.land || '');
		formData.set('notes', editingInvoice.notes || '');
		formData.set('payment-status', editingInvoice.paymentStatus || 'offen');
		formData.set('items-json', JSON.stringify(editingInvoice.items));

		try {
			const res = await fetch('?/updateInvoice', {
				method: 'POST',
				body: formData
			});

			isLoading = false;

			if (res.ok) {
				alert('Rechnung aktualisiert');
				isEditModalOpen = false;
				location.reload();
			} else {
				alert('Fehler beim Speichern');
			}
		} catch (e) {
			isLoading = false;
			alert('Fehler: ' + (e as Error).message);
		}
	}

	async function saveNewCustomer() {
		if (!newCustomerForm.vorname || !newCustomerForm.nachname) {
			alert('Vorname und Nachname erforderlich');
			return;
		}

		// Prüfe ob Kunde bereits existiert (E-Mail ist Hauptmerkmal)
		let existingCustomer = null;

		if (newCustomerForm.email) {
			existingCustomer = data.customers.find(
				(c) => c.email && c.email.toLowerCase() === newCustomerForm.email.toLowerCase()
			);
		} else {
			// Falls keine E-Mail, dann nach Name prüfen
			existingCustomer = data.customers.find(
				(c) =>
					c.vorname.toLowerCase() === newCustomerForm.vorname.toLowerCase() &&
					c.nachname.toLowerCase() === newCustomerForm.nachname.toLowerCase()
			);
		}

		if (existingCustomer) {
			alert('Kunde existiert bereits');
			return;
		}

		newCustomerLoading = true;
		const formData = new FormData();
		formData.set('secret', adminSecret);
		formData.set('vorname', newCustomerForm.vorname);
		formData.set('nachname', newCustomerForm.nachname);
		formData.set('firma', newCustomerForm.firma);
		formData.set('email', newCustomerForm.email);
		formData.set('adresse', newCustomerForm.adresse);
		formData.set('plz', newCustomerForm.plz);
		formData.set('ort', newCustomerForm.ort);
		formData.set('land', newCustomerForm.land);

		try {
			const res = await fetch('/admin/kunden?/create&secret=' + adminSecret, {
				method: 'POST',
				body: formData
			});

			if (res.ok) {
				const result = await res.json();
				if (result.type === 'success' || result.status === 'success') {
					alert('Kunde erfasst');
					// Neuen Kunden laden
					location.reload();
				} else {
					alert('Fehler beim Erfassen');
				}
			} else {
				alert('Fehler beim Erfassen: ' + res.statusText);
			}
		} catch (e) {
			alert('Fehler: ' + (e as Error).message);
		} finally {
			newCustomerLoading = false;
		}
	}

	let total = 0;
	$: total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
</script>

<div class="container mx-auto p-6">
	<div class="flex items-center gap-4 mb-6">
		<a
			href="/admin/dashboard?secret={adminSecret}"
			class="text-sm text-gray-600 hover:text-gray-900">← Dashboard</a
		>
		<h1 class="text-3xl font-bold">Rechnungen</h1>
	</div>

	<!-- Übersicht Rechnungen -->
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
							<th class="text-left py-2">Versand</th>
							<th class="text-left py-2">Zahlung</th>
							<th class="text-left py-2">Zahlungsart</th>
							<th class="text-left py-2">Aktion</th>
						</tr>
					</thead>
					<tbody>
						{#each data.invoices as inv}
							<tr class="border-b hover:bg-gray-50">
								<td class="py-2 font-mono text-blue-600">{inv.invoiceNumber}</td>
								<td class="py-2">{formatDateShort(inv.date?.slice(0, 10))}</td>
								<td class="py-2">{inv.vorname} {inv.nachname}</td>
								<td class="py-2 text-gray-600">{inv.email || '—'}</td>
								<td class="py-2">
									<span
										class={`inline-block px-2 py-1 rounded text-xs font-medium ${
											inv.status === 'gesendet'
												? 'bg-green-100 text-green-800'
												: 'bg-yellow-100 text-yellow-800'
										}`}
									>
										{inv.status === 'gesendet' ? '✓ gesendet' : '● gespeichert'}
									</span>
								</td>
								<td class="py-2">
									<span
										class={`inline-block px-2 py-1 rounded text-xs font-medium ${inv.paymentStatus === 'bezahlt' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
									>
										{inv.paymentStatus === 'bezahlt' ? '✓ bezahlt' : '⏱ offen'}
									</span>
								</td>
								<td class="py-2">
									<span class="text-xs">{inv.paymentMethod === 'bar' ? 'Bar' : 'Rechnung'}</span>
								</td>
								<td class="py-2 space-x-2">
									<button
										on:click={() => openEdit(inv.id)}
										class="text-blue-600 hover:text-blue-800 font-medium"
									>
										Bearbeiten
									</button>
									<button
										on:click={() => deleteInvoice(inv.id, inv.invoiceNumber)}
										class="text-red-600 hover:text-red-800 font-medium"
									>
										Löschen
									</button>
								</td>
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
				<input type="hidden" name="secret" value={adminSecret} />

				<!-- Kunden Auswahl -->
				<fieldset class="border rounded p-4 bg-gray-50">
					<legend class="px-2 font-bold">Kunde wählen</legend>

					<div class="mt-4 space-y-3">
						<div>
							<label class="block text-sm font-medium mb-2">Bestehender Kunde</label>
							<select bind:value={selectedCustomerId} class="w-full border rounded px-3 py-2">
								<option value="">-- Kunde auswählen --</option>
								{#each data.customers as customer}
									<option value={customer.id}>
										{customer.vorname}
										{customer.nachname}
										{#if customer.firma}
											({customer.firma})
										{/if}
										{#if customer.email}
											— {customer.email}
										{/if}
									</option>
								{/each}
							</select>
						</div>

						<div>
							<button
								type="button"
								on:click={() => (isNewCustomerModalOpen = true)}
								class="text-blue-600 hover:text-blue-800 font-medium text-sm"
							>
								+ Neuer Kunde
							</button>
						</div>

						{#if selectedCustomerId}
							{@const customer = getSelectedCustomer()}
							{#if customer}
								<div class="bg-white rounded p-3 text-sm border">
									<strong>{customer.vorname} {customer.nachname}</strong>
									{#if customer.firma}
										<div>{customer.firma}</div>
									{/if}
									{#if customer.email}
										<div>{customer.email}</div>
									{/if}
									{#if customer.adresse}
										<div>
											{customer.adresse}
											{#if customer.plz}{customer.plz}{/if}
											{#if customer.ort}{customer.ort}{/if}
										</div>
									{/if}
								</div>
							{/if}
						{/if}
					</div>
				</fieldset>

				<!-- Leistungsposten -->
				<fieldset class="border rounded p-4 bg-gray-50">
					<legend class="px-2 font-bold">Leistungsposten</legend>

					<div class="space-y-3 mt-4">
						{#each items as item, idx (idx)}
							<div class="flex gap-2 items-end">
								<input
									type="text"
									placeholder="Beschreibung"
									value={item.description}
									on:input={(e) => updateItem(idx, 'description', e.currentTarget.value)}
									class="flex-1 border rounded px-2 py-1"
									required
								/>
								<input
									type="text"
									inputmode="decimal"
									placeholder="Menge"
									value={item.quantity}
									on:input={(e) => updateItem(idx, 'quantity', e.currentTarget.value)}
									class="w-16 border rounded px-2 py-1"
									required
								/>
								<input
									type="text"
									inputmode="decimal"
									placeholder="Preis"
									value={item.unitPrice}
									on:input={(e) => updateItem(idx, 'unitPrice', e.currentTarget.value)}
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
						Total: {data.companyInfo.currency}
						{total.toFixed(2)}
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
					disabled={isLoading || !selectedCustomerId}
					class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
				>
					{isLoading ? 'Wird generiert...' : '📄 PDF Vorschau'}
				</button>
			</form>
		{/if}
	</div>

	<!-- Neuer Kunde Modal -->
	{#if isNewCustomerModalOpen}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div class="bg-white rounded-lg max-w-md w-full">
				<div class="p-6">
					<h2 class="text-xl font-bold mb-4">Neuer Kunde</h2>

					<div class="space-y-3">
						<div>
							<label class="block text-sm font-medium mb-1">Vorname *</label>
							<input
								type="text"
								bind:value={newCustomerForm.vorname}
								class="w-full border rounded px-2 py-1"
								required
							/>
						</div>

						<div>
							<label class="block text-sm font-medium mb-1">Nachname *</label>
							<input
								type="text"
								bind:value={newCustomerForm.nachname}
								class="w-full border rounded px-2 py-1"
								required
							/>
						</div>

						<div>
							<label class="block text-sm font-medium mb-1">Firma</label>
							<input
								type="text"
								bind:value={newCustomerForm.firma}
								class="w-full border rounded px-2 py-1"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium mb-1">E-Mail</label>
							<input
								type="email"
								bind:value={newCustomerForm.email}
								class="w-full border rounded px-2 py-1"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium mb-1">Adresse</label>
							<input
								type="text"
								bind:value={newCustomerForm.adresse}
								class="w-full border rounded px-2 py-1"
							/>
						</div>

						<div class="grid grid-cols-2 gap-2">
							<div>
								<label class="block text-sm font-medium mb-1">PLZ</label>
								<input
									type="text"
									bind:value={newCustomerForm.plz}
									class="w-full border rounded px-2 py-1"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium mb-1">Ort</label>
								<input
									type="text"
									bind:value={newCustomerForm.ort}
									class="w-full border rounded px-2 py-1"
								/>
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium mb-1">Land</label>
							<input
								type="text"
								bind:value={newCustomerForm.land}
								class="w-full border rounded px-2 py-1"
							/>
						</div>
					</div>

					<div class="flex gap-2 justify-end mt-6">
						<button
							type="button"
							on:click={() => (isNewCustomerModalOpen = false)}
							class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
						>
							Abbrechen
						</button>
						<button
							type="button"
							on:click={saveNewCustomer}
							disabled={newCustomerLoading}
							class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
						>
							{newCustomerLoading ? 'Wird gespeichert...' : '✓ Speichern'}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Edit Modal (unverändert) -->
	{#if isEditModalOpen && editingInvoice}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-auto">
				<div class="p-6">
					<div class="flex justify-between items-center mb-4">
						<h2 class="text-xl font-bold">Rechnung {editingInvoice.invoiceNumber}</h2>
					</div>

					<!-- Tabs -->
					<div class="flex gap-2 mb-4 border-b">
						<button
							type="button"
							on:click={() => (editModalTab = 'view')}
							class={`px-4 py-2 font-medium ${
								editModalTab === 'view'
									? 'border-b-2 border-blue-600 text-blue-600'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							👁️ Anzeigen
						</button>
						<button
							type="button"
							on:click={() => (editModalTab = 'edit')}
							class={`px-4 py-2 font-medium ${
								editModalTab === 'edit'
									? 'border-b-2 border-blue-600 text-blue-600'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							✎ Bearbeiten
						</button>
						<button
							type="button"
							on:click={generateEditPdf}
							disabled={editPdfLoading}
							class={`px-4 py-2 font-medium ${
								editModalTab === 'pdf'
									? 'border-b-2 border-blue-600 text-blue-600'
									: 'text-gray-600 hover:text-gray-900'
							} ${editPdfLoading ? 'opacity-50' : ''}`}
						>
							📄 PDF {editPdfLoading ? '(wird geladen...)' : ''}
						</button>
					</div>

					{#if editModalTab === 'edit'}
						<!-- Edit Form -->
						<div class="space-y-4">
							<fieldset class="border rounded p-4 bg-gray-50">
								<legend class="px-2 font-bold">Kundenangaben</legend>
								<div class="grid grid-cols-2 gap-4 mt-4">
									<input
										type="text"
										placeholder="Vorname"
										bind:value={editingInvoice.vorname}
										class="border rounded px-2 py-1"
									/>
									<input
										type="text"
										placeholder="Nachname"
										bind:value={editingInvoice.nachname}
										class="border rounded px-2 py-1"
									/>
									<input
										type="text"
										placeholder="Firma"
										bind:value={editingInvoice.firma}
										class="border rounded px-2 py-1"
									/>
									<input
										type="email"
										placeholder="E-Mail"
										bind:value={editingInvoice.email}
										class="border rounded px-2 py-1"
									/>
									<input
										type="text"
										placeholder="Adresse"
										bind:value={editingInvoice.adresse}
										class="border rounded px-2 py-1 col-span-2"
									/>
									<input
										type="text"
										placeholder="PLZ"
										bind:value={editingInvoice.plz}
										class="border rounded px-2 py-1"
									/>
									<input
										type="text"
										placeholder="Ort"
										bind:value={editingInvoice.ort}
										class="border rounded px-2 py-1"
									/>
									<input
										type="text"
										placeholder="Land"
										bind:value={editingInvoice.land}
										class="border rounded px-2 py-1"
									/>
								</div>
							</fieldset>

							<fieldset class="border rounded p-4 bg-gray-50">
								<legend class="px-2 font-bold">Leistungsposten</legend>
								<div class="space-y-3 mt-4">
									{#each editingInvoice.items as item, idx (idx)}
										<div class="flex gap-2 items-end">
											<input
												type="text"
												placeholder="Beschreibung"
												bind:value={item.description}
												class="flex-1 border rounded px-2 py-1"
											/>
											<input
												type="number"
												placeholder="Menge"
												bind:value={item.quantity}
												min="1"
												step="1"
												class="w-16 border rounded px-2 py-1"
											/>
											<input
												type="number"
												placeholder="Preis"
												bind:value={item.unitPrice}
												min="0"
												step="0.01"
												class="w-20 border rounded px-2 py-1"
											/>
											<button
												type="button"
												on:click={() => {
													editingInvoice.items = editingInvoice.items.filter((_, i) => i !== idx);
												}}
												class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
											>
												−
											</button>
										</div>
									{/each}
								</div>

								<button
									type="button"
									on:click={() => {
										editingInvoice.items = [
											...editingInvoice.items,
											{ description: '', quantity: 1, unitPrice: 0 }
										];
									}}
									class="mt-3 bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
								>
									+ Posten hinzufügen
								</button>
							</fieldset>

							<fieldset class="border rounded p-4 bg-gray-50">
								<legend class="px-2 font-bold">Notizen</legend>
								<textarea
									placeholder="Notizen"
									bind:value={editingInvoice.notes}
									class="w-full border rounded px-2 py-1 mt-2 h-20"
								/>
							</fieldset>

							<fieldset class="border rounded p-4 bg-gray-50">
								<legend class="px-2 font-bold">Zahlungsstatus</legend>
								<div class="mt-2">
									<select
										bind:value={editingInvoice.paymentStatus}
										class="w-full border rounded px-2 py-1"
									>
										<option value="offen">⏱ offen</option>
										<option value="bezahlt">✓ bezahlt</option>
									</select>
								</div>
							</fieldset>
						</div>
					{:else if editModalTab === 'view'}
						<!-- View Mode -->
						<div class="space-y-4 text-sm">
							<div class="grid grid-cols-2 gap-4">
								<div>
									<strong>Kunde:</strong>
									{editingInvoice.vorname}
									{editingInvoice.nachname}
								</div>
								{#if editingInvoice.firma}
									<div>
										<strong>Firma:</strong>
										{editingInvoice.firma}
									</div>
								{/if}
								{#if editingInvoice.email}
									<div>
										<strong>E-Mail:</strong>
										{editingInvoice.email}
									</div>
								{/if}
								<div>
									<strong>Datum:</strong>
									{formatDateShort(editingInvoice.date?.slice(0, 10))}
								</div>
							</div>

							<div>
								<strong>Leistungsposten:</strong>
								<table class="w-full text-xs mt-2 border">
									<thead>
										<tr class="bg-gray-100">
											<th class="border px-2 py-1 text-left">Beschreibung</th>
											<th class="border px-2 py-1 text-right w-16">Menge</th>
											<th class="border px-2 py-1 text-right w-20">Preis</th>
											<th class="border px-2 py-1 text-right w-20">Total</th>
										</tr>
									</thead>
									<tbody>
										{#each editingInvoice.items as item}
											<tr class="border-b">
												<td class="border px-2 py-1">{item.description}</td>
												<td class="border px-2 py-1 text-right">{item.quantity}</td>
												<td class="border px-2 py-1 text-right">{item.unitPrice.toFixed(2)}</td>
												<td class="border px-2 py-1 text-right"
													>{(item.quantity * item.unitPrice).toFixed(2)}</td
												>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>

							{#if editingInvoice.notes}
								<div>
									<strong>Notizen:</strong>
									<p class="text-gray-600">{editingInvoice.notes}</p>
								</div>
							{/if}
						</div>
					{:else if editModalTab === 'pdf' && editPdfBase64}
						<!-- PDF View -->
						<div class="border rounded p-4 bg-gray-50 h-96">
							<iframe
								title="PDF Preview"
								src="data:application/pdf;base64,{editPdfBase64}"
								class="w-full h-full border-0"
							/>
						</div>
					{/if}

					<div class="flex gap-2 justify-between mt-6">
						<div>
							{#if editingInvoice?.email && editingInvoice?.status !== 'gesendet'}
								<button
									on:click={sendInvoiceEmail}
									disabled={isLoading}
									class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
								>
									{isLoading ? 'Wird versendet...' : '📧 Versenden'}
								</button>
							{:else if editingInvoice?.status === 'gesendet'}
								<span class="text-green-600 font-medium">✓ Versendet</span>
							{/if}
						</div>
						<div class="space-x-2">
							{#if editModalTab === 'edit'}
								<button
									on:click={saveEdit}
									disabled={isLoading}
									class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
								>
									{isLoading ? 'Wird gespeichert...' : '💾 Speichern'}
								</button>
							{/if}
							<button
								type="button"
								on:click={() => (isEditModalOpen = false)}
								class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
							>
								Schließen
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

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
						<input type="hidden" name="secret" value={adminSecret} />
						<input type="hidden" name="notes" value={notes} />
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
