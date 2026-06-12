<script lang="ts">
	import { asLink, type RTLinkNode } from '@prismicio/client';

	export let node: RTLinkNode;

	const href = asLink(node.data as any); // node.data ist das eigentliche Link-Feld
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
