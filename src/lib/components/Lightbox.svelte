<script lang="ts">
	export let src: string;
	export let alt: string = '';

	let dialog: HTMLDialogElement;

	function openDialog() {
		dialog.showModal();
		document.body.style.overflow = 'hidden';
	}

	function closeDialog() {
		dialog.close();
		document.body.style.overflow = '';
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === dialog) closeDialog();
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="trigger" on:click={openDialog}>
	<slot />
</div>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog bind:this={dialog} on:click={onBackdropClick} on:cancel={closeDialog}>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="content" on:click|stopPropagation>
		<img {src} {alt} class="img" />
	</div>
	<button type="button" class="close" on:click={closeDialog} aria-label="Schliessen">×</button>
</dialog>

<style>
	.trigger {
		cursor: zoom-in;
		display: contents;
	}

	dialog {
		padding: 0;
		border: none;
		background: transparent;
		max-width: 100vw;
		max-height: 100vh;
		overflow: visible;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.92);
		animation: lb-in 0.2s ease;
	}

	.img {
		max-width: min(90vw, 1600px);
		max-height: 90vh;
		object-fit: contain;
		border-radius: 4px;
		box-shadow: 0 8px 48px rgba(0, 0, 0, 0.6);
		display: block;
		animation: lb-zoom 0.2s ease;
	}

	.close {
		position: fixed;
		top: 1rem;
		right: 1.25rem;
		color: #fff;
		font-size: 2.5rem;
		line-height: 1;
		background: none;
		border: none;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.15s;
	}

	.close:hover {
		opacity: 1;
	}

	@keyframes lb-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes lb-zoom {
		from { transform: scale(0.92); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
</style>
