<script lang="ts">
	import { _ } from '$lib/stores/i18n';
	import { isFilled } from '@prismicio/client';
	import PrismicLink from '$lib/components/PrismicLink.svelte';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/stores';
	import Bounded from '$lib/components/Bounded.svelte';
	import SvgIcons from '$lib/components/SvgIcons.svelte';
	import { getBeauftragunHref } from '$lib/utils/beauftragungHref';
	import { mapAnimation } from '$lib/utils/animationMapper';
	import AddToCartButton from '$lib/components/AddToCartButton.svelte';
	import { calcDisplayPrice } from '$lib/pricing';

	export let slice: any;
	export let slices: any;
	export let context: any;
	export let index: any;

	const sizeMap: Record<string, string> = {
		Klein: 'px-3 py-1.5 text-sm',
		Mittel: 'px-6 py-3 text-base',
		Gross: 'px-10 py-4 text-lg'
	};

	const alignMap: Record<string, string> = {
		Links: 'flex justify-start',
		Mitte: 'flex justify-center',
		Rechts: 'flex justify-end'
	};

	const yPaddingMap: Record<string, string> = {
		'kein Abstand': 'none',
		wenig: 'sm-top',
		mittel: 'base-top',
		gross: 'lg-top'
	};

	$: p = slice.primary ?? {};
	$: sizeClass = sizeMap[p.button_size] ?? sizeMap['Mittel'];
	$: alignClass = alignMap[p.button_align] ?? alignMap['Mitte'];
	$: mobileFullWidth = p.mobile_full_width ?? false;
	$: yPadding = (yPaddingMap[p.y_padding] ?? 'base-top') as
		| 'none'
		| 'sm-top'
		| 'base-top'
		| 'lg-top';

	$: btnStyleName = p.button_style?.uid || undefined;
	$: btnStyleEntry = btnStyleName
		? ($theme.buttonStile ?? []).find((s) => s.name === btnStyleName)
		: undefined;
	$: btnIcon = btnStyleEntry?.icon || undefined;
	$: buttonColor =
		p.button_color ||
		(btnStyleName
			? `var(--btn-${btnStyleName}-color, var(--page-button-color))`
			: $theme.pageButtonColor);
	$: buttonBgColor =
		p.button_bg_color ||
		(btnStyleName
			? `var(--btn-${btnStyleName}-bg, var(--page-button-bg-color))`
			: $theme.pageButtonBgColor);
	$: buttonHoverColor =
		p.button_hover_color ||
		(btnStyleName
			? `var(--btn-${btnStyleName}-hover-color, var(--page-button-hover-color))`
			: $theme.pageButtonHoverColor);
	$: buttonHoverBgColor =
		p.button_hover_bg_color ||
		(btnStyleName
			? `var(--btn-${btnStyleName}-hover-bg, var(--page-button-hover-bg-color))`
			: $theme.pageButtonHoverBgColor);
	$: beauftragungHref = getBeauftragunHref(p.button_link, $page.params.uid);

	// Kauf-Schaltfläche: the package page can also go into the cart (with Leistungen)
	$: pageData = ($page.data?.page?.data ?? {}) as Record<string, any>;
	$: cartItem =
		slice.variation === 'kauf' && $page.params.uid && pageData.ecommerce_active
			? {
					type: 'page' as const,
					uid: $page.params.uid,
					label: pageData.title?.[0]?.text || $page.params.uid,
					price: calcDisplayPrice(
						pageData.ecommerce_price_chf ?? null,
						pageData.ecommerce_discount_percent ?? null,
						pageData.ecommerce_deposit_percent ??
							$page.data?.settings?.data?.global_deposit_percent ??
							null
					),
					billingType: pageData.ecommerce_billing_type || null
				}
			: null;
	$: cartButtonSize =
		({ Klein: 'sm', Mittel: 'md', Gross: 'lg' } as Record<string, 'sm' | 'md' | 'lg'>)[
			p.button_size
		] ?? 'md';
	$: anim = mapAnimation(p.animate, p.anim_direction, p.anim_delay, p.anim_duration);
</script>

<Bounded
	tag="section"
	{yPadding}
	marginTopSize={p.margin_top}
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class={slice.primary.mobile_full_width ? 'overflow-x-clip' : ''}
>
	<div
		class="{alignClass} flex-wrap items-center gap-3 {slice.primary.mobile_full_width
			? '-mx-6 md:mx-0 px-6 md:px-0'
			: ''}"
	>
		{#if slice.variation === 'kauf'}
			<a
				href="/beauftragung{$page.params.uid
					? `?dienstleistung=${encodeURIComponent($page.params.uid)}`
					: ''}"
				class="btn-dynamic button-prismic-link font-semibold rounded-full border transition duration-200 ease-in-out {sizeClass} {mobileFullWidth
					? 'flex w-full items-center justify-center sm:inline-flex sm:items-center sm:w-auto'
					: 'inline-flex items-center gap-2'}"
				style:--btn-bg={buttonBgColor}
				style:--btn-color={buttonColor}
				style:--hover-text-color={buttonHoverColor}
				style:--hover-bg-color={buttonHoverBgColor}
				style:--focus-ring-color={buttonColor}
			>
				{p.button_text || $_('Jetzt beauftragen')}{#if btnIcon}&nbsp;<SvgIcons
						name={btnIcon}
						size="1em"
						color={btnStyleEntry?.color || 'currentColor'}
					/>{/if}
			</a>
			{#if cartItem}
				<AddToCartButton item={cartItem} size={cartButtonSize} />
			{/if}
		{:else if isFilled.link(p.button_link)}
			{#if beauftragungHref}
				<a
					href={beauftragungHref}
					class="btn-dynamic button-prismic-link font-semibold rounded-full border transition duration-200 ease-in-out {sizeClass} {mobileFullWidth
						? 'flex w-full items-center justify-center sm:inline-flex sm:items-center sm:w-auto'
						: 'inline-flex items-center gap-2'}"
					style:--btn-bg={buttonBgColor}
					style:--btn-color={buttonColor}
					style:--hover-text-color={buttonHoverColor}
					style:--hover-bg-color={buttonHoverBgColor}
					style:--focus-ring-color={buttonColor}
				>
					{p.button_text || $_('Mehr erfahren')}{#if btnIcon}&nbsp;<SvgIcons
							name={btnIcon}
							size="1em"
							color={btnStyleEntry?.color || 'currentColor'}
						/>{/if}
				</a>
			{:else}
				<PrismicLink
					field={p.button_link}
					class="btn-dynamic button-prismic-link font-semibold rounded-full border transition duration-200 ease-in-out {sizeClass} {mobileFullWidth
						? 'flex w-full items-center justify-center sm:inline-flex sm:items-center sm:w-auto'
						: 'inline-flex items-center gap-2'}"
					style="--btn-bg: {buttonBgColor}; --btn-color: {buttonColor}; --hover-text-color: {buttonHoverColor}; --hover-bg-color: {buttonHoverBgColor}; --focus-ring-color: {buttonColor};"
				>
					{p.button_text || $_('Mehr erfahren')}{#if btnIcon}&nbsp;<SvgIcons
							name={btnIcon}
							size="1em"
							color={btnStyleEntry?.color || 'currentColor'}
						/>{/if}
				</PrismicLink>
			{/if}
		{/if}
	</div>
</Bounded>
