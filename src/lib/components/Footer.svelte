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

	function getWebUrl(link: unknown): { url: string; target?: string } | null {
		const l = link as { link_type?: string; url?: string; target?: string };
		return l?.link_type === 'Web' && l?.url ? { url: l.url, target: l.target } : null;
	}

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
	$: footerMarginTop = $theme.noMarginTop ? '0' : '10rem';
	$: footerCurveEnabled = $theme.footerTopCurve;
	$: footerCurveColor =
		$theme.footerTopCurveColor || $theme.footerBgColor || 'var(--footer-bg-color)';
	$: footerCurveHeight = Math.max(0, Number($theme.footerTopCurveHeight ?? 32));
	$: footerCurveAmplitude = Math.min(
		footerCurveHeight,
		Math.max(0, Number($theme.footerTopCurveAmplitude ?? 16))
	);
	$: footerCurveWaves = Math.min(8, Math.max(1, Number($theme.footerTopCurveWaves ?? 1)));
	$: footerCurveStartAtMax = $theme.footerTopCurveStart === 'Maximale Höhe';
	$: footerCurvePath = (() => {
		const points = 32;
		const values = Array.from({ length: points + 1 }, (_, index) => {
			const x = (index / points) * 100;
			const curve =
				(footerCurveAmplitude / 2) *
				(1 - Math.cos((index / points) * footerCurveWaves * Math.PI * 2));
			const y = footerCurveStartAtMax ? footerCurveHeight - curve : curve;
			return `${x},${y}`;
		});
		return `M 0,${footerCurveHeight} L 100,${footerCurveHeight} L ${values.reverse().join(' L ')} Z`;
	})();

	$: email = settingsData.e_mail || '';
	$: responsiblePersonCompany = settingsData.responsible_person_company || '';
	const currentYear = new Date().getFullYear();
</script>

{#if settings && navigation}
	<div class="footer-shell" style="margin-top: {footerMarginTop};">
		{#if footerCurveEnabled && footerCurveHeight > 0}
			<svg
				class="footer-top-curve"
				aria-hidden="true"
				viewBox={`0 0 100 ${footerCurveHeight}`}
				preserveAspectRatio="none"
				style={`height: ${footerCurveHeight}px;`}
			>
				<path d={footerCurvePath} fill={footerCurveColor} />
			</svg>
		{/if}
		<Bounded
			tag="footer"
			yPadding="none"
			style="background-color: var(--footer-bg-color); color: var(--footer-color) !important; font-family: var(--page-font); margin-top: 0; padding-top: 3rem; padding-bottom: 1rem; overflow: visible;"
		>
			<div class="w-full h-full">
				<div class="flex flex-col sm:flex-row sm:justify-center items-center lg:gap-4">
					<ul class="flex flex-col items-center gap-0 mb-10">
						{#each navigationLinks as link}
							{#if link.footer_sec_nav === true}
								{@const webUrl = getWebUrl(link.link)}
								<li class="m-0">
									{#if webUrl}
										<a
											href={webUrl.url}
											target={webUrl.target || '_self'}
											rel="noopener noreferrer"
											class="footer-nav-link hover:underline text-sm leading-tight text-center"
											style="color: var(--footer-link-color); font-size: var(--footer-font-size-top-bar-rem);"
										>
											<PrismicText field={link.label} />
										</a>
									{:else}
										<PrismicLink
											field={link.link}
											class="footer-nav-link hover:underline text-sm leading-tight text-center"
											style="color: var(--footer-link-color); font-size: var(--footer-font-size-top-bar-rem);"
										>
											<PrismicText field={link.label} />
										</PrismicLink>
									{/if}
								</li>
							{/if}
						{/each}
					</ul>
				</div>

				{#if email}
					<div class="flex justify-center items-center h-full mb-9">
						<p style="color: var(--footer-color); font-size: var(--footer-font-size-top-bar-rem);">
							{$_('Kontakt')}:
							<a
								href={`mailto:${email}`}
								class="footer-link text-center hover:underline"
								style="font-size: var(--footer-font-size-top-bar-rem); color: var(--footer-link-color);"
							>
								{email}
							</a>
						</p>
					</div>
				{/if}

				<hr class="border-current opacity-20 mb-6" />

				<div class="mt-4 text-center">
					<p
						class=" footer-buttonbar-p"
						style="font-size: var(--footer-font-size-button-bar-rem); color: var(--footer-color);"
					>
						<a
							href={getStaticHref('datenschutzerklaerung', 'privacy-policy')}
							class="footer-link hover:underline"
							style="color: var(--footer-link-color);"
						>
							{$_('Datenschutz')}
						</a>

						&nbsp;|&nbsp;

						<a
							href={getStaticHref('impressum', 'legal-notice')}
							class="footer-link hover:underline"
							style="color: var(--footer-link-color);"
						>
							{$_('Impressum')}
						</a>

						{#if settingsData.agb && settingsData.agb.length > 0}
							&nbsp;|&nbsp;
							<a
								href={getStaticHref('agb', 'terms-and-conditions')}
								class="footer-link hover:underline"
								style="color: var(--footer-link-color);"
							>
								{$_('AGB')}
							</a>
						{/if}
						{#if settingsData.haftungsausschluss && settingsData.haftungsausschluss.length > 0}
							&nbsp;|&nbsp;
							<a
								href={getStaticHref('haftungsausschluss', 'disclaimer')}
								class="footer-link hover:underline"
								style="color: var(--footer-link-color);"
							>
								{$_('Haftungsausschluss')}
							</a>
						{/if}
					</p>

					<p
						class=" footer-buttonbar-p"
						style="font-size: var(--footer-font-size-button-bar-rem); color: var(--footer-color);"
					>
						{$_('Website erstellt mit')}
						<a
							href="https://svelte.dev"
							target="_blank"
							rel="noopener noreferrer nofollow"
							class="footer-link hover:underline"
							style="color: var(--footer-link-color);">Svelte</a
						>
						&nbsp;|&nbsp;
						<a
							href="https://prismic.io"
							target="_blank"
							rel="noopener noreferrer nofollow"
							class="footer-link hover:underline"
							style="color: var(--footer-link-color);">Prismic</a
						>
					</p>
					<p
						class=" footer-buttonbar-p"
						style="font-size: var(--footer-font-size-button-bar-rem); color: var(--footer-color);"
					>
						{$_('Gehostet auf')}
						<a
							href="https://www.netlify.com/"
							target="_blank"
							rel="noopener noreferrer nofollow"
							class="footer-link hover:underline"
							style="color: var(--footer-link-color);">Netlify</a
						>
						&nbsp;|&nbsp;
						<a
							href="https://resend.com/"
							target="_blank"
							rel="noopener noreferrer nofollow"
							class="footer-link hover:underline"
							style="color: var(--footer-link-color);">Resend</a
						>
					</p>

					<p
						class=" footer-buttonbar-p"
						style="font-size: var(--footer-font-size-button-bar-rem); color: var(--footer-color);"
					>
						&copy; {currentYear}
						{responsiblePersonCompany}. {$_('Alle Rechte vorbehalten.')}
					</p>
				</div>
			</div>
		</Bounded>
	</div>
{/if}

<style>
	:global(footer) {
		position: relative;
	}

	.footer-shell {
		position: relative;
	}

	.footer-top-curve {
		position: absolute;
		left: 0;
		width: 100%;
		top: 0;
		transform: translateY(-100%);
		pointer-events: none;
		z-index: 1;
		display: block;
	}
</style>
