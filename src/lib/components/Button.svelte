<script lang="ts">
    import { PrismicLink } from '@prismicio/svelte';
    import { theme } from '$lib/stores/theme';
    import { get } from 'svelte/store';

    export let link: any;
    export let text: string = 'Mehr erfahren';

    const pageLinkColor = get(theme).pageLinkColor;
    const pageLinkHoverColorText = get(theme).pageLinkHoverColorText;
    const pageLinkHoverColorBg = get(theme).pageLinkHoverColorBg;

</script>

<PrismicLink
    field={link}
    class="inline-block px-4 py-2 font-semibold rounded-full text-xs sm:text-sm
           bg-transparent border
           hover:bg-current hover:text-white
           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current
           transition duration-200 ease-in-out"
           
    style={`
        border-color: ${pageLinkColor};
        color: ${pageLinkColor};

        /* TailwindCSS-Overrides */
        --hover-bg-color: ${pageLinkHoverColorBg}; /* Für hover:bg-[...] */
        --hover-text-color: ${pageLinkHoverColorText}; /* Für hover:text-[...] */
        --focus-ring-color: ${pageLinkColor}; /* Für focus:ring-[...] */
    `}
>
    {text}
</PrismicLink>