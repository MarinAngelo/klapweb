<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { planFilter } from '$lib/stores/planFilter';
	import { headerHeight } from '$lib/stores/headerHeight';
	import Bounded from '$lib/components/Bounded.svelte';
	import SvgIcons from '$lib/components/SvgIcons.svelte';
	import { hexLuminance, shadeColor } from '$lib/utils/color';

	export let slice: any;
	export let slices: any[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	$: bgColor = slice.primary.bg_color || $theme.pageBgColor;
	$: textColor = slice.primary.color || $theme.pageColor;
	$: linkColor = slice.primary.link_color || 'var(--page-link-color)';
	$: linkHoverColor = slice.primary.link_hover_color || 'var(--page-link-hover-color)';
	$: tocTitle = slice.primary.title || 'Inhalt';
	$: tiefe = slice.primary.tiefe || 'H2 und H3';
	$: linksMode = (slice.primary.ausrichtung || 'Oben') === 'Links';
	$: mobileBg = bgColor;
	$: mobileActiveColor = textColor;
	$: mobileDimColor = shadeColor(mobileBg, hexLuminance(mobileBg) > 0.5 ? -110 : 110);

	type TocEntry = { id: string; text: string; level: 2 | 3 };
	let tocEntries: TocEntry[] = [];
	let activeId = '';
	let dismissed = false;
	let dismissedAtY = 0;
	let mobileOpen = false;
	let openDropdowns = new Set<string>();
	let mobileSheetEl: HTMLElement | null = null;
	let sectionEl: HTMLElement | null = null;
	let mobileNaturalTop = 0;
	let mobileSheetHeight = 0;
	let mobilePinned = false;
	let sidebarHeight = 0;
	let headerScrolledAway = false;

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
			const ref = sectionEl ?? mobileSheetEl;
			if (!ref) return;
			const wasPinned = mobilePinned;
			if (wasPinned) mobilePinned = false;
			mobileNaturalTop = ref.getBoundingClientRect().top + window.scrollY;
			mobileSheetHeight = mobileSheetEl?.getBoundingClientRect().height ?? 0;
			if (wasPinned) mobilePinned = true;
		};
		const onScroll = () => {
			if (dismissed && Math.abs(window.scrollY - dismissedAtY) > 80) dismissed = false;
			mobilePinned = window.scrollY >= mobileNaturalTop;
			headerScrolledAway =
				!document.querySelector('main.header-is-sticky') && window.scrollY >= $headerHeight;
			updateSidebarHeight();
		};
		const updateSidebarHeight = () => {
			if (!linksMode) return;
			const footer = document.querySelector<HTMLElement>('footer');
			if (!footer) return;
			const sidebar = document.querySelector<HTMLElement>('.toc-sidebar');
			const sidebarTop = sidebar?.getBoundingClientRect().top ?? $headerHeight;
			sidebarHeight = Math.max(0, footer.getBoundingClientRect().top - sidebarTop);
		};
		window.addEventListener('hashchange', onHashChange);
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', measureMobileSheet);
		window.addEventListener('resize', updateSidebarHeight);
		tick().then(() => {
			measureMobileSheet();
			onScroll();
			updateSidebarHeight();
		});
		if (linksMode) {
			document.documentElement.style.setProperty('--toc-sidebar-offset', '14rem');
		}
		return () => {
			window.removeEventListener('hashchange', onHashChange);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', measureMobileSheet);
			window.removeEventListener('resize', updateSidebarHeight);
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
	bind:elementRef={sectionEl}
>
	{#if tocEntries.length > 0}
		{#if linksMode}
			<nav
				class="toc-sidebar hidden md:block"
				class:has-footer-height={sidebarHeight > 0}
				class:header-scrolled-away={headerScrolledAway}
				style="--toc-color: {textColor}; --toc-bg: {bgColor ||
					$theme.pageBgColor}; --toc-link-color: {linkColor}; --toc-link-hover-color: {linkHoverColor}; --toc-sidebar-height: {sidebarHeight}px;"
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
			<div
				class="hidden md:block"
				style="--toc-link-color: {linkColor}; --toc-link-hover-color: {linkHoverColor};"
			>
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

		{#if mobilePinned}
			<div
				class="md:hidden"
				style="height: {mobileSheetHeight}px; background-color: {mobileBg}; color: {mobileActiveColor};"
			></div>
		{/if}

		<div
			class="md:hidden toc-mobile-sheet links-mobile"
			class:open={mobileOpen}
			class:pinned={mobilePinned}
			bind:this={mobileSheetEl}
			style="--toc-color: {mobileActiveColor}; --toc-bg: {mobileBg}; --toc-dim: {mobileDimColor}; --toc-mobile-top: {$headerHeight}px; --toc-link-color: {linkColor}; --toc-link-hover-color: {linkHoverColor}; --page-color: {mobileActiveColor}; --page-bg-color: {mobileBg}; color: {mobileActiveColor}; background-color: {mobileBg};"
		>
			<button
				class="toc-mobile-bar w-full flex items-center justify-between px-4 py-3 text-sm"
				on:click={() => (mobileOpen = !mobileOpen)}
				aria-expanded={mobileOpen}
				><span class="text-base font-medium">{tocTitle}</span><span
					><SvgIcons name={mobileOpen ? 'down-square' : 'up-square'} size="1.1em" /></span
				></button
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
		color: var(--toc-link-color, inherit) !important;
		text-decoration: none !important;
		font-weight: 500;
	}
	.toc-link:hover {
		color: var(--toc-link-hover-color, var(--toc-link-color, inherit)) !important;
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
		top: var(--header-height, 80px);
		width: 13rem;
		height: calc(100vh - var(--header-height, 80px));
		overflow-y: auto;
		padding: 1.75rem 1rem 1rem;
		border-radius: 0;
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
	.toc-sidebar {
		position: fixed;
		top: var(--header-height, 80px);
		width: 13rem;
		height: calc(100vh - var(--header-height, 80px));
		overflow-y: auto;
		padding: 1.75rem 1rem 1rem;
		border-radius: 0;
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
	.toc-sidebar.has-footer-height {
		height: var(--toc-sidebar-height);
	}
	.toc-sidebar.header-scrolled-away {
		top: 0;
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
	/* Links-Modus: Inhalt ist immer position:fixed (Sidebar/mobiler Balken) → Sektion selbst bleibt ohne Hintergrund */
	:global(.toc-links-mode) {
		background-color: transparent !important;
	}
	@media (max-width: 767px) {
		/* Mobile: "Oben"-Balken verhält sich identisch wie "Links" (in-flow → pinned) → Sektion ohne eigenen Hintergrund */
		:global(.toc-slice:not(.toc-links-mode)) {
			background-color: transparent !important;
		}
	}
	@media (min-width: 768px) {
		/* Links-Modus: Desktop-Sidebar ist immer position:fixed (out-of-flow) → Sektion darf kein Padding reservieren */
		:global(.toc-links-mode) {
			padding-top: 0 !important;
			padding-bottom: 0 !important;
		}
	}
</style>
