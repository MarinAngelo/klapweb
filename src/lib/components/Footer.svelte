<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import type { Content } from '@prismicio/client';

	import Bounded from './Bounded.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;
	export let prismicTheme: Content.ThemeDocument;

	const { footerColor, footerBgColor } = get(theme);

	let email = settings.data?.e_mail || '';
</script>

<Bounded tag="footer" yPadding="sm" style="background-color: {footerBgColor};">
	<footer style="color: {footerColor};">
		<div class="flex justify-center items-center h-full">
			<a href={`mailto:${email}`} class="text-center">
				{email}
			</a>
		</div>
	</footer>
</Bounded>
