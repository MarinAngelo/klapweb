<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import type { Content } from '@prismicio/client';
	import { page } from '$app/stores';
	import { _ } from '$lib/stores/i18n';
	import { getLangBase } from '$lib/i18n/i18n'; // Wir nutzen den neuen Helper

	import Bounded from './Bounded.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;
	export let lang: string | undefined;
	export let mainLang: string | undefined;

	// Reaktive Daten-Sicherung
	$: settingsData = settings?.data || {};
	$: navigationLinks = navigation?.data?.links || [];

	// REAKTIVE LINK-GENERIERUNG
	// Diese Logik prüft jetzt: "Welche Sprache bin ich?" statt "Bin ich Master?"
	$: getStaticHref = (deSlug: string, enSlug: string) => {
		if (!lang) return '/';

		const currentBase = getLangBase(lang); // Liefert 'de' oder 'en'
		const targetSlug = currentBase === 'en' ? enSlug : deSlug;

		// Prefix Logik: Master (mainLang) bekommt keinen Prefix, alle anderen schon
		const isDefault = lang === mainLang;
		const prefix = isDefault ? '' : `/${lang}`;

		const path = `${prefix}/${targetSlug}`.replace(/\/+$/, '');
		return path || '/';
	};

	$: ({ footerColor } = $theme);

	$: email = settingsData.e_mail || '';
	$: responsiblePersonCompany = settingsData.responsible_person_company || '';
	const currentYear = new Date().getFullYear();

	const handleHover = (e: Event, color?: string) => {
		const el = e.target as HTMLElement;
		if (el) el.style.color = color ?? 'var(--footer-link-hover-color)';
	};
</script>

{#if settings && navigation}
	<Bounded
		tag="footer"
		yPadding="none"
		style="background-color: var(--footer-bg-color); color: var(--footer-color) !important; font-family: var(--page-font); margin-top: 10rem; padding-top: 3rem; padding-bottom: 1rem;"
	>
		<footer class="w-full h-full text-inherit">
			<div class="flex flex-col sm:flex-row sm:justify-center items-center lg:gap-4">
				<ul class="flex flex-col items-center gap-0 mb-10 text-inherit">
					{#each navigationLinks as link}
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

					{#if settingsData.agb && settingsData.agb.length > 0}
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
						style="color: var(--footer-link-color);">Svelte</a
					>
					&nbsp;|&nbsp;
					<a
						href="https://prismic.io"
						target="_blank"
						rel="noopener noreferrer nofollow"
						class="hover:underline text-inherit"
						style="color: var(--footer-link-color);">Prismic</a
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
{/if}
