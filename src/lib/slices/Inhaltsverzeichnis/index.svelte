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

	interface TocEntry {
		id: string;
		text: string;
		level: 2 | 3;
	}

	let tocEntries: TocEntry[] = [];
	let activeId = '';

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
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.find((e) => e.isIntersecting);
				if (visible?.target.id) activeId = visible.target.id;
			},
			{ rootMargin: '-10% 0px -60% 0px' }
		);
		headings.filter((el) => el.id).forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	});
</script>

<Bounded
	as="nav"
	yPadding="sm"
	class="toc-slice"
	style="--page-color: {textColor}; --page-bg-color: {bgColor}; background-color: {bgColor}; color: {textColor}; font-family: var(--page-font);"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	aria-label={tocTitle}
>
	{#if tocEntries.length > 0}
		<!-- Desktop: sticky Sidebar-Leiste (horizontal bei schmalen Seiten) -->
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

		<!-- Mobile: aufklappbares Akkordeon -->
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
</style>
