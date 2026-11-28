<script lang="ts">
	import { page } from '$app/stores';
	import AdminTheme from '$lib/components/admin/AdminTheme.svelte';

	// Login page (/admin) uses the site theme; all other admin pages the neutral admin UI
	$: isLogin = $page.url.pathname === '/admin';
</script>

{#if isLogin}
	<slot />
{:else}
	<!-- Uniform admin UI: neutral, independent of the site theme (classes: app.css › Admin-UI) -->
	<AdminTheme />
	<div class="admin">
		<slot />
	</div>
{/if}
