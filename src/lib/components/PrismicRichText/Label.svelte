<script lang="ts">
	import { _ } from '$lib/stores/i18n';

	export let node: any;
	const name = node?.data?.label ?? '';

	// Label «copy»: text can be copied with a button after it (e.g. commands, codes, addresses)
	let textEl: HTMLElement;
	let copied = false;
	let timer: ReturnType<typeof setTimeout>;

	async function copy() {
		const text = textEl?.innerText.trim() ?? '';
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// Fallback (older browsers / no clipboard permission): select the text
			const range = document.createRange();
			range.selectNodeContents(textEl);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
			document.execCommand('copy');
		}
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 1800);
	}
</script>

{#if name === 'copy'}
	<span class="rt-label rt-copy"
		><span bind:this={textEl}><slot /></span><button
			type="button"
			class="rt-copy-btn"
			on:click={copy}
			aria-label={copied ? $_('Kopiert') : $_('Kopieren')}
			title={copied ? $_('Kopiert') : $_('Kopieren')}
		>
			{#if copied}
				<svg
					width="1em"
					height="1em"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg
				>
			{:else}
				<svg
					width="1em"
					height="1em"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					><rect x="9" y="9" width="13" height="13" rx="2" /><path
						d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
					/></svg
				>
			{/if}
		</button></span
	>
{:else}
	<span class={`rt-label rt-${name}`}>
		<slot />
	</span>
{/if}

<style>
	.rt-label {
		display: inline;
	}

	/* deine Styles hier -> gelten sicher für dieses Span */
	.rt-highlight {
		color: var(--highlight-color, currentColor);
		background-color: var(--highlight-bg-color, transparent);
		border-radius: 0.15em;
		padding: 0.05em 0.2em;
	}

	.rt-copy-btn {
		display: inline-flex;
		align-items: center;
		vertical-align: middle;
		margin-left: 0.35em;
		padding: 0.15em;
		border: 0;
		border-radius: 0.25em;
		background: transparent;
		color: inherit;
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 150ms ease;
	}
	.rt-copy-btn:hover,
	.rt-copy-btn:focus-visible {
		opacity: 1;
		background-color: color-mix(in srgb, currentColor 10%, transparent);
	}
</style>
