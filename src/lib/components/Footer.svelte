<script lang="ts">
    import { theme } from '$lib/stores/theme';
    import { get } from 'svelte/store';

    const { headerColor, bgColor, bgOpacity } = get(theme);
</script>

<footer
    style="background-color: {bgColor}; opacity: {bgOpacity}; color: {headerColor};"
>
    <div class=background-color>
        <p>hello</p>
    </div>
</footer>