<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { planFilter } from '$lib/stores/planFilter';
	import { headerHeight } from '$lib/stores/headerHeight';
	import Bounded from '$lib/components/Bounded.svelte';
	import { hexLuminance, shadeColor } from '$lib/utils/color';

	export let slice: any;
	export let slices: any[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	$: bgColor = slice.primary.bg_color || $theme.pageBgColor;
	$: textColor = slice.primary.color || $theme.pageColor;
	$: tocTitle = slice.primary.title || 'Inhalt';
	$: tiefe = slice.primary.tiefe || 'H2 und H3';
	$: linksMode = (slice.primary.ausrichtung || 'Oben') === 'Links';
	$: mobileBg = linksMode ? bgColor : $theme.headerBgColor || bgColor || $theme.pageBgColor;
	$: mobileActiveColor = linksMode ? textColor : $theme.headerColor || textColor;
	$: mobileDimColor = shadeColor(mobileBg, hexLuminance(mobileBg) > 0.5 ? -110 : 110);

	type TocEntry = { id: string; text: string; level: 2 | 3 };
	let tocEntries: TocEntry[] = [];
	let activeId = '';
	let dismissed = false;
	let dismissedAtY = 0;
	let mobileOpen = false;
	let openDropdowns = new Set<string>();
	let mobileSheetEl: HTMLElement | null = null;
	let mobileNaturalTop = 0;
	let mobileSheetHeight = 0;
	let mobilePinned = false;

	$: tocGroups = tocEntries.reduce<{ h2: TocEntry; h3s: TocEntry[] }[]>((groups, entry) => {
		if (entry.level === 2) groups.push({ h2: entry, h3s: [] });
		else if (groups.length) groups[groups.length - 1].h3s.push(entry);
		return groups;
	}, []);

	const toSlug = (value: string) =>
		value
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
		headings.forEach((heading) => {
			if (!heading.id) heading.id = toSlug(heading.textContent ?? '');
		});
		tocEntries = headings
			.filter((heading) => heading.id)
			.map((heading) => ({
				id: heading.id,
				text: heading.textContent ?? '',
				level: heading.tagName === 'H2' ? 2 : 3
			}));
	}

	$: if (typeof $planFilter !== 'undefined') tick().then(scanHeadings);

	function setActiveFromHash() {
		const hashId = decodeURIComponent(window.location.hash.slice(1));
		activeId = tocEntries.some((entry) => entry.id === hashId) ? hashId : '';
	}

	function activate(id: string) {
		activeId = id;
	}

	onMount(() => {
		scanHeadings();
		const headings = Array.from(
			document.querySelectorAll<HTMLElement>(tiefe === 'Nur H2' ? 'main h2' : 'main h2, main h3')
		).filter((heading) => heading.id);
		setActiveFromHash();
		const onHashChange = () => setActiveFromHash();
		const measureMobileSheet = () => {
			if (!mobileSheetEl) return;
			const wasPinned = mobilePinned;
			if (wasPinned) mobileSheetEl.style.position = 'static';
			mobileNaturalTop = mobileSheetEl.getBoundingClientRect().top + window.scrollY;
			mobileSheetHeight = mobileSheetEl.getBoundingClientRect().height;
			if (wasPinned) mobileSheetEl.style.position = '';
		};
		const onScroll = () => {
			if (dismissed && Math.abs(window.scrollY - dismissedAtY) > 80) dismissed = false;
			if (linksMode) mobilePinned = window.scrollY >= mobileNaturalTop;
		};
		window.addEventListener('hashchange', onHashChange);
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', measureMobileSheet);
		if (linksMode) {
			document.documentElement.style.setProperty('--toc-sidebar-offset', '14rem');
			tick().then(measureMobileSheet);
		}
		return () => {
			window.removeEventListener('hashchange', onHashChange);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', measureMobileSheet);
			document.documentElement.style.removeProperty('--toc-sidebar-offset');
		};
	});
</script>

<Bounded
	as="nav"
	yPadding="base-top"
	class="toc-slice {linksMode ? 'toc-links-mode' : ''}"
	style="--page-color: {textColor}; --page-bg-color: {bgColor}; background-color: {bgColor}; color: {textColor}; font-family: var(--page-font);"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	aria-label={tocTitle}
>
	{#if tocEntries.length > 0}
		{#if linksMode}
			<nav
				class="toc-sidebar hidden md:block"
				style="--toc-color: {textColor}; --toc-bg: {bgColor || $theme.pageBgColor};"
				class:visible={!dismissed}
				aria-label={tocTitle}
			>
				<div class="flex items-center justify-between mb-4">
					<h5>{tocTitle}</h5>
					<button
						on:click={() => {
							dismissed = true;
							dismissedAtY = window.scrollY;
						}}
						aria-label="Inhaltsverzeichnis schliessen"
						class="toc-close-btn">×</button
					>
				</div>
				<ul class="space-y-2 text-sm">
					{#each tocEntries as entry}<li
							style="padding-left: {entry.level === 3 ? '0.75rem' : '0'};"
						>
							<a
								href="#{entry.id}"
								class="toc-link block"
								on:click={() => activate(entry.id)}
								class:toc-active={entry.id === activeId}>{entry.text}</a
							>
						</li>{/each}
				</ul>
			</nav>
		{:else}
			<div class="hidden md:block">
				<h5>{tocTitle}</h5>
				<ul class="toc-items flex flex-wrap gap-y-4 text-sm items-start">
					{#each tocGroups as group}<li class="flex flex-col gap-1">
							<a
								href="#{group.h2.id}"
								class="toc-link"
								on:click={() => activate(group.h2.id)}
								class:toc-active={group.h2.id === activeId}>{group.h2.text}</a
							>{#if group.h3s.length}<ul
									class="flex flex-col gap-0.5 pl-3 border-l"
									style="border-color: currentColor; opacity: 0.4;"
								>
									{#each group.h3s as sub}<li>
											<a
												href="#{sub.id}"
												class="toc-link block"
												on:click={() => activate(sub.id)}
												class:toc-active={sub.id === activeId}>{sub.text}</a
											>
										</li>{/each}
								</ul>{/if}
						</li>{/each}
				</ul>
			</div>
		{/if}

		{#if linksMode && mobilePinned}
			<div
				class="md:hidden"
				style="height: {mobileSheetHeight}px; background-color: {mobileBg}; color: {mobileActiveColor};"
			></div>
		{/if}

		<div
			class="md:hidden toc-mobile-sheet"
			class:open={mobileOpen}
			class:links-mobile={linksMode}
			class:pinned={linksMode && mobilePinned}
			bind:this={mobileSheetEl}
			style="--toc-color: {mobileActiveColor}; --toc-bg: {mobileBg}; --toc-dim: {mobileDimColor}; --toc-mobile-top: {$headerHeight}px; --page-color: {mobileActiveColor}; --page-bg-color: {mobileBg}; color: {mobileActiveColor}; background-color: {mobileBg};"
		>
			<button
				class="toc-mobile-bar w-full flex items-center justify-between px-4 py-3 text-sm"
				on:click={() => (mobileOpen = !mobileOpen)}
				aria-expanded={mobileOpen}
				><span
					>{tocTitle}{#if activeId}
						· {tocEntries.find((entry) => entry.id === activeId)?.text}{/if}</span
				><span>{mobileOpen ? '↓' : '↑'}</span></button
			>
			{#if mobileOpen}<div class="toc-mobile-list px-4 pb-4 pt-1">
					<ul class="space-y-3 text-sm">
						{#each tocGroups as group}<li>
								<a
									href="#{group.h2.id}"
									on:click={() => {
										mobileOpen = false;
										activate(group.h2.id);
									}}
									class="toc-link"
									class:toc-active={group.h2.id === activeId}>{group.h2.text}</a
								>{#if group.h3s.length}<ul class="mt-1.5 space-y-1.5 pl-3 border-l">
										{#each group.h3s as sub}<li>
												<a
													href="#{sub.id}"
													on:click={() => {
														mobileOpen = false;
														activate(sub.id);
													}}
													class="toc-link"
													class:toc-active={sub.id === activeId}>{sub.text}</a
												>
											</li>{/each}
									</ul>{/if}
							</li>{/each}
					</ul>
				</div>{/if}
		</div>
	{/if}
</Bounded>

<style>
	.toc-link {
		color: inherit !important;
		text-decoration: none !important;
		font-weight: 500;
	}
	.toc-link.toc-active {
		font-weight: 700;
		text-decoration: underline !important;
		text-underline-offset: 0.15em;
	}
	.toc-items > li:not(:last-child) > .toc-link::after {
		content: '|';
		display: inline-block;
		padding-inline: 0.75rem;
		opacity: 0.5;
		text-decoration: none !important;
	}
	.toc-mobile-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: var(--toc-bg);
		color: var(--toc-color);
		box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
		z-index: 40;
	}
	.toc-mobile-sheet.links-mobile {
		position: static;
		bottom: auto;
		box-shadow: none;
	}
	.toc-mobile-sheet.links-mobile.pinned {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
	:global(.header-is-sticky) .toc-mobile-sheet.links-mobile.pinned {
		top: var(--toc-mobile-top);
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
	.toc-sidebar {
		position: fixed;
		left: 0;
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
	}
	:global(.toc-links-mode) {
		min-height: 0;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
	}
	/* Mobile: Sektionshintergrund nur auf den inneren Balken anwenden, nicht auf die volle Breite */
	@media (max-width: 767px) {
		:global(.toc-links-mode) {
			background-color: transparent !important;
		}
	}
</style>
