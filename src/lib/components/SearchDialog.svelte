<script lang="ts">
	/**
	 * Search dialog with two scopes:
	 * - `page` (Schaltfläche variation «Suche»): searches the current page and jumps to the match
	 *   ($lib/utils/pageSearch), no index needed
	 * - `site` (reserved for a magnifier in the navigation): Pagefind index of all pages, built
	 *   after `vite build` (scripts/build-search-index.js), only the current language (<html lang>)
	 */
	import { onMount, tick } from 'svelte';
	import { _ } from '$lib/stores/i18n';
	import { revealHit, searchPage, type PageHit } from '$lib/utils/pageSearch';

	export let scope: 'page' | 'site' = 'page';
	export let placeholder = '';
	export let onClose: () => void;

	type SiteResult = { url: string; title: string; excerpt: string };
	type Pagefind = {
		options: (o: Record<string, unknown>) => Promise<void>;
		debouncedSearch: (
			q: string,
			o?: unknown,
			ms?: number
		) => Promise<{
			results: {
				data: () => Promise<{ url: string; meta: { title?: string }; excerpt: string }>;
			}[];
		} | null>;
	};

	const MAX_RESULTS = 10;
	let pagefind: Pagefind | null = null;

	let query = '';
	let pageHits: PageHit[] = [];
	let siteResults: SiteResult[] = [];
	let searching = false;
	let unavailable = false;
	let inputEl: HTMLInputElement;

	onMount(async () => {
		await tick();
		inputEl?.focus();
		if (scope !== 'site') return;
		try {
			// Path as variable: Vite must not try to bundle the file (it only exists after the build)
			const path = '/pagefind/pagefind.js';
			pagefind = (await import(/* @vite-ignore */ path)) as Pagefind;
			await pagefind.options({ excerptLength: 20 });
			// Input typed while the index was loading
			searchSite(query);
		} catch {
			unavailable = true;
		}
	});

	/** /ueber-mich.html → /ueber-mich (prerendered files; Netlify serves both) */
	const cleanUrl = (url: string) => url.replace(/\/index\.html$/, '/').replace(/\.html$/, '');

	async function searchSite(q: string) {
		if (!pagefind) return;
		if (!q.trim()) {
			siteResults = [];
			return;
		}
		searching = true;
		const response = await pagefind.debouncedSearch(q, {}, 250);
		// null = superseded by a newer input
		if (response === null) return;
		siteResults = await Promise.all(
			response.results.slice(0, MAX_RESULTS).map(async (r) => {
				const data = await r.data();
				return {
					url: cleanUrl(data.url),
					title: data.meta.title || cleanUrl(data.url),
					excerpt: data.excerpt
				};
			})
		);
		searching = false;
	}

	function searchCurrentPage(q: string) {
		const main = document.getElementById('main-content');
		pageHits = main ? searchPage(main, q) : [];
	}

	$: if (scope === 'site') searchSite(query);
	$: if (scope === 'page' && typeof document !== 'undefined') searchCurrentPage(query);
	$: resultCount = scope === 'page' ? pageHits.length : siteResults.length;
	$: label = scope === 'page' ? $_('Diese Seite durchsuchen') : $_('Website durchsuchen');

	function choose(hit: PageHit) {
		onClose();
		revealHit(hit.element);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
	class="modal-backdrop fixed inset-0 z-50 flex items-start justify-center backdrop-blur-sm px-4 pt-[10vh]"
	data-page-search-ignore
	on:click|self={onClose}
>
	<div
		class="modal-card flex max-h-[75vh] w-full max-w-xl flex-col rounded-lg shadow-lg"
		role="dialog"
		aria-modal="true"
		aria-label={label}
	>
		<div class="flex items-center gap-3 p-4">
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				aria-hidden="true"
				class="shrink-0"
			>
				<circle cx="11" cy="11" r="7" />
				<path d="M20 20l-3.5-3.5" />
			</svg>
			<input
				bind:this={inputEl}
				bind:value={query}
				type="search"
				placeholder={placeholder || $_('Suchen …')}
				aria-label={label}
				class="form-input w-full"
			/>
			<button
				type="button"
				class="shrink-0 cursor-pointer border-0 bg-transparent p-1 text-inherit"
				aria-label={$_('Schliessen')}
				on:click={onClose}
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<path
						d="M2 2L14 14M14 2L2 14"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		</div>

		<div class="search-results overflow-y-auto px-4 pb-4" aria-live="polite">
			{#if unavailable}
				<p class="text-muted m-0">
					{$_('Die Suche ist erst auf der veröffentlichten Website verfügbar.')}
				</p>
			{:else if query.trim() && !searching && resultCount === 0}
				<p class="text-muted m-0">
					{$_('Keine Treffer für «{suche}».').replace('{suche}', query.trim())}
				</p>
			{:else if scope === 'page'}
				<ul class="m-0 flex list-none flex-col gap-1 p-0">
					{#each pageHits as hit}
						<li>
							<button
								type="button"
								class="search-result w-full cursor-pointer border-0 bg-transparent text-left"
								on:click={() => choose(hit)}
							>
								<span class="font-semibold">{hit.title}</span>
								<!-- Excerpt built by pageSearch: page text escaped, only <mark> added -->
								<span class="text-muted text-sm">{@html hit.excerpt}</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<ul class="m-0 flex list-none flex-col gap-1 p-0">
					{#each siteResults as result (result.url)}
						<li>
							<a href={result.url} class="search-result" on:click={onClose}>
								<span class="font-semibold">{result.title}</span>
								<!-- Excerpt from our own index: text escaped by Pagefind, only <mark> added -->
								<span class="text-muted text-sm">{@html result.excerpt}</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
