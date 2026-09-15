<script>
	import { theme } from '$lib/stores/theme';

	export let name;
	export let color = 'currentColor';
	export let size = '1em';

	// name ist entweder UID/Slug (z.B. "pfeil-rechts") oder Label (z.B. "Pfeil rechts")
	$: normalizedName = String(name ?? '').toLowerCase();
	$: cmsIcon = $theme.svgIcons?.find(
		(i) =>
			String(i.name ?? '').toLowerCase() === normalizedName ||
			String(i.label ?? '').toLowerCase() === normalizedName
	);
	$: resolvedName = cmsIcon?.name ?? name;

	// Hardcodierte Farben im SVG-Code durch den übergeben color-Wert ersetzen (ausser "none")
	$: svgCode = cmsIcon?.svg_code
		? cmsIcon.svg_code
				.replace(/fill="(?!none\b)[^"]*"/gi, `fill="${color}"`)
				.replace(/stroke="(?!none\b)[^"]*"/gi, `stroke="${color}"`)
		: '';
</script>

{#if cmsIcon?.svg_code}
	<!-- SVG-Code kommt aus Prismic-CMS (admin-only → vertrauenswürdig) -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<span
		class="svgicon-cms inline-flex items-center justify-center flex-shrink-0"
		style="width: {size}; height: {size}; color: {color}; vertical-align: middle;"
		aria-hidden="true">{@html svgCode}</span
	>
{:else if cmsIcon?.image_url}
	<img
		src={cmsIcon.image_url}
		alt={cmsIcon.image_alt || ''}
		style="width: {size}; height: {size}; object-fit: contain; vertical-align: middle;"
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
{:else if resolvedName === 'user'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<circle
			cx="12"
			cy="8"
			r="4"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path
			d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else if resolvedName === 'down-square'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<rect x="3" y="3" width="18" height="18" rx="2" stroke={color} stroke-width="2" />
		<path
			d="M8 10l4 4 4-4"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else if resolvedName === 'down'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path
			d="M6 9l6 6 6-6"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else if resolvedName === 'up-square'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<rect x="3" y="3" width="18" height="18" rx="2" stroke={color} stroke-width="2" />
		<path
			d="M8 14l4-4 4 4"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else if resolvedName === 'up'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path
			d="M6 15l6-6 6 6"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else if resolvedName === 'sort' || resolvedName === 'Sort'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path
			d="M16.0686 15H7.9313C7.32548 15 7.02257 15 6.88231 15.1198C6.76061 15.2238 6.69602 15.3797 6.70858 15.5393C6.72305 15.7232 6.93724 15.9374 7.36561 16.3657L11.4342 20.4344C11.6323 20.6324 11.7313 20.7314 11.8454 20.7685C11.9458 20.8011 12.054 20.8011 12.1544 20.7685C12.2686 20.7314 12.3676 20.6324 12.5656 20.4344L16.6342 16.3657C17.0626 15.9374 17.2768 15.7232 17.2913 15.5393C17.3038 15.3797 17.2392 15.2238 17.1175 15.1198C16.9773 15 16.6744 15 16.0686 15Z"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path
			d="M7.9313 9.00005H16.0686C16.6744 9.00005 16.9773 9.00005 17.1175 8.88025C17.2393 8.7763 17.3038 8.62038 17.2913 8.46082C17.2768 8.27693 17.0626 8.06274 16.6342 7.63436L12.5656 3.56573C12.3676 3.36772 12.2686 3.26872 12.1544 3.23163C12.054 3.199 11.9458 3.199 11.8454 3.23163C11.7313 3.26872 11.6323 3.36772 11.4342 3.56573L7.36561 7.63436C6.93724 8.06273 6.72305 8.27693 6.70858 8.46082C6.69602 8.62038 6.76061 8.7763 6.88231 8.88025C7.02257 9.00005 7.32548 9.00005 7.9313 9.00005Z"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else if resolvedName === 'left'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path
			d="M15 18l-6-6 6-6"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else if resolvedName === 'right'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path
			d="M9 18l6-6-6-6"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/if}

<style>
	:global(.svgicon-cms svg) {
		width: 100%;
		height: 100%;
	}
	/* Elemente mit explizitem fill-Attribut (ausser "none") → currentColor */
	:global(.svgicon-cms svg *[fill]:not([fill='none'])) {
		fill: currentColor;
	}
	/* Elemente mit explizitem stroke-Attribut (ausser "none") → currentColor */
	:global(.svgicon-cms svg *[stroke]:not([stroke='none'])) {
		stroke: currentColor;
	}
</style>
