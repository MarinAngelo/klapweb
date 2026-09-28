<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { page } from '$app/stores';
	import { _ } from '$lib/stores/i18n';
	import Button from '$lib/components/Button.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';

	export let data: PageData;
	export let form: ActionData;

	$: dashboardHref = `/admin/dashboard`;

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

<div class="max-w-4xl mx-auto px-4 py-10">
	<a href={dashboardHref} class="text-sm underline">← {$_('Zurück zum Dashboard')}</a>
	<h1 class="mt-4 mb-2">{$_('Newsletter')}</h1>
	<p class="mb-8 opacity-80">
		{$_(
			'Info-Mails an alle Kunden senden. Die Mails verfassen Sie in Prismic (Typ „Newsletter“) und veröffentlichen sie dort – danach erscheinen sie hier.'
		)}
	</p>

	{#if data.loadError}
		<p class="notice notice-error" role="alert">{data.loadError}</p>
	{/if}
	{#if !data.mailConfigured}
		<p class="notice notice-error" role="alert">
			{$_('E-Mail-Versand nicht konfiguriert: RESEND_API_KEY und EMAIL_FROM_ADDRESS fehlen.')}
		</p>
	{/if}
	{#if formError}
		<p class="notice notice-error" role="alert">{$_(formError)}</p>
	{/if}
	{#if testSent}
		<p class="notice notice-ok" role="status">{$_('Test-Mail gesendet an')} {testSent}</p>
	{/if}
	{#if removedEmail}
		<p class="notice notice-ok" role="status">{$_('Abonnent entfernt')}: {removedEmail}</p>
	{/if}
	{#if sentCount !== undefined}
		<p class="notice notice-ok" role="status">
			{$_('Info-Mail gesendet an')}
			{sentCount}
			{$_('Empfänger')}
		</p>
	{/if}

	<div class="stats">
		<div class="stat">
			<span class="stat-value">{data.recipientCount}</span>
			<span class="stat-label">{$_('Empfänger')}</span>
		</div>
		<div class="stat">
			<span class="stat-value">{data.unsubscribedCount}</span>
			<span class="stat-label">{$_('Abgemeldet')}</span>
		</div>
		<div class="stat">
			<span class="stat-value">{data.sends.length}</span>
			<span class="stat-label">{$_('Versände')}</span>
		</div>
	</div>

	{#if data.newsletters.length === 0}
		<p class="notice">
			{$_(
				'Noch keine veröffentlichten Newsletter. Legen Sie in Prismic ein Dokument vom Typ „Newsletter“ an und veröffentlichen Sie es.'
			)}
		</p>
	{:else}
		<section class="card">
			<label for="newsletter-select" class="block font-semibold mb-2"
				>{$_('Newsletter wählen')}</label
			>
			<select id="newsletter-select" bind:value={selectedUid} class="field">
				{#each data.newsletters as n}
					<option value={n.uid}>{n.subject} ({n.lang}, {fmtDate(n.publishedAt)})</option>
				{/each}
			</select>

			{#if selected}
				<p class="mt-3 text-sm">
					<a href="/newsletter/{selected.uid}" target="_blank" rel="noopener" class="underline"
						>{$_('Vorschau öffnen')} ↗</a
					>
				</p>
			{/if}
			{#if alreadySent.length}
				<p class="notice notice-warn mt-4">
					{$_('Dieser Newsletter wurde bereits versendet')}: {alreadySent
						.map((s) => `${fmtDate(s.sentAt)} (${s.recipientCount})`)
						.join(', ')}
				</p>
			{/if}
		</section>

		<section class="card">
			<h2 class="card-title">{$_('1. Test-Mail an mich')}</h2>
			<form
				method="POST"
				action="?/test"
				use:enhance={submitting('test')}
				class="flex flex-wrap gap-3 items-end"
			>
				<input type="hidden" name="uid" value={selectedUid} />
				<div class="grow">
					<label for="test-email" class="block text-sm mb-1">{$_('Test-Adresse')}</label>
					<input
						id="test-email"
						name="testEmail"
						type="email"
						required
						bind:value={testEmail}
						class="field"
					/>
				</div>
				<Button
					text={busy === 'test' ? $_('Wird gesendet …') : $_('Test senden')}
					size="sm"
					mb={false}
					disabled={busy !== '' || !data.mailConfigured}
				/>
			</form>
		</section>

		<section class="card">
			<h2 class="card-title">{$_('2. An ausgewählte Kunden senden')}</h2>
			<form method="POST" action="?/sendSelected" use:enhance={submitting('selected')}>
				<input type="hidden" name="uid" value={selectedUid} />
				<div class="flex flex-wrap gap-3 items-center mb-3">
					<input
						type="search"
						bind:value={filter}
						placeholder={$_('Kunden suchen …')}
						aria-label={$_('Kunden suchen …')}
						class="field grow"
						style="width: auto;"
					/>
					<button type="button" class="link-btn" on:click={() => selectFiltered(true)}
						>{$_('Alle auswählen')}</button
					>
					<button type="button" class="link-btn" on:click={() => selectFiltered(false)}
						>{$_('Keine')}</button
					>
				</div>
				<div class="recipient-list">
					{#each filteredRecipients as r (r.email)}
						<label class="recipient">
							<Checkbox
								name="email"
								value={r.email}
								checked={selectedEmails.includes(r.email)}
								on:change={(e) => toggleRecipient(r.email, e)}
							/>
							<span>
								<span class="font-semibold">{recipientLabel(r)}</span>
								<span class="text-sm opacity-70"
									>{r.email}{#if r.source === 'abonnent'}
										· {$_('Abonnent')}{/if}</span
								>
							</span>
						</label>
					{:else}
						<p class="text-sm opacity-70">{$_('Keine Kunden gefunden')}</p>
					{/each}
				</div>
				<label class="flex items-center gap-3 my-4">
					<Checkbox name="confirm" value="on" bind:checked={confirmedSelected} />
					<span>
						{$_('Ich möchte diesen Newsletter jetzt an')}
						<strong>{selectedEmails.length} {$_('ausgewählte Empfänger')}</strong>
						{$_('senden.')}
					</span>
				</label>
				<Button
					text={busy === 'selected' ? $_('Wird gesendet …') : $_('An Auswahl senden')}
					size="sm"
					mb={false}
					disabled={!confirmedSelected ||
						selectedEmails.length === 0 ||
						busy !== '' ||
						!data.mailConfigured}
				/>
			</form>
		</section>

		<section class="card">
			<h2 class="card-title">{$_('3. An alle Kunden senden')}</h2>
			<form method="POST" action="?/send" use:enhance={submitting('send')}>
				<input type="hidden" name="uid" value={selectedUid} />
				<label class="flex items-center gap-3 mb-4">
					<Checkbox name="confirm" value="on" bind:checked={confirmed} />
					<span>
						{$_('Ich möchte diesen Newsletter jetzt an')}
						<strong>{data.recipientCount} {$_('Empfänger')}</strong>
						{$_('senden.')}
					</span>
				</label>
				<Button
					text={busy === 'send' ? $_('Wird gesendet …') : $_('Jetzt senden')}
					size="sm"
					mb={false}
					disabled={!confirmed || busy !== '' || !data.mailConfigured || data.recipientCount === 0}
				/>
			</form>
		</section>
	{/if}

	<section class="card">
		<div class="flex flex-wrap items-center gap-3 mb-4">
			<h2 class="card-title" style="margin: 0;">
				{$_('Abonnenten')} ({activeSubscriberCount})
			</h2>
			{#if data.subscribers.length}
				<a href={csvHref} class="link-btn ml-auto" download>{$_('Als CSV exportieren')}</a>
			{/if}
		</div>
		<p class="text-sm opacity-70 mb-4">
			{$_(
				'Anmeldungen über das Formular „Newsletter abonnieren“ (bestätigt per E-Mail). Das Bestätigungsdatum ist der Nachweis der Einwilligung.'
			)}
		</p>
		{#if data.subscribers.length === 0}
			<p class="text-sm opacity-70">{$_('Noch keine Abonnenten.')}</p>
		{:else}
			<input
				type="search"
				bind:value={subscriberFilter}
				placeholder={$_('Abonnenten suchen …')}
				aria-label={$_('Abonnenten suchen …')}
				class="field mb-3"
			/>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr>
							<th class="text-left">{$_('Name')}</th>
							<th class="text-left">{$_('E-Mail')}</th>
							<th class="text-left">{$_('Sprache')}</th>
							<th class="text-left">{$_('Bestätigt am')}</th>
							<th class="text-left">{$_('Status')}</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredSubscribers as sub (sub.email)}
							<tr class:unsubscribed={sub.unsubscribed}>
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
										<button type="submit" class="link-btn remove-btn">{$_('Entfernen')}</button>
									</form>
								</td>
							</tr>
						{:else}
							<tr><td colspan="6" class="opacity-70">{$_('Keine Abonnenten gefunden')}</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	{#if data.sends.length}
		<section class="card">
			<h2 class="card-title">{$_('Verlauf')}</h2>
			<table class="w-full text-sm">
				<thead>
					<tr>
						<th class="text-left">{$_('Datum')}</th>
						<th class="text-left">{$_('Betreff')}</th>
						<th class="text-left">{$_('Versand an')}</th>
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

	<p class="mt-8 text-sm opacity-70">
		{$_(
			'Jede Mail enthält Ihre Absender-Angaben und einen Abmelde-Link. Abgemeldete Adressen werden automatisch ausgeschlossen.'
		)}
	</p>
</div>

<style>
	.card {
		border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
		border-radius: 12px;
		padding: 1.25rem;
		margin-bottom: 1.25rem;
	}

	.card-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 1rem;
	}

	.field {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
		border-radius: 8px;
		background: transparent;
		color: inherit;
		font: inherit;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat {
		border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
		border-radius: 12px;
		padding: 1rem;
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 1.75rem;
		font-weight: 700;
	}

	.stat-label {
		font-size: 0.85rem;
		opacity: 0.75;
	}

	.notice {
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		background: color-mix(in srgb, currentColor 6%, transparent);
	}

	.notice-error {
		background: #fee2e2;
		color: #991b1b;
	}

	.notice-ok {
		background: #dcfce7;
		color: #166534;
	}

	.notice-warn {
		background: #fef3c7;
		color: #92400e;
	}

	.recipient-list {
		max-height: 18rem;
		overflow-y: auto;
		border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
		border-radius: 8px;
		padding: 0.25rem 0.75rem;
	}

	.recipient {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent);
		cursor: pointer;
	}

	.recipient:last-child {
		border-bottom: none;
	}

	.recipient > span {
		display: flex;
		flex-direction: column;
	}

	.link-btn {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		font-size: 0.875rem;
		color: inherit;
		text-decoration: underline;
		cursor: pointer;
	}

	tr.unsubscribed td {
		opacity: 0.5;
	}

	.remove-btn {
		color: #dc2626;
	}

	th,
	td {
		padding: 0.4rem 0.5rem;
		border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
	}
</style>
