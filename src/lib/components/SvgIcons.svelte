<script>
	import { theme } from '$lib/stores/theme';
	import { ICON_SLUG_BY_LABEL } from '$lib/config/icon-labels';

	export let name;
	export let color = 'currentColor';
	export let size = '1em';

	// Wenn name ein Label ist (z.B. "Externer Link"), zuerst zum Slug auflösen
	$: resolvedName = ICON_SLUG_BY_LABEL[name] ?? name;

	// CMS-Icons aus Theme-Store haben Vorrang vor eingebauten Icons
	$: cmsIcon = $theme.svgIcons?.find((i) => i.name === resolvedName || i.label === name);
</script>

{#if cmsIcon?.svg_code}
	<!-- SVG-Code kommt aus Prismic-CMS (admin-only → vertrauenswürdig) -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<span
		class="inline-flex items-center justify-center"
		style="width: {size}; height: {size}; color: {color};"
		aria-hidden="true">{@html cmsIcon.svg_code}</span
	>
{:else if cmsIcon?.image_url}
	<img
		src={cmsIcon.image_url}
		alt={cmsIcon.image_alt || ''}
		style="width: {size}; height: {size}; object-fit: contain;"
		aria-hidden="true"
	/>
{:else if resolvedName === 'menu'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
		><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
			id="SVGRepo_tracerCarrier"
			stroke-linecap="round"
			stroke-linejoin="round"
		></g><g id="SVGRepo_iconCarrier">
			<line
				x1="5"
				y1="7"
				x2="19"
				y2="7"
				stroke={color}
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			></line>
			<line
				x1="5"
				y1="12"
				x2="19"
				y2="12"
				stroke={color}
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			></line>
			<line
				x1="5"
				y1="17"
				x2="19"
				y2="17"
				stroke={color}
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			></line>
		</g></svg
	>
{:else if resolvedName === 'close'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
		><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
			id="SVGRepo_tracerCarrier"
			stroke-linecap="round"
			stroke-linejoin="round"
		></g><g id="SVGRepo_iconCarrier">
			<path
				d="M5 5L19 19M5 19L19 5"
				stroke={color}
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			></path>
		</g></svg
	>
{:else if resolvedName === 'external-link'}
	<!-- Externer Link / neue Seite öffnen -->
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path
			d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<polyline
			points="15 3 21 3 21 9"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<line
			x1="10"
			y1="14"
			x2="21"
			y2="3"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/if}
