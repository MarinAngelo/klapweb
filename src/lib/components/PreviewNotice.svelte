<script lang="ts">
	/**
	 * «Vorschau aktiv» notice while a Prismic preview cookie is set — only when the Prismic
	 * toolbar does not show (Brave/Safari/private windows block it). Without the toolbar nobody
	 * notices they are looking at unpublished content, nor can they leave the preview.
	 * With the toolbar: no notice — only its «Exit preview» ends the session at prismic.io;
	 * deleting the cookie alone would be undone by the toolbar (it re-sets it from the session).
	 * Popover API (top layer, manual: stays until «Vorschau beenden»).
	 */
	import { onMount } from 'svelte';
	import { cookie } from '@prismicio/client';
	import { _ } from '$lib/stores/i18n';

	/** The toolbar may take a few seconds to connect to prismic.io before it shows its bar */
	const TOOLBAR_WAIT_MS = 5000;

	let popoverEl: HTMLElement;
	let active = false;

	const hasPreviewCookie = () =>
		document.cookie.split('; ').some((c) => c.startsWith(`${cookie.preview}=`));
	// Prismic toolbar: host #prismic-toolbar (open shadow root), the bar only while a preview runs
	const toolbarVisible = () =>
		!!document.getElementById('prismic-toolbar')?.shadowRoot?.querySelector('.bar');

	onMount(() => {
		const started = Date.now();
		const check = () => {
			active = hasPreviewCookie() && !toolbarVisible() && Date.now() - started >= TOOLBAR_WAIT_MS;
		};
		const timer = setInterval(check, 1000);
		return () => clearInterval(timer);
	});

	$: if (active && popoverEl && !popoverEl.matches(':popover-open')) {
		try {
			popoverEl.showPopover();
		} catch {
			// Popover API not supported → element stays in the page flow (still visible)
		}
	}

	function exitPreview() {
		document.cookie = `${cookie.preview}=; Max-Age=0; path=/`;
		// /preview/… only exists for previews → open the same page without the prefix
		const path = window.location.pathname.replace(/^\/preview(?=\/|$)/, '') || '/';
		window.location.assign(path + window.location.search + window.location.hash);
	}
</script>

{#if active}
	<div bind:this={popoverEl} popover="manual" class="preview-notice" role="status">
		<span
			><strong>{$_('Vorschau aktiv')}</strong> – {$_('du siehst unveröffentlichte Inhalte.')}</span
		>
		<button type="button" class="preview-notice-btn" on:click={exitPreview}
			>{$_('Vorschau beenden')}</button
		>
	</div>
{/if}

<style>
	/* Neutral, theme-independent tool UI (like the admin) */
	.preview-notice {
		inset: 0.75rem auto auto 50%;
		transform: translateX(-50%);
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.5rem 1rem;
		max-width: calc(100vw - 2rem);
		padding: 0.6rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background: #1f2937;
		color: #fff;
		font:
			500 0.9rem/1.4 system-ui,
			sans-serif;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
	}
	.preview-notice-btn {
		padding: 0.3rem 0.8rem;
		border: 1px solid rgba(255, 255, 255, 0.6);
		border-radius: 0.375rem;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	.preview-notice-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}
</style>
