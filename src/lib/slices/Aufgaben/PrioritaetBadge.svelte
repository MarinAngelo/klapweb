<script lang="ts">
	import { _ } from '$lib/stores/i18n';

	/** 'Hoch' | 'Mittel' | 'Gering' (Prismic select value) */
	export let prioritaet: string | undefined;

	$: isHigh = prioritaet === 'Hoch';
</script>

{#if prioritaet}
	<span
		class="inline-block shrink-0 rounded-full border px-2 py-0.5 text-xs font-normal tracking-normal align-middle"
		class:font-semibold={isHigh}
		class:opacity-60={!isHigh}
		style="border-color: currentColor;"
		title={$_('Priorität')}
	>
		{$_(prioritaet)}
	</span>
{/if}
