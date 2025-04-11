<script lang="ts">
    import { PrismicLink, PrismicText } from '@prismicio/svelte';

    // Props definieren
    export let item;
    export let subItems;
    export let headerColor;
</script>

<li class="relative group">
    <button
        class="font-semibold tracking-tight header-color inline-flex items-center"
        style="--my-header-color: {headerColor};"
        aria-haspopup="true"
        aria-expanded="false"
    >
        <PrismicText field={item.label} />
        <svg
            class="w-4 h-4 ml-1 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
        >
            <path
                d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
            />
        </svg>
    </button>

    <ul
        class="absolute left-0 mt-0 hidden w-48 bg-white text-slate-700 shadow-lg group-hover:block z-10 rounded py-1"
    >
        {#each subItems as dropdownItem}
            <li>
                <PrismicLink
                    field={dropdownItem.link}
                    class="block px-4 py-2 text-sm hover:bg-slate-100"
                >
                    <PrismicText field={dropdownItem.label} />
                </PrismicLink>
            </li>
        {/each}
    </ul>
</li>