<script lang="ts">
	/**
	 * Applies the saved admin colour scheme (light/dark) before the first paint.
	 * Used by the admin layout and in AdminHeader (also covers the agency pages).
	 * Choice: localStorage `klap_admin_theme` (set by AdminThemeToggle), per browser.
	 */
	// Closing tag split up: a literal one would end this <script> block
	const script =
		"<script>try{if(localStorage.getItem('klap_admin_theme')==='dark')" +
		"document.documentElement.dataset.adminTheme='dark'}catch(e){}</scr" +
		'ipt>';
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static inline script, no user data -->
	{@html script}
</svelte:head>
