<script lang="ts">
	import type { PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	export let data: PageData;

	// Logged-in admins open protected pages without password (admin session cookie)
	function pageHref(uid: string, lang: string, mainLang = 'de-ch') {
		const prefix = lang === mainLang ? '' : `/${lang}`;
		return `${prefix}/${uid}`;
	}
</script>

<svelte:head><title>Passwortgeschützte Seiten</title></svelte:head>

<div class="admin-container">
	<AdminHeader title="🔒 Passwortgeschützte Seiten" count={data.pages.length} />

	<section class="admin-card">
		{#if data.pages.length === 0}
			<p class="admin-empty">Keine passwortgeschützten Seiten gefunden.</p>
		{:else}
			<p class="admin-intro">Links öffnen die Seite direkt ohne Passwortabfrage (Admin-Bypass).</p>
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>Titel</th>
							<th>UID</th>
							<th>Sprache</th>
							<th>Aktion</th>
						</tr>
					</thead>
					<tbody>
						{#each data.pages as p}
							<tr>
								<td class="font-semibold">{p.title}</td>
								<td class="admin-mono admin-muted">{p.uid}</td>
								<td class="admin-muted">{p.lang}</td>
								<td>
									<a
										href={pageHref(p.uid, p.lang)}
										target="_blank"
										rel="noopener"
										class="admin-btn admin-btn-dark admin-btn-sm"
									>
										Öffnen (bypass) ↗
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
