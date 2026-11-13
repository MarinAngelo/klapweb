<script lang="ts">
	/**
	 * Drop-in for PrismicLink from @prismicio/svelte (same props, slot, on:click) with our
	 * link resolution: URLs for ressource/leistung documents and the /<lang> prefix in
	 * secondary languages (see resolveLinkHref in $lib/utils/documentLinks.ts).
	 */
	import { asLinkAttrs } from '@prismicio/client';
	import { linkHref } from '$lib/stores/linkContext';

	export let field: any = undefined;
	export let document: any = undefined;
	export let rel: string | ((args: any) => string | undefined) | undefined = undefined;

	$: linkAttrs = asLinkAttrs(field ?? document, {
		rel: typeof rel === 'function' ? rel : undefined
	});
	$: resolvedRel = typeof rel === 'string' ? rel : linkAttrs.rel;
	$: href = $linkHref(field ?? document) ?? linkAttrs.href;
</script>

<a {...linkAttrs} rel={resolvedRel} {href} on:click {...$$restProps}>
	<slot>{field?.text ?? ''}</slot>
</a>
