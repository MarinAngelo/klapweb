<script lang="ts">
    import { PrismicLink } from '@prismicio/svelte';
    import { theme } from '$lib/stores/theme';
    import { get } from 'svelte/store';

    export let link: any;
    export let text: string = 'Mehr erfahren';

    const pageLinkColor = get(theme).pageLinkColor;
    const pageLinkHoverColor = get(theme).pageLinkHoverColor;
    const pageBgColor = get(theme).pageBgColor;
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
        --hover-bg-color: ${pageLinkColor}; /* Für hover:bg-[...] */
        --hover-text-color: ${pageBgColor}; /* Für hover:text-[...] */
        --focus-ring-color: ${pageLinkColor}; /* Für focus:ring-[...] */
    `}
>
    {text}
</PrismicLink>

<style>
    :global(.hover\:bg-current:hover) {
        background-color: var(--hover-bg-color) !important;
    }

    :global(.hover\:text-white:hover) {
        color: var(--hover-text-color) !important;
    }

    :global(.focus\:ring-current:focus) {
        --tw-ring-color: var(--focus-ring-color) !important;
        box-shadow: 0 0 0 calc(2px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color), var(--tw-ring-shadow, 0 0 #0000);
    }
</style>