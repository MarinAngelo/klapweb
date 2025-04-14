<script lang="ts">
	import type { Content } from '@prismicio/client';

	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	import Bounded from '$lib/components/Bounded.svelte';
	import { PrismicLink, PrismicText } from '@prismicio/svelte';

	export let slice: Content.FormSlice;
	console.log('🚀 ~ slice:', slice);
</script>

<Bounded
	as="section"
	style="background-color: {get(theme).pageBgColor}; color: {get(theme).pageColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
		<div>
			<h2>
				{slice.primary.form_title}
			</h2>
		</div>
		<div>
			
		</div>
	</div>
</Bounded>
