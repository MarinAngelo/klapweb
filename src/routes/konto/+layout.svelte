<script lang="ts">
	import { page } from '$app/stores';

	// Login page uses the site theme (LoginCard, like /admin); the account pages the neutral UI kit
	$: isLogin = $page.url.pathname === '/konto/anmelden';
</script>

{#if isLogin}
	<slot />
{:else}
	<!-- Customer account: same neutral UI kit as the admin area (classes: app.css › Admin-UI) -->
	<div class="admin">
		<slot />
	</div>
{/if}
