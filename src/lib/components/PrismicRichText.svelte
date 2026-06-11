<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { PrismicRichText } from '@prismicio/svelte';
	import Heading1 from './PrismicRichText/Heading1.svelte';
	import Heading2 from './PrismicRichText/Heading2.svelte';
	import Heading3 from './PrismicRichText/Heading3.svelte';
	import Paragraph from './PrismicRichText/Paragraph.svelte';
	import OList from './PrismicRichText/OList.svelte';
	import OListItem from './PrismicRichText/OListItem.svelte';
	import List from './PrismicRichText/List.svelte';
	import ListItem from './PrismicRichText/ListItem.svelte';
	import Preformatted from './PrismicRichText/Preformatted.svelte';
	import Strong from './PrismicRichText/Strong.svelte';
	import Hyperlink from './PrismicRichText/Hyperlink.svelte';
	import Label from './PrismicRichText/Label.svelte';
	import { variables } from '$lib/stores/variables';
	import { replaceTokens } from '$lib/utils/replaceTokens';

	export let field: ComponentProps<PrismicRichText>['field'];
	export let components: ComponentProps<PrismicRichText>['components'] = {};

	$: processedField = field ? replaceTokens(field as any, $variables) as typeof field : field;
</script>

{#if field && field.length > 0}
<PrismicRichText
	field={processedField}
	components={{
		heading1: Heading1,
		heading2: Heading2,
		heading3: Heading3,
		paragraph: Paragraph,
		oList: OList,
		oListItem: OListItem,
		list: List,
		listItem: ListItem,
		preformatted: Preformatted,
		strong: Strong,
		hyperlink: Hyperlink,
		label: Label,
		...components
	}}
/>
{/if}
