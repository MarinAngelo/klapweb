<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import type { PageData, SubmitFunction } from './$types';
	import { formatDateShort } from '$lib/utils/formatDate';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import AdminBulkActions from '$lib/components/admin/AdminBulkActions.svelte';

	export let data: PageData;

	// Feature that issued the invoice (src/lib/server/invoicing)
	/**
	 * Calls a form action with fetch: the header makes SvelteKit answer with the action result
	 * (otherwise it returns the HTML page), deserialize() unpacks its data (devalue string).
	 */
	async function postAction(url: string, body: FormData) {
		const res = await fetch(url, {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await res.text());
		return { ok: res.ok && (result.type === 'success' || result.type === 'redirect'), result };
	}

	const SOURCE_LABELS: Record<string, string> = {
		checkout: 'Bestellung',
		event: 'Event',
		terminbuchung: 'Terminbuchung',
		admin: 'Manuell',
		wiederkehrend: 'Wiederkehrend'
	};
	let recurring = false;
	// Edit view «Wiederholung»
	let editRecurring = false;
	let editRecurringNext = '';
	// «Bezahlt am» (date of payment, income date in «Buchhaltung»)
	let editPaidDate = '';
	let paidLoadedFor = '';
	$: if (editingInvoice && editingInvoiceId && paidLoadedFor !== editingInvoiceId) {
		paidLoadedFor = editingInvoiceId;
		editPaidDate = editingInvoice.paidAt
			? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(
					new Date(editingInvoice.paidAt)
				)
			: '';
	}
	$: if (editingInvoice?.paymentStatus === 'bezahlt' && !editPaidDate) editPaidDate = todaySwiss();
	let recurrenceLoadedFor = '';
	$: if (editingInvoice && editingInvoiceId && recurrenceLoadedFor !== editingInvoiceId) {
		recurrenceLoadedFor = editingInvoiceId;
		editRecurring = !!editingInvoice.recurrence?.active;
		editRecurringNext =
			editingInvoice.recurrence?.nextDate ??
			addYearIso(editingInvoice.date ?? new Date().toISOString());
	}
	function addYearIso(date: string) {
		const [y, m, d] = date.slice(0, 10).split('-').map(Number);
		const last = new Date(Date.UTC(y + 1, m, 0)).getUTCDate();
		return `${y + 1}-${String(m).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
	}

	// Selection for bulk actions (AdminBulkActions); more actions: add here + in the bulk action
	let selectedIds: string[] = [];
	const BULK_ACTIONS = [
		{ value: 'paid', label: 'Als bezahlt markieren' },
		{ value: 'open', label: 'Als offen markieren' },
		{
			value: 'cancelled',
			label: 'Als storniert markieren',
			confirm: '{n} Rechnungen als storniert markieren?'
		},
		{ value: 'delete', label: 'Löschen', confirm: '{n} Rechnungen löschen?' }
	];
	$: selectedIds = selectedIds.filter((id) => data.invoices.some((inv) => inv.id === id));
	$: allSelected = data.invoices.length > 0 && selectedIds.length === data.invoices.length;
	$: someSelected = selectedIds.length > 0 && !allSelected;
	function toggleAll(checked: boolean) {
		selectedIds = checked ? data.invoices.map((inv) => inv.id) : [];
	}

	// Zahlungsabgleich (bank export CSV)
	type MatchResult = {
		reference: string;
		status: 'bezahlt' | 'betrag' | 'schon-bezahlt' | 'unbekannt';
		invoiceNumber?: string;
		customer?: string;
		expected?: number;
		amounts: number[];
		date?: string;
		row: number;
	};
	let matchResults: MatchResult[] | null = null;
	let matchDryRun = false;
	let matchError = '';
	let matching = false;
	const MATCH_LABELS: Record<MatchResult['status'], string> = {
		bezahlt: '✓ auf bezahlt gesetzt',
		betrag: '⚠ Betrag stimmt nicht',
		'schon-bezahlt': 'bereits bezahlt',
		unbekannt: '? Referenz unbekannt'
	};

	const reconcileEnhance: SubmitFunction = () => {
		matching = true;
		matchError = '';
		return async ({ result, update }) => {
			matching = false;
			if (result.type === 'success') {
				const d = (result.data ?? {}) as { matchResults?: MatchResult[]; dryRun?: boolean };
				matchResults = d.matchResults ?? [];
				matchDryRun = !!d.dryRun;
				await update({ reset: false });
			} else if (result.type === 'failure') {
				matchError = String(
					(result.data as { reconcileError?: string })?.reconcileError ?? 'Abgleich fehlgeschlagen'
				);
			} else if (result.type === 'error') {
				matchError = result.error?.message ?? 'Abgleich fehlgeschlagen';
			}
		};
	};

	let isFormOpen = false;
	let selectedCustomerId = '';
	let notes = '';
	// «Rechnungsdatum»: default today (Swiss time), backdating possible, not in the future
	const todaySwiss = () =>
		new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date());
	let invoiceDate = todaySwiss();

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
	let editModalTab: 'view' | 'edit' = 'view';
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

	// «Leistung wählen»: fills description and price of a line item (stays editable)
	function serviceByUid(uid: string) {
		return data.services.find((s) => s.uid === uid);
	}
	function pickService(idx: number, select: HTMLSelectElement) {
		const service = serviceByUid(select.value);
		select.value = '';
		if (!service) return;
		items[idx].description = service.label;
		if (service.price !== null) items[idx].unitPrice = service.price;
		items = items;
	}
	function pickEditService(idx: number, select: HTMLSelectElement) {
		const service = serviceByUid(select.value);
		select.value = '';
		if (!service || !editingInvoice) return;
		editingInvoice.items[idx].description = service.label;
		if (service.price !== null) editingInvoice.items[idx].unitPrice = service.price;
		editingInvoice = editingInvoice;
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

		if (!invoiceDate || invoiceDate > todaySwiss()) {
			alert('Das Rechnungsdatum darf nicht in der Zukunft liegen');
			return;
		}

		isLoading = true;
		const itemsJson = JSON.stringify(items);
		formData.set('items-json', itemsJson);
		formData.set('invoice-date', invoiceDate);
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
		formData.set('invoice-date', invoiceDate);
		formData.set('send-email', String(sendEmail));
		formData.set('recurring', String(recurring));

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
		isEditModalOpen = true;
	}

	async function generateEditPdf() {
		if (!editingInvoice) return;

		editPdfLoading = true;
		// Open the tab right away (in the click) so popup blockers allow it, fill it when ready
		const tab = window.open('', '_blank');
		const formData = new FormData();
		formData.set('invoice-number', editingInvoice.invoiceNumber);
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
		formData.set('items-json', JSON.stringify(editingInvoice.items));

		try {
			const { ok, result } = await postAction('?/previewEditPdf', formData);

			if (ok && result.type === 'success') {
				const base64 = String(result.data?.pdfBase64 ?? '');
				const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
				const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
				if (tab) tab.location.href = url;
				else window.open(url, '_blank');
			} else {
				tab?.close();
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
			const res = await postAction('?/sendInvoiceEmail', formData);

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
		formData.set('paid-date', editPaidDate);
		formData.set('recurring-active', String(editRecurring));
		formData.set('recurring-next', editRecurringNext);
		formData.set('items-json', JSON.stringify(editingInvoice.items));

		try {
			const res = await postAction('?/updateInvoice', formData);

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
			const res = await postAction('/admin/kunden?/create', formData);

			if (res.ok) {
				const result = res.result;
				if (result.type === 'success') {
					alert('Kunde erfasst');
					// Neuen Kunden laden
					location.reload();
				} else {
					alert('Fehler beim Erfassen');
				}
			} else {
				alert('Fehler beim Erfassen');
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

<svelte:head><title>Rechnungen</title></svelte:head>

<div class="admin-container">
	<AdminHeader title="Rechnungen" count={data.invoices.length}></AdminHeader>

	<!-- Übersicht Rechnungen -->
	<section class="admin-card">
		<h2 class="admin-card-title">Gespeicherte Rechnungen</h2>

		{#if data.invoices.length === 0}
			<p class="admin-empty">Noch keine Rechnungen vorhanden.</p>
		{:else}
			<AdminBulkActions
				{selectedIds}
				actions={BULK_ACTIONS}
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
									aria-label="Alle auswählen"
									checked={allSelected}
									indeterminate={someSelected}
									on:change={(e) => toggleAll(e.currentTarget.checked)}
								/>
							</th>
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
								<td>
									<input
										type="checkbox"
										class="admin-checkbox"
										aria-label="Rechnung {inv.invoiceNumber} auswählen"
										bind:group={selectedIds}
										value={inv.id}
									/>
								</td>
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
											: inv.paymentStatus === 'storniert'
												? 'admin-badge-red'
												: 'admin-badge-orange'}"
									>
										{inv.paymentStatus === 'bezahlt'
											? '✓ bezahlt'
											: inv.paymentStatus === 'storniert'
												? '✕ storniert'
												: inv.paymentStatus === 'gemahnt'
													? `! ${inv.dunning?.length ?? 1}. Mahnung`
													: '⏱ offen'}
									</span>
								</td>
								<td>
									<span class="text-xs">{inv.paymentMethod === 'bar' ? 'Bar' : 'Rechnung'}</span>
									{#if inv.source && SOURCE_LABELS[inv.source]}
										<span class="admin-muted block text-xs">{SOURCE_LABELS[inv.source]}</span>
									{/if}
									{#if inv.recurrence?.active}
										<span class="admin-muted block text-xs"
											>↻ jährlich, nächste {formatDateShort(inv.recurrence.nextDate)}</span
										>
									{/if}
								</td>
								<td class="nowrap">
									<button on:click={() => openEdit(inv.id)} class="admin-link"> Bearbeiten </button>
									<a
										href="/admin/rechnungen/pdf/{inv.id}"
										target="_blank"
										rel="noopener"
										class="admin-link ml-3">PDF</a
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<!-- Zahlungsabgleich -->
	<section class="admin-card">
		<h2 class="admin-card-title">Zahlungsabgleich</h2>
		<p class="admin-muted mb-3">
			Bank-Export (CSV) hochladen: Offene und gemahnte Rechnungen, deren Referenz im Export steht
			und deren Betrag in derselben Zeile stimmt, werden auf «bezahlt» gesetzt (Zahlungsdatum aus
			der Zeile).
		</p>
		<form
			method="POST"
			action="?/reconcile"
			enctype="multipart/form-data"
			class="flex flex-wrap items-center gap-3"
			use:enhance={reconcileEnhance}
		>
			<input type="file" name="csv" accept=".csv,text/csv" required class="admin-input w-auto" />
			<label class="flex items-center gap-2">
				<input type="checkbox" name="dry-run" class="admin-checkbox" />
				<span>Nur prüfen (nichts verbuchen)</span>
			</label>
			<button type="submit" class="admin-btn admin-btn-primary" disabled={matching}>
				{matching ? 'Wird abgeglichen …' : 'Abgleichen'}
			</button>
		</form>
		{#if matchError}
			<p class="admin-notice admin-notice-error mt-3">{matchError}</p>
		{/if}
		{#if matchResults}
			{#if !matchResults.length}
				<p class="admin-empty mt-3">Keine Referenzen von Rechnungen im Export gefunden.</p>
			{:else}
				<p class="admin-muted mt-3">
					{matchResults.filter((r) => r.status === 'bezahlt').length}
					{matchDryRun ? 'würden auf bezahlt gesetzt (nur geprüft)' : 'auf bezahlt gesetzt'}
				</p>
				<div class="admin-table-wrap mt-2">
					<table class="admin-table">
						<thead>
							<tr>
								<th>Zeile</th>
								<th>Rechnung</th>
								<th>Kunde</th>
								<th class="text-right">Betrag Rechnung</th>
								<th class="text-right">Betrag Export</th>
								<th>Datum</th>
								<th>Ergebnis</th>
							</tr>
						</thead>
						<tbody>
							{#each matchResults as r}
								<tr>
									<td>{r.row}</td>
									<td class="admin-mono nowrap">{r.invoiceNumber ?? r.reference}</td>
									<td>{r.customer ?? '—'}</td>
									<td class="text-right">{r.expected?.toFixed(2) ?? '—'}</td>
									<td class="text-right">{r.amounts.map((a) => a.toFixed(2)).join(' / ') || '—'}</td
									>
									<td class="nowrap">{r.date ? formatDateShort(r.date) : '—'}</td>
									<td class="nowrap">
										{r.status === 'bezahlt' && matchDryRun
											? '✓ würde auf bezahlt gesetzt'
											: MATCH_LABELS[r.status]}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
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
								<div
									class="rounded-md border border-gray-200 bg-[var(--admin-surface)] p-3 text-sm"
								>
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
								{#if data.services.length}
									<select
										class="admin-input admin-input-sm w-44"
										aria-label="Leistung wählen"
										on:change={(e) => pickService(idx, e.currentTarget)}
									>
										<option value="">Leistung wählen …</option>
										{#each data.services as service}
											<option value={service.uid}>
												{service.label}{service.price !== null
													? ` (${service.price.toFixed(2)})`
													: ''}
											</option>
										{/each}
									</select>
								{/if}
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

				<!-- Rechnungsdatum -->
				<fieldset class="admin-fieldset">
					<legend>Rechnungsdatum</legend>
					<input
						type="date"
						bind:value={invoiceDate}
						max={todaySwiss()}
						required
						class="admin-input mt-2 w-auto"
					/>
					<p class="admin-hint mt-1">Heute oder früher (rückdatieren möglich).</p>
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
											{#if data.services.length}
												<select
													class="admin-input admin-input-sm w-44"
													aria-label="Leistung wählen"
													on:change={(e) => pickEditService(idx, e.currentTarget)}
												>
													<option value="">Leistung wählen …</option>
													{#each data.services as service}
														<option value={service.uid}>
															{service.label}{service.price !== null
																? ` (${service.price.toFixed(2)})`
																: ''}
														</option>
													{/each}
												</select>
											{/if}
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
										<option value="gemahnt">! gemahnt</option>
										<option value="bezahlt">✓ bezahlt</option>
										<option value="storniert">✕ storniert</option>
									</select>
									{#if editingInvoice.paymentStatus === 'bezahlt'}
										<label class="admin-label mt-2" for="paid-date">Bezahlt am</label>
										<input
											id="paid-date"
											type="date"
											bind:value={editPaidDate}
											max={todaySwiss()}
											class="admin-input admin-input-sm w-auto"
										/>
									{/if}
								</div>
							</fieldset>

							{#if editingInvoice.dunning?.length}
								<fieldset class="admin-fieldset">
									<legend>Mahnungen</legend>
									<ul class="mt-2 space-y-1 text-sm">
										{#each editingInvoice.dunning as d}
											<li>
												{d.level}. Mahnung am {formatDateShort(d.at.slice(0, 10))}, neue Frist {formatDateShort(
													d.dueDate
												)}
												{d.sent ? '(gemailt)' : '(nicht gemailt)'}
											</li>
										{/each}
									</ul>
								</fieldset>
							{/if}

							<fieldset class="admin-fieldset">
								<legend>Wiederholung</legend>
								<label class="mt-2 flex items-center gap-2">
									<input type="checkbox" bind:checked={editRecurring} class="admin-checkbox" />
									<span>Jährlich wiederholen</span>
								</label>
								{#if editRecurring}
									<label class="admin-label mt-2" for="recurring-next">Nächste Rechnung am</label>
									<input
										id="recurring-next"
										type="date"
										bind:value={editRecurringNext}
										required
										class="admin-input admin-input-sm w-auto"
									/>
									<p class="admin-hint mt-1">
										An diesem Tag wird eine Kopie mit neuer Nummer erstellt und an den Kunden
										gemailt, danach jedes Jahr.
									</p>
								{/if}
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
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={recurring} class="admin-checkbox" />
							<span
								>Jährlich wiederholen (nächste Rechnung am {invoiceDate
									? formatDateShort(addYearIso(invoiceDate))
									: '—'}, automatisch gemailt)</span
							>
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
