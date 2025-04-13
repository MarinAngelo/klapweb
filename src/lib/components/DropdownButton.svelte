<script lang="ts">
    import { PrismicText } from '@prismicio/svelte';

    // Props definieren
    export let item;
    export let headerColor;
    export let headerLinkColor
</script>

<button
    class="font-semibold tracking-tight inline-flex items-center"
    style="color: {headerLinkColor};"
    aria-haspopup="true"
    aria-expanded="false"
>
    <PrismicText field={item.label} />
    <svg
        class="w-4 h-4 ml-1 fill-current"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
    >
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
    </svg>
</button>