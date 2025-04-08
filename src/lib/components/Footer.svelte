<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import type { Content } from '@prismicio/client';

	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import clsx from 'clsx';

	import Bounded from './Bounded.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;
	export let prismicTheme: Content.ThemeDocument;
	console.log('Header', { settings, navigation, prismicTheme });

	const { headerColor, bgColor, bgOpacity } = get(theme);
</script>

<Bounded
    tag="footer"
    yPadding="sm"
    class={clsx({ 'absolute inset-x-0 bottom-0': false })}
    style="background-color: {bgColor}; opacity: {bgOpacity}; color: white; z-index: 9999;"
>
<footer style="background-color: {bgColor}; opacity: {bgOpacity}; color: {headerColor};">
	<div class="background-color">
		<p>hello</p>
	</div>
</footer>
</Bounded>