<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, SubmitFunction } from './$types';
	import { formatDateShort } from '$lib/utils/formatDate';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';

	export let data: PageData;

	let isFormOpen = false;
	let selectedCustomerId = '';
	let notes = '';

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
		formData.set('vorname', newCustomerForm.vorname);
		formData.set('nachname', newCustomerForm.nachname);
		formData.set('firma', newCustomerForm.firma);
		formData.set('email', newCustomerForm.email);
		formData.set('adresse', newCustomerForm.adresse);
		formData.set('plz', newCustomerForm.plz);
		formData.set('ort', newCustomerForm.ort);
		formData.set('land', newCustomerForm.land);

		try {
			const res = await fetch('/admin/kunden?/create', {
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

<div class="admin-container">
	<AdminHeader title="Rechnungen" count={data.invoices.length}>
		<form
			method="POST"
			action="?/deleteAll"
			on:submit={(e) => {
				if (!confirm('Alle Rechnungen löschen?')) e.preventDefault();
			}}
		>
			<button type="submit" class="admin-btn admin-btn-danger-outline">Alle löschen</button>
		</form>
	</AdminHeader>

	<!-- Übersicht Rechnungen -->
	<section class="admin-card">
		<h2 class="admin-card-title">Gespeicherte Rechnungen</h2>

		{#if data.invoices.length === 0}
			<p class="admin-empty">Noch keine Rechnungen vorhanden.</p>
		{:else}
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>Nummer</th>
							<th>Datum</th>
							<th>Kunde</th>
							<th>E-Mail</th>
							<th>Versand</th>
							<th>Zahlung</th>
							<th>Zahlungsart</th>
							<th>Aktion</th>
						</tr>
					</thead>
					<tbody>
						{#each data.invoices as inv}
							<tr>
								<td class="admin-mono nowrap">{inv.invoiceNumber}</td>
								<td>{formatDateShort(inv.date?.slice(0, 10))}</td>
								<td>{inv.vorname} {inv.nachname}</td>
								<td class="admin-muted">{inv.email || '—'}</td>
								<td>
									<span
										class="admin-badge {inv.status === 'gesendet'
											? 'admin-badge-green'
											: 'admin-badge-yellow'}"
									>
										{inv.status === 'gesendet' ? '✓ gesendet' : '● gespeichert'}
									</span>
								</td>
								<td>
									<span
										class="admin-badge {inv.paymentStatus === 'bezahlt'
											? 'admin-badge-green'
											: 'admin-badge-orange'}"
									>
										{inv.paymentStatus === 'bezahlt' ? '✓ bezahlt' : '⏱ offen'}
									</span>
								</td>
								<td>
									<span class="text-xs">{inv.paymentMethod === 'bar' ? 'Bar' : 'Rechnung'}</span>
								</td>
								<td class="nowrap space-x-3">
									<button on:click={() => openEdit(inv.id)} class="admin-link"> Bearbeiten </button>
									<button
										on:click={() => deleteInvoice(inv.id, inv.invoiceNumber)}
										class="admin-link-danger"
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
	</section>

	<!-- Neue Rechnung erstellen -->
	<section class="admin-card">
		<button
			type="button"
			class="admin-btn admin-btn-primary"
			on:click={() => (isFormOpen = !isFormOpen)}
		>
			{isFormOpen ? '✕ Formular schliessen' : '+ Neue Rechnung'}
		</button>

		{#if isFormOpen}
			<form method="POST" action="?/preview" use:enhance={handlePreview} class="mt-4 space-y-4">
				<!-- Kunden Auswahl -->
				<fieldset class="admin-fieldset">
					<legend>Kunde wählen</legend>

					<div class="mt-4 space-y-3">
						<div>
							<label class="admin-label">Bestehender Kunde</label>
							<select bind:value={selectedCustomerId} class="admin-input">
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
								class="admin-link text-sm"
							>
								+ Neuer Kunde
							</button>
						</div>

						{#if selectedCustomerId}
							{@const customer = getSelectedCustomer()}
							{#if customer}
								<div class="rounded-md border border-gray-200 bg-white p-3 text-sm">
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
				<fieldset class="admin-fieldset">
					<legend>Leistungsposten</legend>

					<div class="space-y-3 mt-4">
						{#each items as item, idx (idx)}
							<div class="flex gap-2 items-end">
								<input
									type="text"
									placeholder="Beschreibung"
									value={item.description}
									on:input={(e) => updateItem(idx, 'description', e.currentTarget.value)}
									class="admin-input admin-input-sm flex-1"
									required
								/>
								<input
									type="text"
									inputmode="decimal"
									placeholder="Menge"
									value={item.quantity}
									on:input={(e) => updateItem(idx, 'quantity', e.currentTarget.value)}
									class="admin-input admin-input-sm w-16"
									required
								/>
								<input
									type="text"
									inputmode="decimal"
									placeholder="Preis"
									value={item.unitPrice}
									on:input={(e) => updateItem(idx, 'unitPrice', e.currentTarget.value)}
									class="admin-input admin-input-sm w-20"
									required
								/>
								<button
									type="button"
									on:click={() => removeItem(idx)}
									class="admin-btn admin-btn-danger admin-btn-sm"
								>
									−
								</button>
							</div>
						{/each}
					</div>

					<button type="button" on:click={addItem} class="admin-btn admin-btn-sm mt-3">
						+ Posten hinzufügen
					</button>

					<div class="mt-4 border-t border-gray-200 pt-4 text-lg font-bold">
						Total: {data.companyInfo.currency}
						{total.toFixed(2)}
					</div>
				</fieldset>

				<!-- Notizen -->
				<fieldset class="admin-fieldset">
					<legend>Notizen (optional)</legend>
					<textarea
						name="notes"
						placeholder="Z.B. Zahlungsweiterleitung, Referenz, etc."
						bind:value={notes}
						class="admin-input mt-2 h-20"
					/>
				</fieldset>

				<button
					type="submit"
					disabled={isLoading || !selectedCustomerId}
					class="admin-btn admin-btn-primary"
				>
					{isLoading ? 'Wird generiert...' : '📄 PDF Vorschau'}
				</button>
			</form>
		{/if}
	</section>

	<!-- Neuer Kunde Modal -->
	{#if isNewCustomerModalOpen}
		<div class="admin-modal-backdrop">
			<div class="admin-modal max-w-md">
				<div>
					<h2 class="mb-4">Neuer Kunde</h2>

					<div class="space-y-3">
						<div>
							<label class="admin-label">Vorname *</label>
							<input
								type="text"
								bind:value={newCustomerForm.vorname}
								class="admin-input admin-input-sm"
								required
							/>
						</div>

						<div>
							<label class="admin-label">Nachname *</label>
							<input
								type="text"
								bind:value={newCustomerForm.nachname}
								class="admin-input admin-input-sm"
								required
							/>
						</div>

						<div>
							<label class="admin-label">Firma</label>
							<input
								type="text"
								bind:value={newCustomerForm.firma}
								class="admin-input admin-input-sm"
							/>
						</div>

						<div>
							<label class="admin-label">E-Mail</label>
							<input
								type="email"
								bind:value={newCustomerForm.email}
								class="admin-input admin-input-sm"
							/>
						</div>

						<div>
							<label class="admin-label">Adresse</label>
							<input
								type="text"
								bind:value={newCustomerForm.adresse}
								class="admin-input admin-input-sm"
							/>
						</div>

						<div class="grid grid-cols-2 gap-2">
							<div>
								<label class="admin-label">PLZ</label>
								<input
									type="text"
									bind:value={newCustomerForm.plz}
									class="admin-input admin-input-sm"
								/>
							</div>
							<div>
								<label class="admin-label">Ort</label>
								<input
									type="text"
									bind:value={newCustomerForm.ort}
									class="admin-input admin-input-sm"
								/>
							</div>
						</div>

						<div>
							<label class="admin-label">Land</label>
							<input
								type="text"
								bind:value={newCustomerForm.land}
								class="admin-input admin-input-sm"
							/>
						</div>
					</div>

					<div class="flex gap-2 justify-end mt-6">
						<button
							type="button"
							on:click={() => (isNewCustomerModalOpen = false)}
							class="admin-btn"
						>
							Abbrechen
						</button>
						<button
							type="button"
							on:click={saveNewCustomer}
							disabled={newCustomerLoading}
							class="admin-btn admin-btn-success"
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
		<div class="admin-modal-backdrop">
			<div class="admin-modal">
				<div>
					<div class="flex justify-between items-center mb-4">
						<h2>Rechnung {editingInvoice.invoiceNumber}</h2>
					</div>

					<!-- Tabs -->
					<div class="admin-tabs">
						<button
							type="button"
							on:click={() => (editModalTab = 'view')}
							class="admin-tab"
							class:is-active={editModalTab === 'view'}
						>
							👁️ Anzeigen
						</button>
						<button
							type="button"
							on:click={() => (editModalTab = 'edit')}
							class="admin-tab"
							class:is-active={editModalTab === 'edit'}
						>
							✎ Bearbeiten
						</button>
						<button
							type="button"
							on:click={generateEditPdf}
							disabled={editPdfLoading}
							class="admin-tab"
							class:is-active={editModalTab === 'pdf'}
						>
							📄 PDF {editPdfLoading ? '(wird geladen...)' : ''}
						</button>
					</div>

					{#if editModalTab === 'edit'}
						<!-- Edit Form -->
						<div class="space-y-4">
							<fieldset class="admin-fieldset">
								<legend>Kundenangaben</legend>
								<div class="grid grid-cols-2 gap-4 mt-4">
									<input
										type="text"
										placeholder="Vorname"
										bind:value={editingInvoice.vorname}
										class="admin-input admin-input-sm"
									/>
									<input
										type="text"
										placeholder="Nachname"
										bind:value={editingInvoice.nachname}
										class="admin-input admin-input-sm"
									/>
									<input
										type="text"
										placeholder="Firma"
										bind:value={editingInvoice.firma}
										class="admin-input admin-input-sm"
									/>
									<input
										type="email"
										placeholder="E-Mail"
										bind:value={editingInvoice.email}
										class="admin-input admin-input-sm"
									/>
									<input
										type="text"
										placeholder="Adresse"
										bind:value={editingInvoice.adresse}
										class="admin-input admin-input-sm col-span-2"
									/>
									<input
										type="text"
										placeholder="PLZ"
										bind:value={editingInvoice.plz}
										class="admin-input admin-input-sm"
									/>
									<input
										type="text"
										placeholder="Ort"
										bind:value={editingInvoice.ort}
										class="admin-input admin-input-sm"
									/>
									<input
										type="text"
										placeholder="Land"
										bind:value={editingInvoice.land}
										class="admin-input admin-input-sm"
									/>
								</div>
							</fieldset>

							<fieldset class="admin-fieldset">
								<legend>Leistungsposten</legend>
								<div class="space-y-3 mt-4">
									{#each editingInvoice.items as item, idx (idx)}
										<div class="flex gap-2 items-end">
											<input
												type="text"
												placeholder="Beschreibung"
												bind:value={item.description}
												class="admin-input admin-input-sm flex-1"
											/>
											<input
												type="number"
												placeholder="Menge"
												bind:value={item.quantity}
												min="1"
												step="1"
												class="admin-input admin-input-sm w-16"
											/>
											<input
												type="number"
												placeholder="Preis"
												bind:value={item.unitPrice}
												min="0"
												step="0.01"
												class="admin-input admin-input-sm w-20"
											/>
											<button
												type="button"
												on:click={() => {
													editingInvoice.items = editingInvoice.items.filter((_, i) => i !== idx);
												}}
												class="admin-btn admin-btn-danger admin-btn-sm"
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
									class="admin-btn admin-btn-sm mt-3"
								>
									+ Posten hinzufügen
								</button>
							</fieldset>

							<fieldset class="admin-fieldset">
								<legend>Notizen</legend>
								<textarea
									placeholder="Notizen"
									bind:value={editingInvoice.notes}
									class="admin-input mt-2 h-20"
								/>
							</fieldset>

							<fieldset class="admin-fieldset">
								<legend>Zahlungsstatus</legend>
								<div class="mt-2">
									<select
										bind:value={editingInvoice.paymentStatus}
										class="admin-input admin-input-sm"
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
								<table class="admin-table admin-subtable mt-2">
									<thead>
										<tr>
											<th>Beschreibung</th>
											<th class="w-16 text-right">Menge</th>
											<th class="w-20 text-right">Preis</th>
											<th class="w-20 text-right">Total</th>
										</tr>
									</thead>
									<tbody>
										{#each editingInvoice.items as item}
											<tr>
												<td>{item.description}</td>
												<td class="text-right">{item.quantity}</td>
												<td class="text-right">{item.unitPrice.toFixed(2)}</td>
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
									<p class="admin-muted">{editingInvoice.notes}</p>
								</div>
							{/if}
						</div>
					{:else if editModalTab === 'pdf' && editPdfBase64}
						<!-- PDF View -->
						<div class="h-96 rounded-md border border-gray-200 bg-gray-50 p-4">
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
									class="admin-btn admin-btn-primary"
								>
									{isLoading ? 'Wird versendet...' : '📧 Versenden'}
								</button>
							{:else if editingInvoice?.status === 'gesendet'}
								<span class="admin-badge admin-badge-green">✓ Versendet</span>
							{/if}
						</div>
						<div class="space-x-2">
							{#if editModalTab === 'edit'}
								<button
									on:click={saveEdit}
									disabled={isLoading}
									class="admin-btn admin-btn-success"
								>
									{isLoading ? 'Wird gespeichert...' : '💾 Speichern'}
								</button>
							{/if}
							<button type="button" on:click={() => (isEditModalOpen = false)} class="admin-btn">
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
		<div class="admin-modal-backdrop">
			<div class="admin-modal max-w-4xl">
				<div>
					<h2 class="mb-4">Rechnung {currentInvoiceNumber}</h2>

					<div class="mb-4 h-96 rounded-md border border-gray-200 bg-gray-50 p-4">
						<iframe
							title="PDF Preview"
							src="data:application/pdf;base64,{previewPdfBase64}"
							class="w-full h-full border-0"
						/>
					</div>

					<form method="POST" action="?/save" use:enhance={handleSave} class="space-y-4">
						<input type="hidden" name="notes" value={notes} />
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={sendEmail} class="admin-checkbox" />
							<span>E-Mail an Kunde senden</span>
						</label>

						<div class="flex gap-2 justify-end">
							<button
								type="button"
								on:click={() => {
									isPreviewOpen = false;
									downloadPdf();
								}}
								class="admin-btn"
							>
								⬇ Speichern & Download
							</button>
							<button type="submit" disabled={isLoading} class="admin-btn admin-btn-success">
								{isLoading ? 'Wird gespeichert...' : '✓ Speichern'}
							</button>
							<button type="button" on:click={() => (isPreviewOpen = false)} class="admin-btn">
								Abbrechen
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>
