<script lang="ts">
	// Prismic-Vorschau: rendert dieselbe Seite wie /[[lang]]
	import Page from '../../[[lang=lang]]/+page.svelte';
	export let data;
</script>

<Page {data} />
