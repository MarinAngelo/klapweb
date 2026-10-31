<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { _ } from '$lib/stores/i18n';
	import { linkify } from '$lib/utils/linkify';
	import { consentServices } from '$lib/consent/services';
	import { allowCategory, isServiceAllowed, registerServiceUsage } from '$lib/stores/consent';

	/** Empty = translated default */
	export let botName = '';
	export let greeting = '';
	/** Page language → knowledge base of this language */
	export let lang = '';

	const SERVICE_ID = 'ai_chat';

	// `errorKey` messages are shown but never sent back to the model
	type Message = {
		role: 'user' | 'bot';
		text?: string;
		errorKey?: string;
		/** Chat log entry of a bot answer → can be rated */
		entryId?: string;
		rating?: 'up' | 'down';
		/** Rating finished (👍, or 👎 with/without comment) */
		rated?: boolean;
		comment?: string;
		/** 👎 feedback form: mailed to the site owner («Verantwortliche E-Mail») */
		name?: string;
		email?: string;
		replyPromised?: boolean;
	};

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
					// Only the new question: the server takes the history from its own chat log
					messages: [{ role: 'user', content: text }],
					lang,
					conversationId,
					page: location.pathname
				})
			});
			const data = await res.json().catch(() => ({}));
			messages = data.reply
				? [...messages, { role: 'bot', text: data.reply, entryId: data.entryId ?? undefined }]
				: [...messages, { role: 'bot', errorKey: errorKeys[data.error] ?? errorKeys.failed }];
		} catch {
			messages = [...messages, { role: 'bot', errorKey: 'Verbindungsfehler.' }];
		} finally {
			loading = false;
			tick().then(scrollToBottom);
		}
	}

	/**
	 * 👍 → done; 👎 → feedback form first (name, e-mail, comment — all optional).
	 * skip = rate without sending the form.
	 */
	async function rate(index: number, rating: 'up' | 'down', done: boolean, skip = false) {
		const msg = messages[index];
		if (!msg?.entryId) return;
		// 👎 form sent with an e-mail address → the owner will reply (extra thank-you line)
		const replyPromised = rating === 'down' && !skip && !!msg.email?.trim();
		messages[index] = { ...msg, rating, rated: done, replyPromised };
		if (!done) return tick().then(scrollToBottom);
		const form = skip ? {} : { comment: msg.comment, name: msg.name, email: msg.email };
		await fetch('/api/chat/rating', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ entryId: msg.entryId, conversationId, rating, ...form })
		}).catch(() => {});
	}

	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const invalidEmail = (msg: Message) => !!msg.email?.trim() && !EMAIL_RE.test(msg.email.trim());

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
				{#each messages as msg, i}
					<div class="flex" class:justify-end={msg.role === 'user'}>
						<!-- Bot answers: e-mail and web addresses become links. One line: the bubble keeps whitespace (pre-wrap) -->
						<!-- prettier-ignore -->
						<div class="chat-bubble {msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}">{#if msg.errorKey}{$_(msg.errorKey)}{:else if msg.role === 'bot'}{#each linkify(msg.text ?? '', location.hostname) as part}{#if part.href}<a href={part.href} target={part.external ? '_blank' : undefined} rel={part.external ? 'noopener noreferrer' : undefined} class="chat-link">{part.text}</a>{:else}{part.text}{/if}{/each}{:else}{msg.text}{/if}</div>
					</div>
					{#if msg.entryId}
						<!-- Rating of this answer (stored with the question in the admin chat log) -->
						{#if msg.rated}
							<p class="chat-rating">{$_('Danke für Ihre Bewertung!')}</p>
							{#if msg.replyPromised}
								<p class="chat-rating">
									{$_('Vielen Dank für das Feedback, ich melde mich so bald wie möglich bei dir.')}
								</p>
							{/if}
						{:else if msg.rating === 'down'}
							<div class="chat-rating-form">
								<p class="m-0 text-xs text-gray-700">
									{$_(
										'Schade! Schreiben Sie uns, was gefehlt hat – mit E-Mail melden wir uns bei Ihnen.'
									)}
								</p>
								<input
									type="text"
									bind:value={messages[i].name}
									placeholder={$_('Name (optional)')}
									maxlength="100"
									autocomplete="name"
									class="chat-input"
								/>
								<input
									type="email"
									bind:value={messages[i].email}
									placeholder={$_('E-Mail (optional)')}
									maxlength="200"
									autocomplete="email"
									class="chat-input"
									class:border-red-600={invalidEmail(msg)}
								/>
								<textarea
									bind:value={messages[i].comment}
									placeholder={$_('Was hat gefehlt? (optional)')}
									maxlength="500"
									rows="2"
									class="chat-input"
								></textarea>
								<div class="flex justify-end gap-2">
									<button
										type="button"
										class="chat-rate-skip"
										on:click={() => rate(i, 'down', true, true)}>{$_('Überspringen')}</button
									>
									<button
										type="button"
										class="chat-btn py-1 text-xs"
										disabled={invalidEmail(msg)}
										on:click={() => rate(i, 'down', true)}>{$_('Senden')}</button
									>
								</div>
							</div>
						{:else}
							<div class="chat-rating">
								<span>{$_('War die Antwort hilfreich?')}</span>
								<button
									type="button"
									class="chat-rate-btn"
									aria-label={$_('Hilfreich')}
									title={$_('Hilfreich')}
									on:click={() => rate(i, 'up', true)}
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										><path
											d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
										/></svg
									>
								</button>
								<button
									type="button"
									class="chat-rate-btn"
									aria-label={$_('Nicht hilfreich')}
									title={$_('Nicht hilfreich')}
									on:click={() => rate(i, 'down', false)}
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="rotate-180"
										><path
											d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
										/></svg
									>
								</button>
							</div>
						{/if}
					{/if}
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
					{$_('Antworten der KI sind unverbindlich.')}
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
