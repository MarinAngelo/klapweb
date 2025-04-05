<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import clsx from 'clsx';

	import Bounded from './Bounded.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;
	export let layout: Content.LayoutDocument;
	console.log('Header', { settings, navigation, layout });
	const bannerTop = layout.data?.banner_top || false;
</script>

<Bounded
	tag="header"
	yPadding="sm"
	class={clsx('bg-orange-600 opacity-55 z-50', { 'absolute inset-x-0 top-0': bannerTop })}
>
	<!-- Beinhaltet nur den Text nicht die ganze Kopfzeile -->
	<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 leading-none">
		<a href="/" class="text-xl font-semibold tracking-tight">
			<PrismicText field={settings.data.siteTitle} />
		</a>
		<nav>
			<ul class="flex flex-wrap gap-6 md:gap-10">
				{#each navigation.data?.links as item}
					<li class="font-semibold tracking-tight text-slate-800">
						<PrismicLink field={item.link}>
							<PrismicText field={item.label} />
						</PrismicLink>
					</li>
				{/each}
			</ul>
		</nav>
	</div>
</Bounded>
