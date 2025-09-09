import { derived, type Readable } from 'svelte/store';

export function createBannerHeight(
	theme: Readable<any>,
	headerHeight: Readable<number>,
	slice: Readable<{ primary: { banner_height?: string; banner_overlap?: boolean } }>
) {
	return derived([theme, headerHeight, slice], ([$theme, $headerHeight, $slice]) => {
		const raw = $slice.primary.banner_height ?? '100%';
		const clean = raw.replace(/\s/g, '');
		const bannerTop = $slice.primary.banner_overlap ?? $theme.bannerTop;

		if (!bannerTop && (!$headerHeight || $headerHeight === 0)) {
			return 'auto';
		}

		switch (clean) {
			case '100%':
				return bannerTop ? '100vh' : `calc(100vh - ${$headerHeight}px)`;
			case '50%':
				return '50vh';
			case '33%':
				return '33vh';
			default:
				return '100vh';
		}
	});
}
