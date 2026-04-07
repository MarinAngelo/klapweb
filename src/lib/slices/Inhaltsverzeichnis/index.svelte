<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import Bounded from '$lib/components/Bounded.svelte';

	export let slice: any;
	export let slices: unknown[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	$: bgColor = slice.primary.bg_color || $theme.pageBgColor;
	$: textColor = slice.primary.color || $theme.pageColor;
	$: tocTitle = slice.primary.title || 'Inhalt';
	$: tiefe = slice.primary.tiefe || 'H2 und H3';
	$: linksMode = (slice.primary.ausrichtung || 'Oben') === 'Links';

	interface TocEntry {
		id: string;
		text: string;
		level: 2 | 3;
	}

	let tocEntries: TocEntry[] = [];
	let activeId = '';
	let sidebarVisible = false;
	let anchorEl: HTMLElement;

	const toSlug = (s: string) =>
		s
			.toLowerCase()
			.replace(/ä/g, 'ae')
			.replace(/ö/g, 'oe')
			.replace(/ü/g, 'ue')
			.replace(/ß/g, 'ss')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');

	onMount(() => {
		const selector = tiefe === 'Nur H2' ? 'main h2' : 'main h2, main h3';
		const headings = Array.from(document.querySelectorAll<HTMLElement>(selector));

		// IDs setzen (falls noch keine vorhanden)
		headings.forEach((el) => {
			if (!el.id) {
				const id = toSlug(el.textContent ?? '');
				if (id) el.id = id;
			}
		});

		// TOC-Einträge aufbauen
		tocEntries = headings
			.filter((el) => el.id)
			.map((el) => ({
				id: el.id,
				text: el.textContent ?? '',
				level: el.tagName === 'H2' ? 2 : 3
			}));

		// Aktiven Abschnitt per IntersectionObserver verfolgen
		const headingObserver = new IntersectionObserver(
			(entries) => {
				const visible = entries.find((e) => e.isIntersecting);
				if (visible?.target.id) activeId = visible.target.id;
			},
			{ rootMargin: '-10% 0px -60% 0px' }
		);
		headings.filter((el) => el.id).forEach((el) => headingObserver.observe(el));

		// Sidebar-Modus: Sichtbarkeit anhand des Anker-Elements steuern
		let anchorObserver: IntersectionObserver | null = null;
		if (linksMode && anchorEl) {
			anchorObserver = new IntersectionObserver(
				([entry]) => { sidebarVisible = !entry.isIntersecting; },
				{ threshold: 0 }
			);
			anchorObserver.observe(anchorEl);
		}

		return () => {
			headingObserver.disconnect();
			anchorObserver?.disconnect();
		};
	});
</script>

<!-- Anker-Element: zeigt wo der Slice im DOM ist (für Sidebar-Sichtbarkeit) -->
<div bind:this={anchorEl} aria-hidden="true"></div>

<Bounded
	as="nav"
	yPadding="sm"
	class="toc-slice {linksMode ? 'toc-links-mode' : ''}"
	style="--page-color: {textColor}; --page-bg-color: {bgColor}; background-color: {bgColor}; color: {textColor}; font-family: var(--page-font);"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	aria-label={tocTitle}
>
	{#if tocEntries.length > 0}
		{#if linksMode}
			<!-- Links-Modus: Fixed Sidebar (Desktop) -->
			<nav
				class="toc-sidebar hidden md:block"
				style="--toc-color: {textColor}; --toc-bg: {bgColor || $theme.pageBgColor};"
				aria-label={tocTitle}
				class:visible={sidebarVisible}
			>
				<p class="text-xs font-semibold uppercase tracking-widest mb-4" style="opacity: 0.5;">
					{tocTitle}
				</p>
				<ul class="space-y-2 text-sm">
					{#each tocEntries as entry}
						<li style="padding-left: {entry.level === 3 ? '0.75rem' : '0'};">
							<a
								href="#{entry.id}"
								class="toc-link block transition-all"
								style="opacity: {entry.id === activeId ? '1' : entry.level === 3 ? '0.5' : '0.7'}; font-weight: {entry.id === activeId ? '600' : '400'};"
							>
								{entry.text}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		{:else}
			<!-- Oben-Modus: horizontale Leiste (Desktop) -->
			<div class="hidden md:block">
				<p class="text-xs font-semibold uppercase tracking-widest mb-4" style="opacity: 0.5;">
					{tocTitle}
				</p>
				<ul class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
					{#each tocEntries as entry}
						<li style="padding-left: {entry.level === 3 ? '0.75rem' : '0'};">
							<a
								href="#{entry.id}"
								class="toc-link transition-all"
								style="opacity: {entry.id === activeId ? '1' : entry.level === 3 ? '0.5' : '0.7'}; font-weight: {entry.id === activeId ? '600' : '400'}; border-bottom: {entry.id === activeId ? '2px solid currentColor' : '2px solid transparent'};"
							>
								{entry.text}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Mobile: aufklappbares Akkordeon (beide Modi) -->
		<details class="md:hidden w-full">
			<summary
				class="cursor-pointer text-sm font-semibold flex items-center justify-between"
				style="list-style: none;"
			>
				<span>{tocTitle}</span>
				<span class="toc-arrow ml-2" style="opacity: 0.6;">↓</span>
			</summary>
			<ul class="mt-4 space-y-2 text-sm">
				{#each tocEntries as entry}
					<li style="padding-left: {entry.level === 3 ? '0.75rem' : '0'};">
						<a href="#{entry.id}" style="opacity: {entry.level === 3 ? '0.65' : '0.85'};">
							{entry.text}
						</a>
					</li>
				{/each}
			</ul>
		</details>
	{/if}
</Bounded>

<style>
	details[open] .toc-arrow {
		transform: rotate(180deg);
	}
	.toc-arrow {
		transition: transform 0.2s ease;
		display: inline-block;
	}

	/* Links-Modus: Fixed Sidebar */
	.toc-sidebar {
		position: fixed;
		left: 1.5rem;
		top: calc(var(--header-height, 80px) + 2rem);
		width: 13rem;
		max-height: calc(100vh - var(--header-height, 80px) - 4rem);
		overflow-y: auto;
		padding: 1rem;
		border-radius: 0.5rem;
		background-color: var(--toc-bg);
		color: var(--toc-color);
		box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
		opacity: 0;
		pointer-events: none;
		transform: translateX(-0.5rem);
		transition: opacity 0.25s ease, transform 0.25s ease;
		z-index: 40;
	}
	.toc-sidebar.visible {
		opacity: 1;
		pointer-events: auto;
		transform: translateX(0);
	}

	/* Links-Modus: Bounded-Block selbst ist unsichtbar wenn Sidebar aktiv */
	:global(.toc-links-mode) {
		min-height: 0;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
	}
</style>
