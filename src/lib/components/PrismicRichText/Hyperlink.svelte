<script lang="ts">
	import { asLink } from '@prismicio/helpers';
	import type { RTLinkNode } from '@prismicio/client';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	export let node: RTLinkNode;

	const { pageLinkColor, pageLinkHoverColorText } = get(theme);

	let isHover = false;

	const href = asLink(node); // erzeugt z. B. https://example.com
</script>

<a
	href={href}
	target={node.data?.target}
	rel={node.data?.target === '_blank' ? 'noopener noreferrer' : undefined}
	on:mouseenter={() => (isHover = true)}
	on:mouseleave={() => (isHover = false)}
	class="underline decoration-1 underline-offset-2 transition-colors duration-200"
	style="color: {isHover ? pageLinkHoverColorText : pageLinkColor};"
>
	<slot />
</a>
