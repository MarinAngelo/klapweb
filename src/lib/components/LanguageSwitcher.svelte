<script lang="ts">
	import { page } from '$app/stores';
	import { staticRoutes } from '$lib/i18n/i18n';
	import { preferredLang } from '$lib/stores/preferredLang';
	import { t } from '$lib/i18n/translations';

	export let locales: string[] = [];
	export let lang: string = '';
	export let allAlternates: any[] = [];

	// Source of Truth für das URL-Präfix
	$: dynamicDefaultLang = $page.data.mainLang || 'de-ch';

	$: links = locales.map((loc) => {
		// 1. Wenn allAlternates vom Layout bereitstehen, nutzen wir diese (garantiert synchron)
		const match = allAlternates.find((a) => a.lang === loc);
		if (match && match.href) {
			// verified = false: page not translated into this language → shown greyed out
			return {
				loc,
				href: match.href,
				label: loc.split('-')[0],
				available: match.verified !== false
			};
		}

		// 2. Fallback-Logik (identisch mit Layout-Logik)
		const segments = $page.url.pathname.split('/').filter(Boolean);
		const firstSegment = segments[0];
		const isFirstSegmentLang = locales.includes(firstSegment);
		const currentSlug = isFirstSegmentLang ? segments[1] || 'home' : firstSegment || 'home';

		let targetSlug = $page.params.uid || currentSlug;

		// Mapping für statische Routen
		for (const key in staticRoutes) {
			if (Object.values(staticRoutes[key]).includes(currentSlug)) {
				targetSlug = staticRoutes[key][loc];
				break;
			}
		}

		const isTargetDefault = loc === dynamicDefaultLang;
		const prefix = isTargetDefault ? '' : `/${loc}`;
		const slugPart = targetSlug === 'home' || !targetSlug ? '' : `/${targetSlug}`;

		const href = `${prefix}${slugPart}`.replace(/\/+$/, '') || '/';

		return {
			loc,
			href,
			label: loc.split('-')[0],
			available: true
		};
	});
</script>

<div class="flex gap-3 items-center">
	{#if links}
		{#each links as item}
			{#if item.available || lang === item.loc}
				<a
					href={item.href}
					on:click={() => preferredLang.set(item.loc)}
					class="nav-link text-lg font-bold uppercase transition-all {lang === item.loc
						? 'underline'
						: 'text-muted no-underline hover:underline'}"
					aria-current={lang === item.loc ? 'true' : undefined}
				>
					{item.label}
				</a>
			{:else}
				<span
					class="text-lg font-bold uppercase text-muted line-through cursor-not-allowed"
					title={t('Diese Seite ist noch nicht übersetzt.', item.loc)}
					aria-disabled="true">{item.label}</span
				>
			{/if}

			{#if item.loc !== links[links.length - 1].loc}
				<span class="text-muted text-[10px]" aria-hidden="true">|</span>
			{/if}
		{/each}
	{/if}
</div>
