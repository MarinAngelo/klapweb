<script lang="ts">
	import type { PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';

	export let data: PageData;

	/** HTML mails in an isolated frame (no scripts, no styles of the admin) */
	const srcdoc = (html: string) =>
		`<!doctype html><meta charset="utf-8"><base target="_blank"><style>body{font-family:sans-serif;font-size:14px;line-height:1.5;margin:12px;color:#222;background:#fafaf9}p{margin:0 0 .6em}</style>${html}`;
</script>

<svelte:head><title>{$_('E-Mail-Vorschau')}</title></svelte:head>

<div class="admin-container">
	<AdminHeader title={$_('E-Mail-Vorschau')} />
	<a href="/admin/buchungen" class="admin-link mb-4 inline-block">← {$_('Terminverwaltung')}</a>

	<p class="admin-intro">
		{$_(
			'Diese E-Mails verschickt die Terminbuchung automatisch. Die Vorschau verwendet Ihre aktuellen Einstellungen und einen Beispiel-Termin; Name und E-Mail der Kundschaft sind Beispiele.'
		)}
	</p>
	<p class="admin-hint mb-4">
		{$_('Beispiel-Termin')}: {data.example.titel}, {data.example.dateLabel}
		{#if !data.example.fromPrismic}({$_('kein freier Termin gefunden — erfundenes Beispiel')}){/if}
		· {$_('Absender')}: {data.from || '–'}
		· {$_('Anrede')}: {data.du ? 'Du' : 'Sie'}
	</p>

	{#each data.mails as mail (mail.id)}
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
