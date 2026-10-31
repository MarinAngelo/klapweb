<script lang="ts">
	import { _ } from '$lib/stores/i18n';

	export let data: { subject: string; html: string };

	let frame: HTMLIFrameElement;
	// Grow the iframe to the height of the e-mail (no inner scrollbar)
	function fitHeight() {
		const doc = frame?.contentDocument;
		if (doc) frame.style.height = `${doc.documentElement.scrollHeight}px`;
	}
</script>

<div class="newsletter-view">
	<p class="newsletter-hint">
		{$_('Web-Ansicht der Info-Mail – Platzhalter mit Beispiel-Empfänger')}
	</p>
	<iframe
		bind:this={frame}
		srcdoc={data.html}
		title={data.subject}
		on:load={fitHeight}
		sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
	></iframe>
</div>

<style>
	.newsletter-view {
		max-width: 720px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	.newsletter-hint {
		font-size: 0.85rem;
		opacity: 0.7;
		margin-bottom: 0.75rem;
	}

	iframe {
		display: block;
		width: 100%;
		min-height: 600px;
		border: 0;
		border-radius: 12px;
	}
</style>
