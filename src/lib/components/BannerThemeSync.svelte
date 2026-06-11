<script lang="ts">
	import { onDestroy } from 'svelte';
	import { theme, THEME_DEFAULTS } from '$lib/stores/theme';
	import { convertNumber } from '$lib/utils/convertNumber';

	/** Entspricht `banner_overlap` im Prismic-Slice */
	export let bannerOverlap: boolean = false;
	/** Roher Prismic-Wert 0–100; `null` = nicht gesetzt */
	export let headerBgOpacityRaw: number | null = null;

	$: headerBgOpacityVal = convertNumber(headerBgOpacityRaw ?? 0) || 0;

	$: theme.update((t) => ({
		...t,
		bannerTop: bannerOverlap,
		headerBgOpacity: headerBgOpacityVal
	}));

	onDestroy(() => {
		theme.update((t) => ({
			...t,
			bannerTop: THEME_DEFAULTS.bannerTop,
			headerBgOpacity: THEME_DEFAULTS.headerBgOpacity
		}));
	});
</script>
