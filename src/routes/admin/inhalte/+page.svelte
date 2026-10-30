<script lang="ts">
	import type { PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';
	export let data: PageData;

	// Document in the Prismic editor (Page Builder)
	const editorHref = (id: string) =>
		`https://${data.repositoryName}.prismic.io/builder/pages/${id}`;

	$: total = data.missing.length + data.links.length;
</script>

<svelte:head><title>{$_('Inhalte prüfen')}</title></svelte:head>

<div class="admin-container">
	<AdminHeader title="🔎 {$_('Inhalte prüfen')}" count={total} />

	{#if data.error}
		<p class="admin-notice admin-notice-error">
			{$_('Prismic ist nicht erreichbar, die Prüfung konnte nicht laufen.')}
		</p>
	{:else if total === 0}
		<p class="admin-notice admin-notice-ok">
			{$_('Alles in Ordnung: keine fehlenden Übersetzungen und keine Link-Probleme.')}
		</p>
	{/if}

	{#if data.links.length}
		<section class="admin-card">
			<h2>{$_('Link- und Token-Probleme')} ({data.links.length})</h2>
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>{$_('Dokument')}</th>
							<th>{$_('Sprache')}</th>
							<th>{$_('Problem')}</th>
							<th>{$_('Lösung')}</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.links as p}
							<tr>
								<td>
									<span class="font-semibold">{p.doc.title}</span>
									<span class="admin-mono admin-muted">{p.doc.type}</span>
								</td>
								<td class="admin-muted">{p.doc.lang}</td>
								{#if p.kind === 'relative'}
									<td>
										{$_('Web-Link ohne «/» am Anfang')}: <span class="admin-mono">{p.url}</span>
									</td>
									<td>
										{$_('«/» voranstellen oder als Link auf ein Prismic-Dokument setzen')}:
										<span class="admin-mono">/{p.url}</span>
									</td>
								{:else if p.kind === 'map_point'}
									<td>
										{$_('Kartenpunkt nicht erkannt')}: <span class="admin-mono">{p.url}</span>
									</td>
									<td>{$_('OSM-Link oder Koordinaten eintragen, z.B. 47.3769, 8.5417')}</td>
								{:else if p.kind === 'unknown_token'}
									<td>
										{$_('Unbekannter Token')}: <span class="admin-mono">{p.token}</span>
									</td>
									<td>
										{#if p.suggestion}
											{$_('Meintest du')} <span class="admin-mono">{p.suggestion}</span>?
										{:else}
											{$_('Token-Namen prüfen oder im Dokument Variablen anlegen')}
										{/if}
									</td>
								{:else}
									<td>
										{$_('Verlinkt die Version in der Hauptsprache')}:
										<span class="admin-mono">{p.target}</span>
									</td>
									<td>
										{$_('Übersetzung verlinken')}: <span class="admin-mono">{p.suggestion}</span>
									</td>
								{/if}
								<td>
									<a
										href={editorHref(p.doc.id)}
										target="_blank"
										rel="noopener"
										class="admin-btn admin-btn-dark admin-btn-sm">{$_('In Prismic öffnen')} ↗</a
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	{#if data.missing.length}
		<section class="admin-card">
			<h2>{$_('Fehlende Übersetzungen')} ({data.missing.length})</h2>
			<p class="admin-intro">
				{$_(
					'Besucher sehen dafür einen Hinweis und die Version in der Hauptsprache. In Prismic: Dokument öffnen → Sprache wählen → «Create translation» → veröffentlichen.'
				)}
			</p>
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>{$_('Dokument')}</th>
							<th>{$_('Fehlt in')}</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.missing as m}
							<tr>
								<td>
									<span class="font-semibold">{m.doc.title}</span>
									<span class="admin-mono admin-muted">{m.doc.type}/{m.doc.uid}</span>
								</td>
								<td>
									{#each m.lacking as l}<span class="admin-badge admin-badge-orange">{l}</span>
									{/each}
								</td>
								<td>
									<a
										href={editorHref(m.doc.id)}
										target="_blank"
										rel="noopener"
										class="admin-btn admin-btn-dark admin-btn-sm">{$_('In Prismic öffnen')} ↗</a
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>
