<script lang="ts">
	/** Switches the admin UI between light and dark (see AdminTheme.svelte, app.css › Admin-UI) */
	import { onMount } from 'svelte';
	import { _ } from '$lib/stores/i18n';

	const KEY = 'klap_admin_theme';
	let dunkel = false;

	onMount(() => {
		dunkel = document.documentElement.dataset.adminTheme === 'dark';
	});

	function umschalten() {
		dunkel = !dunkel;
		if (dunkel) document.documentElement.dataset.adminTheme = 'dark';
		else delete document.documentElement.dataset.adminTheme;
		try {
			if (dunkel) localStorage.setItem(KEY, 'dark');
			else localStorage.removeItem(KEY);
		} catch {
			// Storage blocked (private window): the choice only lasts for this page view
		}
	}
</script>

<button
	type="button"
	class="admin-btn"
	on:click={umschalten}
	aria-pressed={dunkel}
	title={dunkel ? $_('Helles Design') : $_('Dunkles Design')}
>
	<span aria-hidden="true">{dunkel ? '☀' : '☾'}</span>
	{dunkel ? $_('Hell') : $_('Dunkel')}
</button>
