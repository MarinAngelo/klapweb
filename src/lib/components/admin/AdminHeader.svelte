<script lang="ts">
	import { _ } from '$lib/stores/i18n';

	/** Page title (already translated) */
	export let title: string;
	/** Optional number shown next to the title, e.g. entries */
	export let count: number | undefined = undefined;
	/** Show "← Dashboard" link above the title */
	export let back = true;
</script>

{#if back}
	<a href="/admin/dashboard" class="admin-back">← {$_('Dashboard')}</a>
{/if}
<div class="admin-header">
	<h1>
		{title}
		{#if count != null}<span class="admin-count">({count})</span>{/if}
	</h1>
	{#if $$slots.default}
		<div class="admin-header-actions"><slot /></div>
	{/if}
</div>
