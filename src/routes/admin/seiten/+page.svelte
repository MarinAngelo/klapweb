<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	const s = data.secret;

	function pageHref(uid: string, lang: string, mainLang = 'de-ch') {
		const prefix = lang === mainLang ? '' : `/${lang}`;
		return `${prefix}/${uid}?admin_secret=${s}`;
	}
</script>

<svelte:head><title>Passwortgeschützte Seiten</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;">
	<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
		<h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">🔒 Passwortgeschützte Seiten</h1>
		<a
			href="/admin/dashboard?secret={s}"
			style="margin-left: auto; font-size: 0.875rem; color: #6b7280; text-decoration: none;"
			>← Dashboard</a
		>
	</div>

	{#if data.pages.length === 0}
		<p style="opacity: 0.5;">Keine passwortgeschützten Seiten gefunden.</p>
	{:else}
		<p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 1.5rem;">
			Links öffnen die Seite direkt ohne Passwortabfrage (Admin-Bypass).
		</p>
		<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
			<thead>
				<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
					<th style="padding: 0.5rem 0.75rem;">Titel</th>
					<th style="padding: 0.5rem 0.75rem;">UID</th>
					<th style="padding: 0.5rem 0.75rem;">Sprache</th>
					<th style="padding: 0.5rem 0.75rem;">Aktion</th>
				</tr>
			</thead>
			<tbody>
				{#each data.pages as p}
					<tr style="border-bottom: 1px solid #f3f4f6;">
						<td style="padding: 0.5rem 0.75rem; font-weight: 600;">{p.title}</td>
						<td
							style="padding: 0.5rem 0.75rem; font-family: monospace; font-size: 0.8rem; opacity: 0.7;"
							>{p.uid}</td
						>
						<td style="padding: 0.5rem 0.75rem; opacity: 0.6;">{p.lang}</td>
						<td style="padding: 0.5rem 0.75rem;">
							<a
								href={pageHref(p.uid, p.lang)}
								target="_blank"
								rel="noopener"
								style="background: #1e2d5a; color: #fff; border-radius: 4px; padding: 3px 10px; font-size: 0.75rem; text-decoration: none; font-weight: 600;"
							>
								Öffnen (bypass) ↗
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
