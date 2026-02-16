<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import type { Content } from '@prismicio/client';
	import { page } from '$app/stores';
	import { _ } from '$lib/stores/i18n';

	import Bounded from './Bounded.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;

	// 1. REAKTIVE SPRACH-LOGIK
	// Wir ziehen die Werte direkt aus dem Page-Store für maximale Reaktivität
	$: dynamicDefaultLang = $page.data.mainLang || 'de-ch';
	$: lang = $page.data.lang || 'de-ch';

	// 2. REAKTIVE LINK-GENERIERUNG
	// Durch $: wird diese Funktion jedes Mal neu definiert/getriggert, wenn lang oder dynamicDefaultLang sich ändern
	$: getStaticHref = (deSlug: string, enSlug: string) => {
		const targetSlug = lang === 'en-us' ? enSlug : deSlug;
		const isDefault = lang === dynamicDefaultLang;
		const prefix = isDefault ? '' : `/${lang}`;
		return `${prefix}/${targetSlug}`.replace(/\/+$/, '') || '/';
	};

	$: ({ footerColor, footerFontSizeTopBar, footerFontSizeButtonBar, footerLinkHoverColor } =
		$theme);

	// Diese Werte können reaktiv bleiben, falls sie sich im CMS ändern
	$: email = settings.data?.e_mail || '';
	$: responsiblePersonCompany = settings.data?.responsible_person_company || 'Klap Web';

	const currentYear = new Date().getFullYear();

	const handleHover = (e: Event, color?: string) => {
		const el = e.target as HTMLElement;
		if (el) el.style.color = color ?? 'var(--footer-link-hover-color)';
	};
</script>

<Bounded
	tag="footer"
	yPadding="none"
	style="background-color: var(--footer-bg-color); color: var(--footer-color) !important; font-family: var(--page-font); margin-top: 10rem; padding-top: 3rem; padding-bottom: 1rem;"
>
	<footer class="w-full h-full text-inherit">
		<div class="flex flex-col sm:flex-row sm:justify-center items-center lg:gap-4">
			<ul class="flex flex-col items-center gap-0 mb-10 text-inherit">
				{#each navigation.data.links as link}
					{#if link.footer_sec_nav === true && link.link}
						<li class="m-0">
							<PrismicLink
								field={link.link}
								class="footer-nav-link hover:underline text-sm leading-tight text-center"
								style="color: var(--footer-link-color); font-size: var(--footer-font-size-top-bar-rem);"
							>
								<PrismicText field={link.label} />
							</PrismicLink>
						</li>
					{/if}
				{/each}
			</ul>
		</div>

		<div class="flex justify-center items-center h-full mb-9">
			<p style="color: var(--footer-color); font-size: var(--footer-font-size-top-bar-rem);">
				{$_('Kontakt')}:
				<a
					href={`mailto:${email}`}
					class="text-center text-inherit hover:underline"
					style="font-size: var(--footer-font-size-top-bar-rem); color: var(--footer-link-color);"
					on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
					on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}
				>
					{email}
				</a>
			</p>
		</div>

		<hr class="border-current opacity-20 mb-6" />

		<div class="mt-4 text-center">
			<p
				class="text-inherit footer-buttonbar-p"
				style="font-size: var(--footer-font-size-button-bar-rem);"
			>
				<a
					href={getStaticHref('datenschutzerklaerung', 'privacy-policy')}
					class="hover:underline text-inherit"
					style="color: var(--footer-link-color);"
					on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
					on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}
				>
					{$_('Datenschutz')}
				</a>

				&nbsp;|&nbsp;

				<a
					href={getStaticHref('impressum', 'legal-notice')}
					class="hover:underline text-inherit"
					style="color: var(--footer-link-color);"
					on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
					on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}
				>
					{$_('Impressum')}
				</a>

				{#if settings.data?.agb && settings.data.agb.length > 0}
					&nbsp;|&nbsp;
					<a
						href={getStaticHref('agb', 'terms-and-conditions')}
						class="hover:underline text-inherit"
						style="color: var(--footer-link-color);"
						on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
						on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}
					>
						{$_('AGB')}
					</a>
				{/if}
			</p>

			<p
				class="text-inherit footer-buttonbar-p"
				style="font-size: var(--footer-font-size-button-bar-rem);"
			>
				{$_('Website erstellt mit')}
				<a
					href="https://svelte.dev"
					target="_blank"
					rel="noopener noreferrer nofollow"
					class="hover:underline text-inherit"
					style="color: var(--footer-link-color);"
					on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
					on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}>Svelte</a
				>
				&nbsp;|&nbsp;
				<a
					href="https://prismic.io"
					target="_blank"
					rel="noopener noreferrer nofollow"
					class="hover:underline text-inherit"
					style="color: var(--footer-link-color);"
					on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
					on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}>Prismic</a
				>
			</p>

			<p
				class="text-inherit footer-buttonbar-p"
				style="font-size: var(--footer-font-size-button-bar-rem);"
			>
				&copy; {currentYear}
				{responsiblePersonCompany}. {$_('Alle Rechte vorbehalten.')}
			</p>
		</div>
	</footer>
</Bounded>

<style>
	.footer-buttonbar-p {
		line-height: 1.2;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}
</style>
