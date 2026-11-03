<script lang="ts">
	// Prismic-Vorschau: rendert dieselbe Seite wie /[[lang]]/[uid]
	import Page from '../../../[[lang=lang]]/[uid]/+page.svelte';
	export let data: any;
</script>

<Page {data} />
