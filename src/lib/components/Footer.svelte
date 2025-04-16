<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import type { Content } from '@prismicio/client';

	import Bounded from './Bounded.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;

	const { footerColor, footerBgColor } = get(theme);

	let email = settings.data?.e_mail || '';
	let responsiblePersonCompany =
		settings.data?.responsible_person_company || '';

	// Aktuelles Jahr dynamisch generieren
	const currentYear = new Date().getFullYear();
</script>

<Bounded tag="footer" yPadding="base" style="background-color: {footerBgColor}; margin-top: 10rem;">
	<footer class="pb-6" style="color: {footerColor};">
		<div class="flex justify-center items-center h-full">
			<a href={`mailto:${email}`} class="text-center">
				{email}
			</a>
		</div>
		<div>
			<ul class="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:justify-start">
				{#each navigation.data.links as link}
					{#if link.footer_sec_nav === true && link.link.url}
						<li>
							<PrismicLink field={link.link} class="hover:underline text-sm/10 text-center">
								<PrismicText field={link.label} />
							</PrismicLink>
						</li>
					{/if}
				{/each}
			</ul>
		</div>
		<div>
			<p>
				Webentwicklung: <a href="https://www.klap-web.ch/" target="_blank">klap-web-ch</a>
			</p>
		</div>
		<div class="mt-4 text-center text-sm">
			&copy; {currentYear} {responsiblePersonCompany}. Alle Rechte vorbehalten.
		</div>
	</footer>
</Bounded>
