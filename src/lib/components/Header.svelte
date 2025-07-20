<script lang="ts">
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme';
	import { headerHeight } from '$lib/stores/headerHeight';
	import type { Content } from '@prismicio/client';
	import clsx from 'clsx';
	import { get } from 'svelte/store';
	import { afterUpdate } from 'svelte';

	import Bounded from './Bounded.svelte';
	import Navbar from './Navbar.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;

	let headerEl: HTMLElement;

	afterUpdate(() => {
		if (!headerEl) {
			return;
		}
		headerHeight.set(headerEl.offsetHeight);

		const observer = new ResizeObserver(() => {
			headerHeight.set(headerEl.offsetHeight);
		});
		observer.observe(headerEl);
		return () => observer.disconnect();
	});

	const {
		bannerTop,
		headerBgColor,
		headerBgOpacity,
		headerColor,
		headerLinkColor,
		headerLinkHoverColor
	} = get(theme);

	$: currentPath = $page.url.pathname;
	$: isHome = $page.url.pathname === '/';
</script>

<Bounded
    tag="header"
    yPadding="none"
    tMargin="lg"
    bind:elementRef={headerEl}
    class={clsx({ 'absolute inset-x-0 top-0': bannerTop && isHome })}
    style="background-color: {headerBgColor}; opacity: {headerBgOpacity}; color: white; position: relative; z-index: 100;"
>
    <Navbar
        {navigation}
        {headerColor}
        {headerBgColor}
        {headerLinkColor}
        {headerLinkHoverColor}
        {settings}
        {currentPath}
    />
</Bounded>