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
	let responsiblePersonCompany = settings.data?.responsible_person_company || '';

	// Aktuelles Jahr dynamisch generieren
	const currentYear = new Date().getFullYear();
</script>

<Bounded tag="footer" yPadding="base" style="background-color: {footerBgColor}; margin-top: 10rem;">
	<footer class="pb-6" style="color: {footerColor};">
		<div class="flex justify-center items-center h-full mb-9 hover:underline">
			<a href={`mailto:${email}`} class="text-center">
				Kontakt: {email}
			</a>
		</div>
		<div class="flex flex-col sm:flex-row sm:justify-between items-center lg:gap-4">
			<!-- Links ausgerichtetes div -->
			<div class="text-left sm:text-left w-full sm:w-auto">
				<ul class="flex flex-col items-center sm:items-start gap-2">
					{#each navigation.data.links as link}
						{#if link.footer_sec_nav === true && link.link.url}
							<li>
								<PrismicLink
									field={link.link}
									class="hover:underline text-sm/10 text-center sm:text-left"
								>
									<PrismicText field={link.label} />
								</PrismicLink>
							</li>
						{/if}
					{/each}
				</ul>
			</div>

			<!-- Rechts ausgerichtetes div -->
			<div class="text-center sm:text-right w-full sm:w-auto">
				<p>
					<a href="https://www.klap-web.ch/" target="_blank" class="text-sm/10 hover:underline">
						Webentwicklung: www.klap-web.ch
					</a>
				</p>
			</div>
		</div>
		<div class="mt-4 text-center text-sm">
			&copy; {currentYear}
			{responsiblePersonCompany}. Alle Rechte vorbehalten.
		</div>
	</footer>
</Bounded>
