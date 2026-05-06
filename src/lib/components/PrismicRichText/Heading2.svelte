<script lang="ts">
	export let node: any = undefined;
    import Heading from '../Heading.svelte';
</script>

<Heading tag="h2" class="mb-7 mt-12 first:mt-0 last:mb-0">
    <slot />
</Heading>