<script lang="ts">
	import { _ } from '$lib/stores/i18n';

	export let botName: string = 'Assistent';
	export let greeting: string = 'Hallo! Wie kann ich helfen?';

	type Message = { role: 'user' | 'bot'; text: string };

	let isOpen = false;
	let input = '';
	let loading = false;
	let messages: Message[] = [];
	let messagesEl: HTMLElement;

	$: if (isOpen && messages.length === 0) {
		messages = [{ role: 'bot', text: greeting }];
	}

	async function send() {
		const text = input.trim();
		if (!text || loading) return;

		input = '';
		messages = [...messages, { role: 'user', text }];
		loading = true;
		tick().then(scrollToBottom);

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ message: text })
			});
			const data = await res.json();
			messages = [...messages, { role: 'bot', text: data.reply || data.error || 'Fehler' }];
		} catch {
			messages = [...messages, { role: 'bot', text: 'Verbindungsfehler.' }];
		} finally {
			loading = false;
			tick().then(scrollToBottom);
		}
	}

	function scrollToBottom() {
		messagesEl?.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	import { tick, onMount } from 'svelte';

	let visible = false;

	onMount(() => {
		const threshold = window.innerHeight;
		function onScroll() {
			visible = window.scrollY >= threshold;
		}
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<div
	style="position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9000; display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; transition: opacity 0.3s, transform 0.3s; opacity: {visible
		? 1
		: 0}; transform: {visible ? 'translateY(0)' : 'translateY(1rem)'}; pointer-events: {visible
		? 'auto'
		: 'none'};"
>
	{#if isOpen}
		<div
			style="
			width: 340px;
			max-width: calc(100vw - 3rem);
			background: white;
			border-radius: 0.75rem;
			box-shadow: 0 8px 32px rgba(0,0,0,0.18);
			display: flex;
			flex-direction: column;
			overflow: hidden;
			max-height: 480px;
		"
		>
			<!-- Header -->
			<div
				style="background: #111827; color: white; padding: 0.875rem 1rem; display: flex; align-items: center; justify-content: space-between;"
			>
				<span style="font-weight: 600; font-size: 0.9375rem;">{botName}</span>
				<button
					on:click={() => (isOpen = false)}
					aria-label={$_('Chat schliessen')}
					style="background: none; border: none; color: white; cursor: pointer; line-height: 1; padding: 0.25rem; opacity: 0.8;"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path
							d="M2 2L14 14M14 2L2 14"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>

			<!-- Messages -->
			<div
				bind:this={messagesEl}
				style="flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.625rem; min-height: 200px;"
			>
				{#each messages as msg}
					<div
						style="display: flex; justify-content: {msg.role === 'user'
							? 'flex-end'
							: 'flex-start'};"
					>
						<div
							style="
						max-width: 80%;
						padding: 0.5rem 0.75rem;
						border-radius: {msg.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem'};
						background: {msg.role === 'user' ? '#111827' : '#f3f4f6'};
						color: {msg.role === 'user' ? 'white' : '#111827'};
						font-size: 0.875rem;
						line-height: 1.5;
						white-space: pre-wrap;
					"
						>
							{msg.text}
						</div>
					</div>
				{/each}

				{#if loading}
					<div style="display: flex; justify-content: flex-start;">
						<div
							style="padding: 0.5rem 0.75rem; border-radius: 1rem 1rem 1rem 0.25rem; background: #f3f4f6; font-size: 0.875rem; color: #6b7280;"
						>
							{$_('Tippt')}
						</div>
					</div>
				{/if}
			</div>

			<!-- Input -->
			<div style="padding: 0.75rem; border-top: 1px solid #f3f4f6; display: flex; gap: 0.5rem;">
				<input
					type="text"
					bind:value={input}
					on:keydown={handleKeydown}
					placeholder={$_('Nachricht eingeben')}
					maxlength="1000"
					disabled={loading}
					style="
					flex: 1;
					border: 1px solid #d1d5db;
					border-radius: 0.375rem;
					padding: 0.5rem 0.75rem;
					font-size: 0.875rem;
					outline: none;
					font-family: inherit;
				"
				/>
				<button
					on:click={send}
					disabled={loading || !input.trim()}
					aria-label={$_('Senden')}
					style="
					background: #111827;
					color: white;
					border: none;
					border-radius: 0.375rem;
					padding: 0.5rem 0.75rem;
					cursor: pointer;
					font-size: 0.875rem;
					opacity: {loading || !input.trim() ? '0.5' : '1'};
					transition: opacity 0.15s;
				"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M14 8L2 2L5 8L2 14L14 8Z" fill="currentColor" />
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Toggle button -->
	<button
		on:click={() => (isOpen = !isOpen)}
		aria-label={isOpen ? $_('Chat schliessen') : $_('Chat öffnen')}
		style="
			width: 3.25rem;
			height: 3.25rem;
			border-radius: 50%;
			background: #111827;
			color: white;
			border: none;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 4px 16px rgba(0,0,0,0.2);
			transition: transform 0.15s, box-shadow 0.15s;
		"
	>
		{#if isOpen}
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
				<path
					d="M4 4L16 16M16 4L4 16"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
				/>
			</svg>
		{:else}
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
				<path
					d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H7l-4 3V5z"
					stroke="currentColor"
					stroke-width="1.75"
					stroke-linejoin="round"
				/>
			</svg>
		{/if}
	</button>
</div>
