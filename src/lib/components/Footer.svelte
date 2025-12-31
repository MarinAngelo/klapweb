<script lang="ts">
    import { PrismicLink, PrismicText } from '@prismicio/svelte';
    import { theme } from '$lib/stores/theme';
    import type { Content } from '@prismicio/client';

    import Bounded from './Bounded.svelte';

    export let settings: Content.SettingsDocument;
    export let navigation: Content.NavigationDocument;

    $: ({ footerColor, footerBgColor, footerFontSizeTopBar, footerFontSizeButtonBar } = $theme);

    let email = settings.data?.e_mail || '';
    let responsiblePersonCompany = settings.data?.responsible_person_company || '';

    const currentYear = new Date().getFullYear();
</script>

<Bounded 
    tag="footer" 
    yPadding="none" 
    style="background-color: {footerBgColor}; color: {footerColor} !important; margin-top: 10rem; padding-top: 3rem; padding-bottom: 1rem;"
>
    <footer class="w-full h-full text-inherit">
        
		<!-- Topbar -->
        <div class="flex justify-center items-center h-full mb-9 hover:underline">
            <a href={`mailto:${email}`} class="text-center text-inherit" style="font-size: {footerFontSizeTopBar}rem;">
                Kontakt: {email}
            </a>
        </div>

        <div class="flex flex-col sm:flex-row sm:justify-center items-center lg:gap-4">
    <ul class="flex flex-col items-center gap-0 mb-10 text-inherit">
        {#each navigation.data.links as link}
            {#if link.footer_sec_nav === true && link.link.url}
                <li class="m-0">
                    <PrismicLink
                        field={link.link}
                        class="hover:underline text-sm leading-tight text-center"
                        style="color: {footerColor}; font-size: {footerFontSizeTopBar}rem;"
                    >
                        <PrismicText field={link.label} />
                    </PrismicLink>
                </li>
            {/if}
        {/each}
    </ul>
</div>
        
        <hr class="border-current opacity-20 mb-6"> 

        <!-- Buttonbar -->
        <div class="mt-4 text-center">
            <p class="leading-tight text-inherit"  style="font-size: {footerFontSizeButtonBar}rem;">
                &copy; {currentYear}
                {responsiblePersonCompany}. Alle Rechte vorbehalten. <br>
                <a href="https://www.klap-web.ch/" target="_blank" class="hover:underline text-inherit">
                    Webentwicklung: www.klap-web.ch
                </a>
            </p>
        </div>
    </footer>
</Bounded>