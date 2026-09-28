<script lang="ts">
	// Prismic-Vorschau: rendert dieselbe Ansicht wie /newsletter/[uid]
	import Page from '../../../newsletter/[uid]/+page.svelte';
	export let data: any;
</script>

<Page {data} />
