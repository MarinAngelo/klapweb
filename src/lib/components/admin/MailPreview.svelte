<script lang="ts">
	/**
	 * E-mail preview page of an admin area (/admin/BEREICH/e-mails): list of the
	 * automatic e-mails with recipient, subject, attachment and text.
	 * Data: `PreviewMail[]` from the page load (builders in $lib/server/bookingMails.ts, invoiceMails.ts …).
	 * Slot: area-specific hints (e.g. example appointment) below the intro.
	 */
	import type { PreviewMail } from '$lib/server/mailText';
	import type { TextStyle } from '$lib/addressForm';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';

	export let mails: PreviewMail[];
	/** Back link to the area */
	export let backHref: string;
	/** i18n key */
	export let backLabel: string;
	/** i18n key */
	export let intro: string;
	export let from = '';
	export let style: TextStyle | null = null;
	/** Language switch (more than one language): links with ?mail_lang= (not ?lang=, that switches the admin UI) */
	export let languages: { id: string; name: string }[] = [];
	export let lang = '';

	/** HTML mails in an isolated frame (no scripts, no styles of the admin) */
	// Tag name split: Svelte would otherwise read the string as the component's style block
	const frameCss =
		'body{font-family:sans-serif;font-size:14px;line-height:1.5;margin:12px;color:#222;background:#fafaf9}p{margin:0 0 .6em}';
	const srcdoc = (html: string) =>
		`<!doctype html><meta charset="utf-8"><base target="_blank"><${'style'}>${frameCss}</${'style'}>${html}`;
</script>

<svelte:head><title>{$_('E-Mail-Vorschau')}</title></svelte:head>

<div class="admin-container">
	<AdminHeader title={$_('E-Mail-Vorschau')} />
	<a href={backHref} class="admin-link mb-4 inline-block">← {$_(backLabel)}</a>

	<p class="admin-intro">{$_(intro)}</p>
	{#if languages.length > 1}
		<nav class="mb-3 flex flex-wrap gap-2" aria-label={$_('Sprache')}>
			{#each languages as l (l.id)}
				<a
					href="?mail_lang={l.id}"
					class="admin-btn"
					class:admin-btn-dark={l.id === lang}
					aria-current={l.id === lang ? 'true' : undefined}>{l.name}</a
				>
			{/each}
		</nav>
	{/if}
	<p class="admin-hint mb-4">
		<slot />
		{$_('Absender')}: {from || '–'}
		{#if style}· {$_('Anrede')}: {style.du ? 'Du' : 'Sie'}, «{style.greeting}»{/if}
	</p>

	{#each mails as mail (mail.id)}
		<section class="admin-card" class:admin-row-muted={!mail.active}>
			<h2 class="admin-card-title flex flex-wrap items-center gap-2">
				{$_(mail.label)}
				{#if mail.active}
					<span class="admin-badge admin-badge-green">{$_('wird verschickt')}</span>
				{:else}
					<span class="admin-badge admin-badge-yellow"
						>{$_('mit den aktuellen Einstellungen nicht verschickt')}</span
					>
				{/if}
			</h2>
			<p class="admin-hint mb-3">{$_(mail.when)}</p>

			<dl class="mail-meta">
				<dt>{$_('An')}</dt>
				<dd>{mail.to || $_('– (keine Adresse in den Einstellungen)')}</dd>
				<dt>{$_('Betreff')}</dt>
				<dd><strong>{mail.subject}</strong></dd>
				{#if mail.attachment}
					<dt>{$_('Anhang')}</dt>
					<dd>📎 {mail.attachment}</dd>
				{/if}
			</dl>

			{#if mail.html}
				<iframe
					class="mail-body"
					title={mail.subject}
					sandbox="allow-popups"
					srcdoc={srcdoc(mail.html)}
				></iframe>
			{:else}
				<pre class="mail-body mail-text">{mail.text}</pre>
			{/if}
		</section>
	{/each}
</div>

<style>
	.mail-meta {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.25rem 1rem;
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
	}
	.mail-meta dt {
		color: var(--admin-label);
	}
	.mail-meta dd {
		margin: 0;
		overflow-wrap: anywhere;
	}
	.mail-body {
		display: block;
		width: 100%;
		border: 1px solid var(--admin-border);
		border-radius: 0.375rem;
		background: var(--admin-surface);
	}
	iframe.mail-body {
		height: 26rem;
	}
	.mail-text {
		margin: 0;
		padding: 0.75rem;
		font-family: inherit;
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		color: var(--admin-text);
	}
</style>
