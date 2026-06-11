<script lang="ts">
    import { headingAnchor } from '$lib/actions/headingAnchor';
</script>

<h2 use:headingAnchor class="font-semibold leading-tight tracking-tight md:leading-tight mb-7 mt-12 first:mt-0 last:mb-0 {$$props.class ?? ''}">
    <slot />
</h2>
