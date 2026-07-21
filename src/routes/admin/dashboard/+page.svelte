<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	const s = data.secret;

	const sections = [
		{
			title: 'Rechnungen',
			description: 'Rechnungen erstellen, bearbeiten, versenden (E-Commerce + Manuell)',
			href: `/admin/rechnungen?secret=${s}`,
			icon: '📄'
		},
		{
			title: 'Kunden',
			description: 'Bestellungen und Kundendaten einsehen, neue Kunden erfassen',
			href: `/admin/kunden?secret=${s}`,
			icon: '👥'
		},
		{
			title: 'Terminverwaltung',
			description: 'Buchungen anzeigen, löschen, Termine sperren',
			href: `/admin/buchungen?secret=${s}`,
			icon: '📅'
		},
		{
			title: 'Ressource-Buchungen',
			description: 'Ferienhäuser, Räume etc. — Buchungen einsehen und löschen',
			href: `/admin/ressource-buchungen?secret=${s}`,
			icon: '🏠'
		},
		{
			title: 'Gating Editor',
			description: 'Pläne, Features und Slice-Gates in gating.json verwalten',
			href: `/admin/gating?secret=${s}`,
			icon: '⚙️'
		},
		{
			title: 'Aufgaben',
			description: 'Angenommene Aufgaben bestätigen und als erledigt markieren',
			href: `/admin/aufgaben?secret=${s}`,
			icon: '✅'
		}
	];
</script>

<svelte:head><title>Admin Dashboard</title></svelte:head>

<div style="font-family: sans-serif; min-height: 100vh; background: #f9fafb; padding: 3rem 1.5rem;">
	<div style="max-width: 600px; margin: 0 auto;">
		<h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 2rem;">Dashboard</h1>

		<div style="display: grid; gap: 1rem;">
			{#each sections as section}
				<a
					href={section.href}
					style="display: flex; align-items: center; gap: 1rem; background: white; padding: 1.25rem 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-decoration: none; color: inherit; transition: box-shadow 0.15s;"
					on:mouseenter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
					on:mouseleave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)')}
				>
					<span style="font-size: 1.75rem; line-height: 1;">{section.icon}</span>
					<div>
						<div style="font-weight: 600; font-size: 1rem;">{section.title}</div>
						<div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.125rem;">{section.description}</div>
					</div>
					<span style="margin-left: auto; color: #9ca3af; font-size: 1.25rem;">→</span>
				</a>
			{/each}
		</div>
	</div>
</div>
