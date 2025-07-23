<script lang="ts">
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme';
	import { headerHeight } from '$lib/stores/headerHeight';
	import type { Content } from '@prismicio/client';
	import clsx from 'clsx';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { isMenuOpen } from '$lib/stores/isMenuOpen';
	import { PrismicImage, PrismicText } from '@prismicio/svelte';


	import Bounded from './Bounded.svelte';
	import Navbar from './Navbar.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;
	export let prismicTheme: Content.PrismicThemeDocument;

	let headerEl: HTMLElement;

	function updateHeaderHeight() {
		if (headerEl) {
			headerHeight.set(headerEl.offsetHeight);
		}
	}

	onMount(() => {
		updateHeaderHeight();
		const observer = new ResizeObserver(updateHeaderHeight);
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

	// Dynamischer Style je nach Menüstatus
	$: headerStyle = `
		background-color: ${headerBgColor};
		opacity: ${$isMenuOpen ? 1 : headerBgOpacity};
		color: ${headerColor};
		position: ${bannerTop && isHome ? 'absolute' : 'relative'};
		z-index: 100;
		transition: opacity 300ms ease;
	`;
</script>

<Bounded
	tag="header"
	yPadding="none"
	tMargin="lg"
	bind:elementRef={headerEl}
	class={clsx(
		{ 'absolute inset-x-0 top-0': bannerTop && isHome },
		'transition-opacity duration-300 ease-in-out'
	)}
	style={headerStyle}
>
	<!-- Logo -->
	 <div class="flex items-center justify-between w-full">
		 <div class="logo m-0">
			 {#if prismicTheme.data.logo?.url}
				 <a href="/" class="flex items-center">
					 <PrismicImage
						 field={prismicTheme.data.logo}
						 alt={prismicTheme.data.logo.alt}
						 class="h-24 w-auto"
					 />
				 </a>
			 {:else}
				 <a href="/" style="color: {headerColor};">
					 <span class="text-xl font-semibold tracking-tight">
						 <PrismicText field={settings.data.site_title} /><br />
					 </span>
					 <span>
						 <PrismicText
							 field={settings.data.site_sub_title}
							 style="font-size: 5rem"
							 class="text-sm"
						 />
					 </span>
				 </a>
			 {/if}
		 </div>
		 <Navbar
			 {navigation}
			 {headerColor}
			 {headerBgColor}
			 {headerLinkColor}
			 {headerLinkHoverColor}
			 {settings}
			 {currentPath}
			 {prismicTheme}
		 />
	 </div>
</Bounded>
