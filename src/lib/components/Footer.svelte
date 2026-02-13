<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import type { Content } from '@prismicio/client';
	import { page } from '$app/stores';

	import Bounded from './Bounded.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;

	$: ({
		footerColor,
		footerFontSizeTopBar,
		footerFontSizeButtonBar,
		footerLinkHoverColor
	} = $theme);

	let email = settings.data?.e_mail || '';
	let responsiblePersonCompany = settings.data?.responsible_person_company || 'Klap Web';

	const currentYear = new Date().getFullYear();

	// Event-Handler für Hover-Effekte
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
		<!-- Topbar -->
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
				Kontakt:
				<a
					href={`mailto:${email}`}
					class="text-center text-inherit hover:underline"
					style="font-size: var(--footer-font-size-top-bar-rem); color: var(--footer-link-color); --hover-text-color: var(--footer-link-hover-color);"
					on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
					on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}
				>
					{email}
				</a>
			</p>
		</div>

		<hr class="border-current opacity-20 mb-6" />

		<!-- Buttonbar -->
		<div class="mt-4 text-center">
			<p
				class="text-inherit footer-buttonbar-p"
				style="font-size: var(--footer-font-size-button-bar-rem);"
			>
				<a
					href={$page.data.lang === 'en-us' ? '/en-us/privacy-policy' : '/datenschutzerklaerung'}
					class="hover:underline text-inherit"
					style="color: var(--footer-link-color); --hover-text-color: var(--footer-link-hover-color);"
					on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
					on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}
				>
					{$page.data.lang === 'en-us' ? 'Privacy Policy' : 'Datenschutzerklärung'}
				</a>
				&nbsp;|&nbsp;
				<a
					href={$page.data.lang === 'en-us' ? '/en-us/legal-notice' : '/impressum'}
					class="hover:underline text-inherit"
					style="color: var(--footer-link-color); --hover-text-color: var(--footer-link-hover-color);"
					on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
					on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}
				>
					{$page.data.lang === 'en-us' ? 'Legal Notice' : 'Impressum'}
				</a>
				{#if settings.data?.agb && settings.data.agb.length > 0}
					&nbsp;|&nbsp;
					<a
						href={$page.data.lang === 'en-us' ? '/en-us/terms-and-conditions' : '/agb'}
						class="hover:underline text-inherit"
						style="color: var(--footer-link-color); --hover-text-color: var(--footer-link-hover-color);"
						on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
							on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}
					>
						{$page.data.lang === 'en-us' ? 'Terms and Conditions' : 'AGB'}
					</a>
				{/if}
			</p>

			<p
				class="text-inherit footer-buttonbar-p"
				style="font-size: var(--footer-font-size-button-bar-rem);"
			>
				Website erstellt mit
				<a
					href="https://svelte.dev"
					target="_blank"
					rel="noopener noreferrer nofollow"
					class="hover:underline text-inherit"
					style="color: var(--footer-link-color); --hover-text-color: var(--footer-link-hover-color);"
					on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
					on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}
				>
					Svelte
				</a>
				&nbsp;|&nbsp;
				<a
					href="https://prismic.io"
					target="_blank"
					rel="noopener noreferrer nofollow"
					class="hover:underline text-inherit"
					style="color: var(--footer-link-color); --hover-text-color: var(--footer-link-hover-color);"
					on:mouseenter={(e) => handleHover(e, 'var(--footer-link-hover-color)')}
					on:mouseleave={(e) => handleHover(e, 'var(--footer-link-color)')}
				>
					Prismic
				</a>
			</p>
			<p
				class="text-inherit footer-buttonbar-p"
				style="font-size: var(--footer-font-size-button-bar-rem);"
			>
				&copy; {currentYear}
				{responsiblePersonCompany}. Alle Rechte vorbehalten.
			</p>
		</div>
	</footer>
</Bounded>

<style>
	:global(.footer-nav-link:hover) {
		color: var(--footer-link-hover-color) !important;
	}
	.footer-buttonbar-p {
		line-height: 0.8rem;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}
</style>
