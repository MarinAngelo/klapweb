<script lang="ts">
	import { page } from '$app/stores'; // Importiere den $page-Store
	import { theme } from '$lib/stores/theme';
	import type { Content } from '@prismicio/client';
	import clsx from 'clsx';
	import { get } from 'svelte/store';

	import Bounded from './Bounded.svelte';
	import Navbar from './Navbar.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;

	const {
		bannerTop,
		headerBgColor,
		headerBgOpacity,
		headerColor,
		headerLinkColor,
		headerLinkHoverColor
	} = get(theme);

	const currentPath = $page.url.pathname;
	console.log('🚀 ~ currentPathname:', currentPath);

	// Überprüfen, ob die aktuelle URL "/"" ist
	$: isHome = $page.url.pathname === '/';
</script>

<Bounded
	tag="header"
	yPadding="sm"
	class={clsx({ 'absolute inset-x-0 top-0': bannerTop && isHome })}
	style="background-color: {headerBgColor}; opacity: {headerBgOpacity}; color: white; z-index: 49;"
>
	<!-- Beinhaltet nur den Text nicht die ganze Kopfzeile -->
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
