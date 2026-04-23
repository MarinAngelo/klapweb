<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { planFilter } from '$lib/stores/planFilter';
	import Bounded from '$lib/components/Bounded.svelte';
	import { hexLuminance, shadeColor } from '$lib/utils/color';

	export let slice: any;
	export let slices: unknown[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	$: bgColor = slice.primary.bg_color || $theme.pageBgColor;
	$: textColor = slice.primary.color || $theme.pageColor;
	$: tocTitle = slice.primary.title || 'Inhalt';
	$: tiefe = slice.primary.tiefe || 'H2 und H3';
	$: linksMode = (slice.primary.ausrichtung || 'Oben') === 'Links';

	// Mobile Bottom-Sheet Farben (Header-Palette)
	$: mobileBg = $theme.headerBgColor || bgColor || $theme.pageBgColor;
	$: mobileActiveColor = $theme.headerColor || textColor;
	// Nicht-aktive Einträge: ausreichend Kontrast gegen mobileBg, aber sichtbar gedämpft
	$: mobileDimColor = mobileBg
		? shadeColor(mobileBg, hexLuminance(mobileBg) > 0.5 ? -110 : 110)
		: mobileActiveColor;

	interface TocGroup {
		h2: TocEntry;
		h3s: TocEntry[];
	}

	// Flache Liste → Gruppen: jede H2 mit ihren nachfolgenden H3s
	$: tocGroups = tocEntries.reduce<TocGroup[]>((groups, entry) => {
		if (entry.level === 2) {
			groups.push({ h2: entry, h3s: [] });
		} else if (groups.length > 0) {
			groups[groups.length - 1].h3s.push(entry);
		}
		return groups;
	}, []);

	interface TocEntry {
		id: string;
		text: string;
		level: 2 | 3;
	}

	let tocEntries: TocEntry[] = [];
	let activeId = '';
	let sidebarVisible = false;
	let dismissed = false;
	let dismissedAtY = 0;
	let mobileOpen = false;
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

	function scanHeadings() {
		if (typeof document === 'undefined') return;
		const selector = tiefe === 'Nur H2' ? 'main h2' : 'main h2, main h3';
		const headings = Array.from(document.querySelectorAll<HTMLElement>(selector));
		headings.forEach((el) => {
			if (!el.id) {
				const id = toSlug(el.textContent ?? '');
				if (id) el.id = id;
			}
		});
		tocEntries = headings
			.filter((el) => el.id)
			.map((el) => ({
				id: el.id,
				text: el.textContent ?? '',
				level: el.tagName === 'H2' ? 2 : 3
			}));
	}

	// Re-scan after filter changes (tick ensures {#if} has updated the DOM first)
	$: if (typeof $planFilter !== 'undefined') tick().then(scanHeadings);

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
				([entry]) => {
					const wasVisible = sidebarVisible;
					sidebarVisible = !entry.isIntersecting;
					// Zurück zum Seitenanfang → dismissed zurücksetzen
					if (!sidebarVisible) dismissed = false;
				},
				{ threshold: 0 }
			);
			anchorObserver.observe(anchorEl);
		}

		// Beim Scrollen dismissed zurücksetzen (Sidebar wieder einblenden)
		const onScroll = () => {
			if (dismissed && Math.abs(window.scrollY - dismissedAtY) > 80) {
				dismissed = false;
			}
		};
		window.addEventListener('scroll', onScroll, { passive: true });

		return () => {
			headingObserver.disconnect();
			anchorObserver?.disconnect();
			window.removeEventListener('scroll', onScroll);
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
				class:visible={sidebarVisible && !dismissed}
			>
				<div class="flex items-center justify-between mb-4">
					<p class="text-xs font-semibold uppercase tracking-widest" style="opacity: 0.5;">
						{tocTitle}
					</p>
					<button
						on:click={() => {
							dismissed = true;
							dismissedAtY = window.scrollY;
						}}
						aria-label="Inhaltsverzeichnis schliessen"
						class="toc-close-btn"
						style="opacity: 0.4;">×</button
					>
				</div>
				<ul class="space-y-2 text-sm">
					{#each tocEntries as entry}
						<li style="padding-left: {entry.level === 3 ? '0.75rem' : '0'};">
							<a
								href="#{entry.id}"
								class="toc-link block transition-all"
								style="opacity: {entry.id === activeId
									? '1'
									: entry.level === 3
										? '0.5'
										: '0.7'}; font-weight: {entry.id === activeId ? '600' : '400'};"
							>
								{entry.text}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		{:else}
			<!-- Oben-Modus: Gruppierte Spalten (Desktop) -->
			<div class="hidden md:block">
				{#if tocTitle}
					<p class="text-xs font-semibold uppercase tracking-widest mb-4" style="opacity: 0.5;">
						{tocTitle}
					</p>
				{/if}
				<ul class="flex flex-wrap gap-x-8 gap-y-4 text-sm items-start">
					{#each tocGroups as group}
						<li class="flex flex-col gap-1">
							<!-- H2 -->
							<a
								href="#{group.h2.id}"
								class="toc-link transition-all"
								style="opacity: {group.h2.id === activeId ? '1' : '0.8'}; font-weight: {group.h2
									.id === activeId
									? '700'
									: '500'}; border-bottom: {group.h2.id === activeId
									? '2px solid currentColor'
									: '2px solid transparent'};"
							>
								{group.h2.text}
							</a>
							<!-- H3-Unterpunkte -->
							{#if group.h3s.length > 0}
								<ul
									class="flex flex-col gap-0.5 pl-3 border-l"
									style="border-color: currentColor; opacity: 0.4;"
								>
									{#each group.h3s as sub}
										<li style="opacity: {sub.id === activeId ? '1' : '0.85'};">
											<a
												href="#{sub.id}"
												class="toc-link transition-all block"
												style="font-weight: {sub.id === activeId ? '600' : '400'};"
											>
												{sub.text}
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Mobile: Sticky Bottom-Sheet -->
		<div
			class="md:hidden toc-mobile-sheet"
			class:open={mobileOpen}
			style="--toc-color: {mobileActiveColor}; --toc-bg: {mobileBg}; --toc-dim: {mobileDimColor}; color: {mobileActiveColor}; background-color: {mobileBg};"
		>
			<!-- Leiste (immer sichtbar wenn der Slice aus dem Viewport gescrollt ist) -->
			<button
				class="toc-mobile-bar w-full flex items-center justify-between px-4 py-3 text-sm"
				on:click={() => (mobileOpen = !mobileOpen)}
				aria-expanded={mobileOpen}
			>
				<span class="flex items-center gap-2 min-w-0">
					<span
						style="color: {mobileDimColor}; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; flex-shrink: 0;"
						>{tocTitle}</span
					>
					{#if activeId}
						<span class="truncate font-medium">
							{tocEntries.find((e) => e.id === activeId)?.text ?? ''}
						</span>
					{/if}
				</span>
				<span class="flex-shrink-0 ml-3" style="color: {mobileDimColor};"
					>{mobileOpen ? '↓' : '↑'}</span
				>
			</button>
			<!-- Ausgeklappte Liste -->
			{#if mobileOpen}
				<div class="toc-mobile-list px-4 pb-4 pt-1">
					<ul class="space-y-3 text-sm">
						{#each tocGroups as group}
							<li>
								<a
									href="#{group.h2.id}"
									on:click={() => (mobileOpen = false)}
									class="block font-medium"
									style="color: {group.h2.id === activeId
										? mobileActiveColor
										: mobileDimColor}; font-weight: {group.h2.id === activeId ? '600' : '500'};"
									>{group.h2.text}</a
								>
								{#if group.h3s.length > 0}
									<ul
										class="mt-1.5 space-y-1.5 pl-3 border-l"
										style="border-color: {mobileDimColor};"
									>
										{#each group.h3s as sub}
											<li>
												<a
													href="#{sub.id}"
													on:click={() => (mobileOpen = false)}
													style="color: {sub.id === activeId
														? mobileActiveColor
														: mobileDimColor}; font-weight: {sub.id === activeId ? '600' : '400'};"
													>{sub.text}</a
												>
											</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}
</Bounded>

<style>
	/* Mobile: Sticky Bottom-Sheet */
	.toc-mobile-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: var(--toc-bg);
		color: var(--toc-color);
		box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
		z-index: 40;
		font-family: var(--page-font);
	}
	.toc-mobile-bar {
		background: none;
		border: none;
		cursor: pointer;
		color: inherit;
		text-align: left;
	}
	.toc-mobile-list {
		max-height: 50vh;
		overflow-y: auto;
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
		transition:
			opacity 0.25s ease,
			transform 0.25s ease;
		z-index: 40;
	}
	.toc-sidebar.visible {
		opacity: 1;
		pointer-events: auto;
		transform: translateX(0);
	}

	.toc-close-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
		color: inherit;
		padding: 0 0.15rem;
		flex-shrink: 0;
	}
	.toc-close-btn:hover {
		opacity: 1 !important;
	}

	/* Links-Modus: Bounded-Block selbst ist unsichtbar wenn Sidebar aktiv */
	:global(.toc-links-mode) {
		min-height: 0;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
	}
</style>
