<script lang="ts">
	import type { RTLinkNode } from '@prismicio/client';
	import { linkHref } from '$lib/stores/linkContext';

	export let node: RTLinkNode;

	// node.data is the link field; ressource/leistung URLs + /<lang> prefix via linkHref
	$: href = $linkHref(node.data) ?? undefined;
</script>

<a
	{href}
	target={node.data && 'target' in node.data ? node.data.target : undefined}
	rel={node.data &&
	typeof node.data === 'object' &&
	'target' in node.data &&
	node.data.target === '_blank'
		? 'noopener noreferrer'
		: undefined}
	class="underline decoration-1 underline-offset-2 transition-colors duration-200 italic"
>
	<slot />
</a>

<style>
	a {
		color: var(--page-link-color);
	}
	a:hover {
		color: var(--page-link-hover-color);
	}
</style>
