<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import Bounded from '$lib/components/Bounded.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: any;
	export let slices: any[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	$: anim = mapAnimationFromPrimary(slice.primary as any);
	$: primary = slice.primary as any;
	$: bgColor = primary.bg_color || $theme.pageBgColor;
	$: layout = primary.layout || 'Horizontal';
	$: buttonSize = primary.button_size || 'Mittel';
	$: align = primary.align || 'Mitte';
	$: showNumber = primary.show_number ?? false;

	const alignClass: Record<string, string> = {
		Links: 'justify-start',
		Mitte: 'justify-center',
		Rechts: 'justify-end'
	};

	const sizeClass: Record<string, string> = {
		Klein: 'px-4 py-2 text-sm gap-2',
		Mittel: 'px-5 py-3 text-base gap-3',
		Gross: 'px-6 py-4 text-lg gap-3'
	};

	const iconSize: Record<string, number> = { Klein: 18, Mittel: 22, Gross: 26 };

	const appConfig: Record<string, { color: string; buildHref: (v: string) => string }> = {
		WhatsApp: {
			color: '#25d366',
			buildHref: (v) => `https://wa.me/${v.replace(/[^+\d]/g, '')}`
		},
		Telegram: {
			color: '#229ED9',
			buildHref: (v) => `https://t.me/${v.replace(/^@/, '')}`
		},
		Signal: {
			color: '#3a76f0',
			buildHref: (v) => `https://signal.me/#p/${v.replace(/[^+\d]/g, '')}`
		},
		Telefon: {
			color: '#555',
			buildHref: (v) => `tel:${v.replace(/\s/g, '')}`
		},
		'E-Mail': {
			color: '#555',
			buildHref: (v) => `mailto:${v}`
		},
		'Facebook Messenger': {
			color: '#0084ff',
			buildHref: (v) => `https://m.me/${v.replace(/^@/, '')}`
		},
		Instagram: {
			color: '#e1306c',
			buildHref: (v) => `https://ig.me/m/${v.replace(/^@/, '')}`
		}
	};

	function getHref(app: string, value: string): string {
		return appConfig[app]?.buildHref(value) ?? '#';
	}

	function getColor(app: string): string {
		return appConfig[app]?.color ?? '#555';
	}
</script>

<Bounded
	as="section"
	style="background-color: {bgColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
	{#if primary.heading}
		<h2 class="mb-6 text-center">{primary.heading}</h2>
	{/if}

	<div
		class="flex flex-wrap {layout === 'Vertikal' ? 'flex-col items-start' : alignClass[align] ?? 'justify-center'} gap-3"
		style={layout === 'Vertikal' ? `align-items: ${align === 'Rechts' ? 'flex-end' : align === 'Mitte' ? 'center' : 'flex-start'}` : ''}
	>
		{#each slice.items as item}
			{@const label = item.label || item.app}
			{@const value = item.value || ''}
			{@const href = getHref(item.app, value)}
			{@const color = getColor(item.app)}
			{@const sz = iconSize[buttonSize] ?? 22}

			<a
				{href}
				target={['Telefon', 'E-Mail'].includes(item.app) ? '_self' : '_blank'}
				rel="noopener noreferrer"
				class="kontakt-btn inline-flex items-center rounded-full font-semibold transition-opacity hover:opacity-85 {sizeClass[buttonSize] ?? sizeClass['Mittel']}"
				style="background-color: {color}; color: #fff; text-decoration: none;"
			>
				{#if item.app === 'WhatsApp'}
					<svg width={sz} height={sz} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
					</svg>
				{:else if item.app === 'Telegram'}
					<svg width={sz} height={sz} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
					</svg>
				{:else if item.app === 'Signal'}
					<svg width={sz} height={sz} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.29 4.394l.602.164a7.258 7.258 0 0 1 1.128.407l.556.254.494-.38.997.997-.38.494.254.556a7.26 7.26 0 0 1 .407 1.128l.164.602.604.103v1.41l-.604.103-.164.602a7.26 7.26 0 0 1-.407 1.128l-.254.556.38.494-.997.997-.494-.38-.556.254a7.257 7.257 0 0 1-1.128.407l-.602.164-.103.604H10.78l-.103-.604-.602-.164a7.26 7.26 0 0 1-1.128-.407l-.556-.254-.494.38-.997-.997.38-.494-.254-.556a7.263 7.263 0 0 1-.407-1.128l-.164-.602-.604-.103V9.718l.604-.103.164-.602a7.26 7.26 0 0 1 .407-1.128l.254-.556-.38-.494.997-.997.494.38.556-.254a7.26 7.26 0 0 1 1.128-.407l.602-.164.103-.604h1.41zm-.703 3.01a4.597 4.597 0 1 0 0 9.193 4.597 4.597 0 0 0 0-9.193zm0 1.532a3.065 3.065 0 1 1 0 6.13 3.065 3.065 0 0 1 0-6.13zm5.742 9.158l.48.83a8.785 8.785 0 0 1-1.298.973l-.483-.836a7.27 7.27 0 0 0 1.3-.967zm-11.485 0a7.27 7.27 0 0 0 1.3.967l-.483.836A8.785 8.785 0 0 1 5.364 18.9zm13.24-2.74a8.75 8.75 0 0 1-.534 1.461l-.89-.386a7.24 7.24 0 0 0 .44-1.213zm-14.994 0l.984-.138a7.24 7.24 0 0 0 .44 1.213l-.89.386a8.75 8.75 0 0 1-.534-1.461zm15.492-2.785v.008l-.998.003a7.25 7.25 0 0 0-.11-1.28l.984-.138a8.72 8.72 0 0 1 .124 1.407zm-15.99 0a8.72 8.72 0 0 1 .124-1.407l.984.139a7.254 7.254 0 0 0-.11 1.28zm15.403-2.657l-.89.386a7.24 7.24 0 0 0-.61-1.126l.836-.483a8.75 8.75 0 0 1 .664 1.223zm-14.816 0a8.75 8.75 0 0 1 .664-1.223l.836.483a7.24 7.24 0 0 0-.61 1.126zm12.888-2.17l-.598.797a7.27 7.27 0 0 0-1.014-.78l.48-.831a8.773 8.773 0 0 1 1.132.814zm-10.96 0a8.773 8.773 0 0 1 1.132-.814l.48.831a7.27 7.27 0 0 0-1.014.78zm8.535-1.502l-.286.96a7.27 7.27 0 0 0-1.21-.445l.164-.984a8.76 8.76 0 0 1 1.332.47zm-6.11 0a8.76 8.76 0 0 1 1.332-.47l.164.984a7.266 7.266 0 0 0-1.21.445zm3.393-.603v.998a7.25 7.25 0 0 0-1.284.109l-.138-.985a8.72 8.72 0 0 1 1.422-.122z"/>
					</svg>
				{:else if item.app === 'Telefon'}
					<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.76a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
					</svg>
				{:else if item.app === 'E-Mail'}
					<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<rect width="20" height="16" x="2" y="4" rx="2"/>
						<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
					</svg>
				{:else if item.app === 'Facebook Messenger'}
					<svg width={sz} height={sz} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.986 8.4l3.137 3.259L19.949 8.4z"/>
					</svg>
				{:else if item.app === 'Instagram'}
					<svg width={sz} height={sz} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
					</svg>
				{/if}

				<span>{label}</span>

				{#if showNumber && value}
					<span class="opacity-75 font-normal text-sm">{value}</span>
				{/if}
			</a>
		{/each}
	</div>
</Bounded>
