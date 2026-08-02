<script lang="ts">
	import { isFilled, asLink } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';
	import OgBild from './OgBild.svelte';
	import { onMount } from 'svelte';

	export let slice: any;
	export let slices: any[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	const p: any = slice.primary;
	const allItems: any[] = (slice as any).items ?? [];

	$: anim = mapAnimationFromPrimary(p);
	$: layout = p.layout ?? 'Liste';
	$: spalten = p.spalten ?? '3';

	$: yPadding = (() => {
		const same = p.y_padding_same ?? false;
		switch (p.y_padding) {
			case 'kein Abstand': return 'none';
			case 'wenig': return same ? 'sm' : 'sm-top';
			case 'gross': return same ? 'lg' : 'lg-top';
			default: return same ? 'base' : 'base-top';
		}
	})() as 'none' | 'sm' | 'sm-top' | 'base' | 'base-top' | 'lg' | 'lg-top';

	$: gridCols =
		spalten === '2' ? 'repeat(auto-fill, minmax(min(100%, 26rem), 1fr))' :
		spalten === '4' ? 'repeat(auto-fill, minmax(min(100%, 16rem), 1fr))' :
		'repeat(auto-fill, minmax(min(100%, 20rem), 1fr))';

	type Group = { name: string; items: any[] };
	$: grouped = (() => {
		if (!p.group_by) return [{ name: '', items: allItems }] as Group[];
		const map = new Map<string, any[]>();
		for (const item of allItems) {
			const key = (item.gruppe as string) || '';
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(item);
		}
		return [...map.entries()].map(([name, items]) => ({ name, items })) as Group[];
	})();

	function href(item: any): string {
		return asLink(item.url) ?? '#';
	}

	function domain(item: any): string {
		const h = href(item);
		try { return new URL(h).hostname.replace(/^www\./, ''); } catch { return h; }
	}

	type OgData = { image: string | null; title: string | null };
	let ogData: Record<number, OgData> = {};

	onMount(() => {
		allItems.forEach((item, i) => {
			const h = href(item);
			if (!h || h === '#') return;
			fetch(`/api/og?url=${encodeURIComponent(h)}`)
				.then(r => r.json())
				.then((d: OgData) => { ogData = { ...ogData, [i]: d }; })
				.catch(() => {});
		});
	});

	function label(item: any, i: number): string {
		return item.titel || ogData[i]?.title || domain(item);
	}

	function isExternal(item: any): boolean {
		return item.url?.link_type === 'Web';
	}
</script>

<Bounded
	as="section"
	yPadding={yPadding}
	style="background-color: {p.bg_color || 'var(--page-bg-color)'}; color: {p.color || 'var(--page-color)'};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
	{#if isFilled.richText(p.heading)}
		<h2 class="mb-10">{p.heading[0]?.text ?? ''}</h2>
	{/if}

	{#each grouped as group}
		{#if group.name}
			<h3 class="mb-4 mt-10 first:mt-0 opacity-60 uppercase tracking-wider text-sm font-semibold">{group.name}</h3>
		{/if}

		{#if layout === 'Kacheln'}
			<!-- ── Kacheln ── -->
			<div class="grid gap-5" style="grid-template-columns: {gridCols};">
				{#each group.items as item}
					{@const gi = allItems.indexOf(item)}
					{@const h = href(item)}
					{@const ext = isExternal(item)}
					<a
						href={h}
						target={ext ? '_blank' : undefined}
						rel={ext ? 'noopener noreferrer' : undefined}
						class="group flex flex-col rounded-2xl overflow-hidden transition-shadow hover:shadow-xl no-underline"
						style="box-shadow: 0 2px 12px rgba(0,0,0,0.08); background: color-mix(in srgb, currentColor 5%, transparent);"
					>
						<div class="aspect-video w-full overflow-hidden bg-current/5 relative">
							{#if isFilled.image(item.bild)}
								<PrismicImage
									field={item.bild}
									class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
								/>
							{:else if h && h !== '#'}
								<OgBild src={ogData[gi]?.image ?? null} alt={label(item, gi)} hostname={domain(item)} done={gi in ogData} />
							{/if}
						</div>
						<div class="p-4 flex flex-col gap-1">
							<p class="font-semibold leading-tight">{item.titel || ogData[gi]?.title || domain(item)}</p>
							{#if item.beschreibung}
								<p class="leading-snug">{item.beschreibung}</p>
							{/if}
							<p class="text-xs opacity-35 mt-1">{domain(item)}</p>
						</div>
					</a>
				{/each}
			</div>

		{:else if layout === 'Kompakt'}
			<!-- ── Kompakt ── -->
			<ul class="flex flex-col divide-y" style="border-color: color-mix(in srgb, currentColor 10%, transparent);">
				{#each group.items as item}
					{@const gi = allItems.indexOf(item)}
					{@const h = href(item)}
					{@const ext = isExternal(item)}
					<li>
						<a
							href={h}
							target={ext ? '_blank' : undefined}
							rel={ext ? 'noopener noreferrer' : undefined}
							class="flex items-center gap-3 py-2.5 hover:opacity-70 transition-opacity no-underline"
						>
							<img
								src="https://www.google.com/s2/favicons?domain={domain(item)}&sz=32"
								alt=""
								class="w-4 h-4 flex-shrink-0 opacity-70"
							/>
							<span class="font-semibold">{item.titel || ogData[gi]?.title || domain(item)}</span>
							{#if item.beschreibung}
								<span class="hidden md:inline">— {item.beschreibung}</span>
							{/if}
							<span class="ml-auto text-xs opacity-30">{domain(item)}</span>
						</a>
					</li>
				{/each}
			</ul>

		{:else}
			<!-- ── Liste (Standard) ── -->
			<ul class="flex flex-col gap-3">
				{#each group.items as item}
					{@const gi = allItems.indexOf(item)}
					{@const h = href(item)}
					{@const ext = isExternal(item)}
					<li>
						<a
							href={h}
							target={ext ? '_blank' : undefined}
							rel={ext ? 'noopener noreferrer' : undefined}
							class="group flex items-center gap-4 rounded-xl p-3 transition-all hover:shadow-md no-underline"
							style="background: color-mix(in srgb, currentColor 4%, transparent);"
						>
							<div
								class="w-28 md:w-36 flex-shrink-0 aspect-video rounded-lg overflow-hidden relative"
								style="background: color-mix(in srgb, currentColor 8%, transparent);"
							>
								{#if isFilled.image(item.bild)}
									<PrismicImage
										field={item.bild}
										class="w-full h-full object-cover"
									/>
								{:else if h && h !== '#'}
									<OgBild src={ogData[gi]?.image ?? null} alt={label(item, gi)} hostname={domain(item)} done={gi in ogData} />
								{/if}
							</div>
							<div class="flex flex-col gap-0.5 min-w-0">
								<p class="font-semibold leading-tight truncate">{item.titel || ogData[gi]?.title || domain(item)}</p>
								{#if item.beschreibung}
									<p class="leading-snug line-clamp-2">{item.beschreibung}</p>
								{/if}
								<p class="text-xs opacity-35 mt-0.5">{domain(item)}</p>
							</div>
							<svg class="ml-auto flex-shrink-0 w-4 h-4 opacity-25 group-hover:opacity-60 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
</Bounded>
