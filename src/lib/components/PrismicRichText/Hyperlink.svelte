<script lang="ts">
	import { asLink } from '@prismicio/helpers';
	import type { RTLinkNode } from '@prismicio/client';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	export let node: RTLinkNode;

	const { pageLinkColor, pageLinkHoverColor } = get(theme);

	let isHover = false;

	const href = asLink(node.data as any); // node.data ist das eigentliche Link-Feld
</script>

<a
	href={href}
	target={node.data && 'target' in node.data ? node.data.target : undefined}
	rel={node.data && typeof node.data === 'object' && 'target' in node.data && node.data.target === '_blank' ? 'noopener noreferrer' : undefined}
	on:mouseenter={() => (isHover = true)}
	on:mouseleave={() => (isHover = false)}
	class="underline decoration-1 underline-offset-2 transition-colors duration-200 italic"
	style="color: {isHover ? pageLinkHoverColor : pageLinkColor};"
>
	<slot />
</a>
