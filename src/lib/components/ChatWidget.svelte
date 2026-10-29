<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { _ } from '$lib/stores/i18n';
	import { consentServices } from '$lib/consent/services';
	import { allowCategory, isServiceAllowed, registerServiceUsage } from '$lib/stores/consent';

	/** Empty = translated default */
	export let botName = '';
	export let greeting = '';
	/** Page language → knowledge base of this language */
	export let lang = '';

	const SERVICE_ID = 'ai_chat';

	// `errorKey` messages are shown but never sent back to the model
	type Message = { role: 'user' | 'bot'; text?: string; errorKey?: string };

	let isOpen = false;
	let input = '';
	let loading = false;
	let messages: Message[] = [];
	// Random id per chat window: groups the questions in the admin chat log (no personal data)
	const conversationId = crypto.randomUUID();
	let messagesEl: HTMLElement;

	$: displayName = botName || $_('Assistent');
	$: chatAllowed = $isServiceAllowed(SERVICE_ID);

	// Opt-out consent: the chat sends messages to Anthropic → banner/settings must list it
	onMount(() => registerServiceUsage(SERVICE_ID));

	const errorKeys: Record<string, string> = {
		rate_limit: 'Zu viele Nachrichten. Bitte versuchen Sie es in einigen Minuten erneut.',
		invalid: 'Die Nachricht ist leer oder zu lang (max. 1000 Zeichen).',
		unavailable: 'Der Chat ist zurzeit nicht verfügbar.',
		failed: 'Der Chat konnte nicht antworten. Bitte versuchen Sie es erneut.'
	};

	/** Conversation for the API: greeting and error messages excluded */
	function history() {
		return messages
			.filter((m, i) => m.text && !m.errorKey && !(i === 0 && m.role === 'bot'))
			.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
	}

	async function send() {
		const text = input.trim();
		if (!text || loading || !chatAllowed) return;

		input = '';
		messages = [...messages, { role: 'user', text }];
		loading = true;
		tick().then(scrollToBottom);

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					messages: history(),
					lang,
					conversationId,
					page: location.pathname
				})
			});
			const data = await res.json().catch(() => ({}));
			messages = data.reply
				? [...messages, { role: 'bot', text: data.reply }]
				: [...messages, { role: 'bot', errorKey: errorKeys[data.error] ?? errorKeys.failed }];
		} catch {
			messages = [...messages, { role: 'bot', errorKey: 'Verbindungsfehler.' }];
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

	$: if (isOpen && messages.length === 0) {
		messages = [{ role: 'bot', text: greeting || $_('Hallo! Wie kann ich helfen?') }];
	}
</script>

<div class="chat-root">
	{#if isOpen}
		<div class="chat-panel">
			<!-- Header -->
			<div class="chat-header">
				<span class="text-[0.9375rem] font-semibold">{displayName}</span>
				<button
					on:click={() => (isOpen = false)}
					aria-label={$_('Chat schliessen')}
					class="chat-icon-btn"
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
			<div bind:this={messagesEl} class="chat-messages">
				{#each messages as msg}
					<div class="flex" class:justify-end={msg.role === 'user'}>
						<div class="chat-bubble {msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}">
							{msg.errorKey ? $_(msg.errorKey) : msg.text}
						</div>
					</div>
				{/each}

				{#if loading}
					<div class="flex">
						<div class="chat-bubble chat-bubble-bot text-gray-600">{$_('Tippt')}</div>
					</div>
				{/if}
			</div>

			{#if !chatAllowed}
				<!-- Visitor rejected the category of this service in the cookie settings -->
				<div class="chat-footer flex flex-col gap-2 text-[0.8125rem] text-gray-700">
					<p class="m-0">
						{$_('Sie haben den KI-Chat in den Cookie-Einstellungen abgelehnt.')}
					</p>
					<button
						type="button"
						on:click={() => allowCategory(consentServices[SERVICE_ID].category)}
						class="chat-btn self-start py-1.5 text-[0.8125rem]"
					>
						{$_('Chat erlauben')}
					</button>
				</div>
			{/if}

			<!-- Input -->
			<div class="chat-footer gap-2" class:flex={chatAllowed} class:hidden={!chatAllowed}>
				<input
					type="text"
					bind:value={input}
					on:keydown={handleKeydown}
					placeholder={$_('Nachricht eingeben')}
					maxlength="1000"
					disabled={loading}
					class="chat-input"
				/>
				<button
					on:click={send}
					disabled={loading || !input.trim()}
					aria-label={$_('Senden')}
					class="chat-btn"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M14 8L2 2L5 8L2 14L14 8Z" fill="currentColor" />
					</svg>
				</button>
			</div>
			{#if chatAllowed}
				<p class="chat-note">
					{$_('Ihre Nachrichten werden zur Beantwortung an Anthropic übertragen.')}
				</p>
			{/if}
		</div>
	{/if}

	<!-- Toggle button -->
	<button
		on:click={() => (isOpen = !isOpen)}
		aria-label={isOpen ? $_('Chat schliessen') : $_('Chat öffnen')}
		class="chat-toggle"
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
