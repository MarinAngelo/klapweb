<script lang="ts">
	import { page } from '$app/stores';
	import { asText } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	import Button from '$lib/components/Button.svelte';
	import { _ } from '$lib/stores/i18n';
	import { reveal } from '$lib/actions/reveal';

	export let data;

	$: leistungen = data.leistungen ?? [];
	$: langPrefix = $page.params.lang ? `/${$page.params.lang}` : '';
</script>

<svelte:head>
	<title>{$_('Leistungen')} - {$page.data?.siteName || ''}</title>
	<meta name="description" content={$_('Übersicht unserer Leistungen und Services')} />
</svelte:head>

<Bounded as="section" data-anim-container>
	<div class="space-y-8">
		<div class="text-center">
			<h1 class="h2">{$_('Leistungen')}</h1>
			<p class="text-lg text-muted-foreground mt-4">
				{$_('Entdecken Sie unser Leistungsportfolio')}
			</p>
		</div>

		{#if leistungen.length === 0}
			<div class="text-center py-12">
				<p>{$_('Keine Leistungen verfügbar')}</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-anim-stagger>
				{#each leistungen as leistung, i (leistung.uid)}
					<div
						class="flex flex-col p-6 border border-border rounded-lg hover:shadow-lg transition-shadow duration-200"
						use:reveal={{
							direction: 'up',
							distance: '20px',
							delay: i * 100
						}}
					>
						<h2 class="h3">
							{leistung.label}
						</h2>
						{#if leistung.beschreibung}
							<p class="text-muted-foreground mt-3 line-clamp-2 flex-1">
								{asText(leistung.beschreibung)}
							</p>
						{/if}
						<div class="mt-4">
							<Button
								href="{langPrefix}/leistung/{leistung.uid}"
								text={$_('Mehr erfahren')}
								size="sm"
							/>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</Bounded>

<style>
	:global([data-anim-stagger] > *) {
		opacity: 0;
	}
</style>
