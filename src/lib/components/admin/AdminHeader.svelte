<script lang="ts">
	import { _ } from '$lib/stores/i18n';

	/** Page title (already translated) */
	export let title: string;
	/** Optional number shown next to the title, e.g. entries */
	export let count: number | undefined = undefined;
	/** Show "← Dashboard" link above the title */
	export let back = true;
	/** Target of the back link (agency pages: /agency) */
	export let backHref = '/admin/dashboard';
	/** Show "Zur Website" button (admin pages have no site header) */
	export let home = true;
</script>

{#if back}
	<a href={backHref} class="admin-back">← {$_('Dashboard')}</a>
{/if}
<div class="admin-header">
	<h1>
		{title}
		{#if count != null}<span class="admin-count">({count})</span>{/if}
	</h1>
	<div class="admin-header-actions">
		{#if home}
			<a href="/" class="admin-btn">⌂ {$_('Zur Website')}</a>
		{/if}
		<slot />
	</div>
</div>
