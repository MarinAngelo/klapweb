<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { page } from '$app/stores';
	import { _ } from '$lib/stores/i18n';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';

	export let data: PageData;
	export let form: ActionData;

	let selectedUid = data.newsletters[0]?.uid ?? '';
	let testEmail = data.defaultTestEmail;
	let confirmed = false;
	let confirmedSelected = false;
	let busy: '' | 'test' | 'send' | 'selected' = '';

	// Selection for "An ausgewählte Kunden senden"
	let selectedEmails: string[] = [];
	let filter = '';
	const recipientLabel = (r: (typeof data.recipients)[number]) =>
		[[r.vorname, r.nachname].filter(Boolean).join(' '), r.firma].filter(Boolean).join(' · ') ||
		r.email;
	$: filteredRecipients = data.recipients.filter((r) =>
		`${recipientLabel(r)} ${r.email}`.toLowerCase().includes(filter.trim().toLowerCase())
	);
	function toggleRecipient(email: string, event: Event) {
		const checked = (event.currentTarget as HTMLInputElement).checked;
		selectedEmails = checked
			? [...selectedEmails, email]
			: selectedEmails.filter((x) => x !== email);
	}

	function selectFiltered(select: boolean) {
		const emails = filteredRecipients.map((r) => r.email);
		selectedEmails = select
			? [...new Set([...selectedEmails, ...emails])]
			: selectedEmails.filter((e) => !emails.includes(e));
	}

	$: selected = data.newsletters.find((n) => n.uid === selectedUid);
	$: alreadySent = data.sends.filter((s) => s.uid === selectedUid);
	$: formError = (form as { error?: string } | null)?.error;
	$: testSent = (form as { testSent?: string } | null)?.testSent;
	$: sentCount = (form as { sent?: number } | null)?.sent;
	$: removedEmail = (form as { removed?: string } | null)?.removed;

	// Abonnenten-Übersicht
	let subscriberFilter = '';
	$: filteredSubscribers = data.subscribers.filter((sub) =>
		`${sub.vorname ?? ''} ${sub.nachname ?? ''} ${sub.email}`
			.toLowerCase()
			.includes(subscriberFilter.trim().toLowerCase())
	);
	$: activeSubscriberCount = data.subscribers.filter((sub) => !sub.unsubscribed).length;
	$: csvHref = `/admin/newsletter/abonnenten.csv?lang=${$page.data.lang ?? 'de-ch'}`;

	// Ask before removing; cancel() stops the enhanced submit
	function confirmRemove(email: string): SubmitFunction {
		return ({ cancel }) => {
			if (
				!confirm(
					`${email}: ${$_('Abonnent wirklich entfernen? Die Adresse erhält danach keine Info-Mails mehr.')}`
				)
			) {
				cancel();
			}
		};
	}

	const fmtDate = (iso: string) =>
		new Date(iso).toLocaleString('de-CH', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});

	function submitting(kind: 'test' | 'send' | 'selected') {
		return () => {
			busy = kind;
			return async ({ update }: { update: () => Promise<void> }) => {
				await update();
				busy = '';
				confirmed = false;
				confirmedSelected = false;
			};
		};
	}
</script>

<div class="admin-container">
	<AdminHeader title={$_('Newsletter')} />
	<p class="admin-intro">
		{$_(
			'Info-Mails an alle Kunden senden. Die Mails verfassen Sie in Prismic (Typ „Newsletter“) und veröffentlichen sie dort – danach erscheinen sie hier.'
		)}
	</p>

	{#if data.loadError}
		<p class="admin-notice admin-notice-error" role="alert">{data.loadError}</p>
	{/if}
	{#if !data.mailConfigured}
		<p class="admin-notice admin-notice-error" role="alert">
			{$_('E-Mail-Versand nicht konfiguriert: RESEND_API_KEY und EMAIL_FROM_ADDRESS fehlen.')}
		</p>
	{/if}
	{#if formError}
		<p class="admin-notice admin-notice-error" role="alert">{$_(formError)}</p>
	{/if}
	{#if testSent}
		<p class="admin-notice admin-notice-ok" role="status">
			{$_('Test-Mail gesendet an')}
			{testSent}
		</p>
	{/if}
	{#if removedEmail}
		<p class="admin-notice admin-notice-ok" role="status">
			{$_('Abonnent entfernt')}: {removedEmail}
		</p>
	{/if}
	{#if sentCount !== undefined}
		<p class="admin-notice admin-notice-ok" role="status">
			{$_('Info-Mail gesendet an')}
			{sentCount}
			{$_('Empfänger')}
		</p>
	{/if}

	<div class="admin-stats md:grid-cols-3">
		<div class="admin-stat">
			<span class="admin-stat-value">{data.recipientCount}</span>
			<span class="admin-stat-label">{$_('Empfänger')}</span>
		</div>
		<div class="admin-stat">
			<span class="admin-stat-value">{data.unsubscribedCount}</span>
			<span class="admin-stat-label">{$_('Abgemeldet')}</span>
		</div>
		<div class="admin-stat">
			<span class="admin-stat-value">{data.sends.length}</span>
			<span class="admin-stat-label">{$_('Versände')}</span>
		</div>
	</div>

	{#if data.newsletters.length === 0}
		<p class="admin-notice">
			{$_(
				'Noch keine veröffentlichten Newsletter. Legen Sie in Prismic ein Dokument vom Typ „Newsletter“ an und veröffentlichen Sie es.'
			)}
		</p>
	{:else}
		<section class="admin-card">
			<label for="newsletter-select" class="admin-label">{$_('Newsletter wählen')}</label>
			<select id="newsletter-select" bind:value={selectedUid} class="admin-input">
				{#each data.newsletters as n}
					<option value={n.uid}>{n.subject} ({n.lang}, {fmtDate(n.publishedAt)})</option>
				{/each}
			</select>

			{#if selected}
				<p class="mt-3 text-sm">
					<a href="/newsletter/{selected.uid}" target="_blank" rel="noopener" class="admin-link"
						>{$_('Vorschau öffnen')} ↗</a
					>
				</p>
			{/if}
			{#if alreadySent.length}
				<p class="admin-notice admin-notice-warn mt-4">
					{$_('Dieser Newsletter wurde bereits versendet')}: {alreadySent
						.map((s) => `${fmtDate(s.sentAt)} (${s.recipientCount})`)
						.join(', ')}
				</p>
			{/if}
		</section>

		<section class="admin-card">
			<h2 class="admin-card-title">{$_('1. Test-Mail an mich')}</h2>
			<form
				method="POST"
				action="?/test"
				use:enhance={submitting('test')}
				class="flex flex-wrap gap-3 items-end"
			>
				<input type="hidden" name="uid" value={selectedUid} />
				<div class="grow">
					<label for="test-email" class="admin-label">{$_('Test-Adresse')}</label>
					<input
						id="test-email"
						name="testEmail"
						type="email"
						required
						bind:value={testEmail}
						class="admin-input"
					/>
				</div>
				<button
					type="submit"
					class="admin-btn admin-btn-primary"
					disabled={busy !== '' || !data.mailConfigured}
				>
					{busy === 'test' ? $_('Wird gesendet …') : $_('Test senden')}
				</button>
			</form>
		</section>

		<section class="admin-card">
			<h2 class="admin-card-title">{$_('2. An ausgewählte Kunden senden')}</h2>
			<form method="POST" action="?/sendSelected" use:enhance={submitting('selected')}>
				<input type="hidden" name="uid" value={selectedUid} />
				<div class="flex flex-wrap gap-3 items-center mb-3">
					<input
						type="search"
						bind:value={filter}
						placeholder={$_('Kunden suchen …')}
						aria-label={$_('Kunden suchen …')}
						class="admin-input w-auto grow"
					/>
					<button type="button" class="admin-link text-sm" on:click={() => selectFiltered(true)}
						>{$_('Alle auswählen')}</button
					>
					<button type="button" class="admin-link text-sm" on:click={() => selectFiltered(false)}
						>{$_('Keine')}</button
					>
				</div>
				<div class="admin-checklist">
					{#each filteredRecipients as r (r.email)}
						<label class="admin-checklist-item">
							<input
								type="checkbox"
								class="admin-checkbox"
								name="email"
								value={r.email}
								checked={selectedEmails.includes(r.email)}
								on:change={(e) => toggleRecipient(r.email, e)}
							/>
							<span class="flex flex-col">
								<span class="font-semibold">{recipientLabel(r)}</span>
								<span class="admin-muted text-sm"
									>{r.email}{#if r.source === 'abonnent'}
										· {$_('Abonnent')}{/if}</span
								>
							</span>
						</label>
					{:else}
						<p class="admin-muted text-sm">{$_('Keine Kunden gefunden')}</p>
					{/each}
				</div>
				<label class="flex items-center gap-3 my-4">
					<input
						type="checkbox"
						class="admin-checkbox"
						name="confirm"
						value="on"
						bind:checked={confirmedSelected}
					/>
					<span>
						{$_('Ich möchte diesen Newsletter jetzt an')}
						<strong>{selectedEmails.length} {$_('ausgewählte Empfänger')}</strong>
						{$_('senden.')}
					</span>
				</label>
				<button
					type="submit"
					class="admin-btn admin-btn-primary"
					disabled={!confirmedSelected ||
						selectedEmails.length === 0 ||
						busy !== '' ||
						!data.mailConfigured}
				>
					{busy === 'selected' ? $_('Wird gesendet …') : $_('An Auswahl senden')}
				</button>
			</form>
		</section>

		<section class="admin-card">
			<h2 class="admin-card-title">{$_('3. An alle Kunden senden')}</h2>
			<form method="POST" action="?/send" use:enhance={submitting('send')}>
				<input type="hidden" name="uid" value={selectedUid} />
				<label class="flex items-center gap-3 mb-4">
					<input
						type="checkbox"
						class="admin-checkbox"
						name="confirm"
						value="on"
						bind:checked={confirmed}
					/>
					<span>
						{$_('Ich möchte diesen Newsletter jetzt an')}
						<strong>{data.recipientCount} {$_('Empfänger')}</strong>
						{$_('senden.')}
					</span>
				</label>
				<button
					type="submit"
					class="admin-btn admin-btn-primary"
					disabled={!confirmed || busy !== '' || !data.mailConfigured || data.recipientCount === 0}
				>
					{busy === 'send' ? $_('Wird gesendet …') : $_('Jetzt senden')}
				</button>
			</form>
		</section>
	{/if}

	<section class="admin-card">
		<div class="flex flex-wrap items-center gap-3 mb-4">
			<h2>
				{$_('Abonnenten')} ({activeSubscriberCount})
			</h2>
			{#if data.subscribers.length}
				<a href={csvHref} class="admin-btn admin-btn-sm ml-auto" download
					>{$_('Als CSV exportieren')}</a
				>
			{/if}
		</div>
		<p class="admin-intro">
			{$_(
				'Anmeldungen über das Formular „Newsletter abonnieren“ (bestätigt per E-Mail). Das Bestätigungsdatum ist der Nachweis der Einwilligung.'
			)}
		</p>
		{#if data.subscribers.length === 0}
			<p class="admin-muted text-sm">{$_('Noch keine Abonnenten.')}</p>
		{:else}
			<input
				type="search"
				bind:value={subscriberFilter}
				placeholder={$_('Abonnenten suchen …')}
				aria-label={$_('Abonnenten suchen …')}
				class="admin-input mb-3"
			/>
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>{$_('Name')}</th>
							<th>{$_('E-Mail')}</th>
							<th>{$_('Sprache')}</th>
							<th>{$_('Bestätigt am')}</th>
							<th>{$_('Status')}</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredSubscribers as sub (sub.email)}
							<tr class:admin-row-muted={sub.unsubscribed}>
								<td>{[sub.vorname, sub.nachname].filter(Boolean).join(' ') || '–'}</td>
								<td>{sub.email}</td>
								<td>{sub.lang ?? '–'}</td>
								<td>{fmtDate(sub.confirmedAt)}</td>
								<td>{sub.unsubscribed ? $_('abgemeldet') : $_('aktiv')}</td>
								<td class="text-right">
									<form
										method="POST"
										action="?/removeSubscriber"
										use:enhance={confirmRemove(sub.email)}
									>
										<input type="hidden" name="email" value={sub.email} />
										<button type="submit" class="admin-link-danger text-xs"
											>{$_('Entfernen')}</button
										>
									</form>
								</td>
							</tr>
						{:else}
							<tr><td colspan="6" class="admin-empty">{$_('Keine Abonnenten gefunden')}</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	{#if data.sends.length}
		<section class="admin-card">
			<h2 class="admin-card-title">{$_('Verlauf')}</h2>
			<table class="admin-table">
				<thead>
					<tr>
						<th>{$_('Datum')}</th>
						<th>{$_('Betreff')}</th>
						<th>{$_('Versand an')}</th>
						<th class="text-right">{$_('Empfänger')}</th>
						<th class="text-right">{$_('Fehler')}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.sends as s}
						<tr>
							<td>{fmtDate(s.sentAt)}</td>
							<td>{s.subject}</td>
							<td>{s.mode === 'auswahl' ? $_('Auswahl') : $_('Alle')}</td>
							<td class="text-right">{s.recipientCount}</td>
							<td class="text-right">{s.failedCount}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}

	<p class="admin-hint">
		{$_(
			'Jede Mail enthält Ihre Absender-Angaben und einen Abmelde-Link. Abgemeldete Adressen werden automatisch ausgeschlossen.'
		)}
	</p>
</div>
