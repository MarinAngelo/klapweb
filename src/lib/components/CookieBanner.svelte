<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { _ } from '$lib/stores/i18n';
	import Button from '$lib/components/Button.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import { consentCategories, consentServices, type ConsentCategory } from '$lib/consent/services';
	import {
		consent,
		usedServices,
		consentSettingsOpen,
		acceptAll,
		rejectAll,
		saveAllowedCategories
	} from '$lib/stores/consent';
	import { getLegalHref } from '$lib/utils/legalHref';

	export let lang: string | undefined;
	export let mainLang: string | undefined;

	// Banner/dialog only after hydration (stored choice is only known in the browser)
	let mounted = false;
	let dialogEl: HTMLElement | null = null;
	onMount(() => (mounted = true));

	$: privacyHref = getLegalHref(lang, mainLang, 'datenschutzerklaerung', 'privacy-policy');

	// Show banner only on pages that use a non-functional service, until the visitor decided
	$: showBanner = mounted && !$consent.decided && $usedServices.length > 0 && !$consentSettingsOpen;
	$: usedProviders = [...new Set($usedServices.map((id) => consentServices[id]?.label ?? id))].join(
		', '
	);

	const categoryOrder = Object.keys(consentCategories) as ConsentCategory[];
	// Categories with at least one registered service (unused categories are not offered)
	const availableCategories = categoryOrder.filter((category) =>
		Object.values(consentServices).some((service) => service.category === category)
	);

	// Functional: all (always in use). Others: only services actually used on this page,
	// so the dialog never lists providers the website does not use.
	$: servicesByCategory = Object.fromEntries(
		availableCategories.map((category) => [
			category,
			Object.entries(consentServices)
				.filter(
					([id, service]) =>
						service.category === category &&
						(category === 'functional' || $usedServices.includes(id))
				)
				.map(([id, service]) => ({ id, ...service, usedHere: $usedServices.includes(id) }))
		])
	);

	// Dialog state: checkbox per non-functional category, initialised on open
	let allowed: Record<string, boolean> = {};
	$: if ($consentSettingsOpen) initDialog();

	async function initDialog() {
		allowed = Object.fromEntries(
			availableCategories
				.filter((category) => category !== 'functional')
				.map((category) => [category, !$consent.denied.includes(category)])
		);
		await tick();
		dialogEl?.focus();
	}

	function saveDialog() {
		saveAllowedCategories(
			(Object.keys(allowed) as ConsentCategory[]).filter((category) => allowed[category])
		);
		consentSettingsOpen.set(false);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && $consentSettingsOpen) consentSettingsOpen.set(false);
	}
</script>

<svelte:window on:keydown={onKeydown} />

{#if showBanner}
	<div class="cookie-banner" role="region" aria-label={$_('Cookie-Hinweis')}>
		<p class="cookie-banner-title">{$_('Cookies & externe Inhalte')}</p>
		<p class="cookie-banner-text">
			{$_('Diese Seite lädt Inhalte von Drittanbietern')} ({usedProviders}). {$_(
				'Dabei können Cookies gesetzt und Daten wie Ihre IP-Adresse übertragen werden. Sie können dies jederzeit ablehnen.'
			)}
			<a href={privacyHref} class="cookie-banner-link">{$_('Datenschutz')}</a>
		</p>
		<div class="cookie-banner-actions">
			<Button
				text={$_('Ablehnen')}
				size="sm"
				mb={false}
				bgColor="transparent"
				color="var(--page-color)"
				hoverBgColor="var(--page-color)"
				hoverColor="var(--page-bg-color)"
				on:click={rejectAll}
			/>
			<Button
				text={$_('Einstellungen')}
				size="sm"
				mb={false}
				bgColor="transparent"
				color="var(--page-color)"
				hoverBgColor="var(--page-color)"
				hoverColor="var(--page-bg-color)"
				on:click={() => consentSettingsOpen.set(true)}
			/>
			<Button text={$_('Einverstanden')} size="sm" mb={false} on:click={acceptAll} />
		</div>
	</div>
{/if}

{#if mounted && $consentSettingsOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="cookie-backdrop" on:click={() => consentSettingsOpen.set(false)}>
		<div
			class="cookie-dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="cookie-dialog-title"
			tabindex="-1"
			bind:this={dialogEl}
			on:click|stopPropagation
		>
			<p id="cookie-dialog-title" class="cookie-dialog-title">{$_('Cookie-Einstellungen')}</p>
			<p class="cookie-dialog-intro">
				{$_(
					'Hier sehen Sie, welche Cookies und Dienste diese Website verwendet. Nicht-funktionale Dienste können Sie ablehnen.'
				)}
				<a href={privacyHref} class="cookie-banner-link">{$_('Datenschutz')}</a>
			</p>

			{#each availableCategories as category}
				<section class="cookie-category">
					<div class="cookie-category-head">
						{#if category === 'functional'}
							<Checkbox checked disabled id="consent-{category}" />
						{:else}
							<Checkbox bind:checked={allowed[category]} id="consent-{category}" />
						{/if}
						<label for="consent-{category}">
							<strong>{$_(consentCategories[category].label)}</strong>
							{#if category === 'functional'}
								<span class="cookie-badge">{$_('Immer aktiv')}</span>
							{/if}
						</label>
					</div>
					<p class="cookie-category-text">{$_(consentCategories[category].description)}</p>
					{#if servicesByCategory[category].length === 0}
						<p class="cookie-category-text cookie-none">
							{$_('Auf dieser Seite werden keine Dienste dieser Kategorie verwendet.')}
						</p>
					{/if}
					<ul class="cookie-services">
						{#each servicesByCategory[category] as service}
							<li>
								<strong>{$_(service.label)}</strong>
								{#if service.usedHere}
									<span class="cookie-badge">{$_('auf dieser Seite')}</span>
								{/if}
								<span class="cookie-service-meta">
									{$_(service.provider)} · {$_(service.purpose)}
									<br />{service.storage.map((entry) => $_(entry)).join(', ')}
									{#if service.privacyUrl}
										·
										<a
											href={service.privacyUrl}
											target="_blank"
											rel="noopener noreferrer"
											class="cookie-banner-link">{$_('Datenschutz des Anbieters')}</a
										>
									{/if}
								</span>
							</li>
						{/each}
					</ul>
				</section>
			{/each}

			<div class="cookie-banner-actions">
				<Button
					text={$_('Alle ablehnen')}
					size="sm"
					mb={false}
					bgColor="transparent"
					color="var(--page-color)"
					hoverBgColor="var(--page-color)"
					hoverColor="var(--page-bg-color)"
					on:click={() => {
						rejectAll();
						consentSettingsOpen.set(false);
					}}
				/>
				<Button text={$_('Auswahl speichern')} size="sm" mb={false} on:click={saveDialog} />
			</div>
		</div>
	</div>
{/if}

<style>
	.cookie-banner {
		position: fixed;
		left: 1rem;
		bottom: 1rem;
		z-index: 9500;
		width: min(28rem, calc(100vw - 2rem));
		padding: 1.25rem;
		border-radius: 1rem;
		background-color: var(--page-bg-color);
		color: var(--page-color);
		font-family: var(--page-font);
		box-shadow: 0 6px 30px rgb(0 0 0 / 22%);
	}

	.cookie-banner-title,
	.cookie-dialog-title {
		font-weight: 700;
		margin: 0 0 0.5rem;
	}

	.cookie-dialog-title {
		font-size: 1.25rem;
	}

	.cookie-banner-text,
	.cookie-dialog-intro {
		font-size: 0.9rem;
		margin: 0 0 1rem;
	}

	.cookie-banner-link {
		color: var(--page-link-color, inherit);
		text-decoration: underline;
	}

	.cookie-banner-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.cookie-backdrop {
		position: fixed;
		inset: 0;
		z-index: 10001;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: rgb(0 0 0 / 45%);
	}

	.cookie-dialog {
		width: min(36rem, 100%);
		max-height: calc(100dvh - 2rem);
		overflow-y: auto;
		padding: 1.5rem;
		border-radius: 1rem;
		background-color: var(--page-bg-color);
		color: var(--page-color);
		font-family: var(--page-font);
		box-shadow: 0 10px 40px rgb(0 0 0 / 25%);
		outline: none;
	}

	.cookie-category {
		padding: 0.75rem 0;
		border-top: 1px solid color-mix(in srgb, currentColor 15%, transparent);
	}

	.cookie-category-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.cookie-category-head label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.cookie-category-text {
		font-size: 0.85rem;
		margin: 0.4rem 0 0.5rem;
		opacity: 0.8;
	}

	.cookie-none {
		padding-left: 1.9rem;
		font-style: italic;
	}

	.cookie-services {
		list-style: none;
		margin: 0;
		padding: 0 0 0 1.9rem;
		font-size: 0.85rem;
	}

	.cookie-services li {
		margin: 0.4rem 0;
	}

	.cookie-service-meta {
		display: block;
		opacity: 0.75;
		font-size: 0.8rem;
	}

	.cookie-badge {
		display: inline-block;
		margin-left: 0.35rem;
		padding: 0.05rem 0.45rem;
		border-radius: 9999px;
		font-size: 0.7rem;
		font-weight: 500;
		background-color: color-mix(in srgb, currentColor 12%, transparent);
	}

	@media (max-width: 767px) {
		.cookie-banner {
			left: 0.5rem;
			right: 0.5rem;
			bottom: 0.5rem;
			width: auto;
		}

		.cookie-banner-actions {
			justify-content: stretch;
		}
	}
</style>
