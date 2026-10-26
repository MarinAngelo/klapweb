<script lang="ts">
	import SvgIcons from '$lib/components/SvgIcons.svelte';
	import { _ } from '$lib/stores/i18n';
	import type { PageData } from './$types';
	export let data: PageData;

	const allSections = [
		{
			id: 'rechnungen',
			title: 'Rechnungen',
			description: 'Rechnungen erstellen, bearbeiten, versenden (E-Commerce + Manuell)',
			href: `/admin/rechnungen`,
			icon: '📄'
		},
		{
			id: 'kunden',
			title: 'Kunden',
			description: 'Bestellungen und Kundendaten einsehen, neue Kunden erfassen',
			href: `/admin/kunden`,
			icon: '👥'
		},
		{
			id: 'buchungen',
			title: 'Terminverwaltung',
			description: 'Buchungen anzeigen, löschen, Termine sperren',
			href: `/admin/buchungen`,
			icon: '📅'
		},
		{
			id: 'ressource-buchungen',
			title: 'Ressource-Buchungen',
			description: 'Ferienhäuser, Räume etc. — Buchungen einsehen und löschen',
			href: `/admin/ressource-buchungen`,
			icon: '🏠'
		},
		{
			id: 'aufgaben',
			title: 'Aufgaben',
			description: 'Angenommene Aufgaben bestätigen und als erledigt markieren',
			href: `/admin/aufgaben`,
			icon: '✅'
		},
		{
			id: 'event-anmeldungen',
			title: 'Event Anmeldungen',
			description: 'Anmeldungen aus Event-Checkouts einsehen, gruppiert nach Event',
			href: `/admin/event-anmeldungen`,
			icon: '🎟️'
		},
		{
			id: 'newsletter',
			title: 'Newsletter',
			description: 'Info-Mails aus Prismic an alle Kunden senden',
			href: `/admin/newsletter`,
			icon: '✉️'
		},
		{
			id: 'chatbot',
			title: 'Chat-Bot',
			description: 'Fragen und geschätzte KI-Kosten pro Tag und Monat',
			href: `/admin/chatbot`,
			icon: '💬'
		},
		{
			id: 'seiten',
			title: 'Passwortgeschützte Seiten',
			description: 'Alle geschützten Seiten anzeigen und ohne Passwortabfrage öffnen',
			href: `/admin/seiten`,
			icon: '🔒'
		}
	];

	$: sections = allSections.filter((s) => !data.disabledSections.includes(s.id));
</script>

<svelte:head><title>{$_('Admin Dashboard')}</title></svelte:head>

<div class="admin-container-narrow">
	<div class="admin-header">
		<h1>{$_('Dashboard')}</h1>
		<form method="POST" action="/admin?/logout" class="admin-header-actions">
			<button type="submit" class="admin-btn">{$_('Abmelden')}</button>
		</form>
	</div>

	<div class="grid gap-3">
		{#each sections as section}
			<a
				href={section.href}
				class="admin-card mb-0 flex items-center gap-4 text-inherit no-underline transition-shadow hover:shadow-md"
			>
				<span class="text-3xl leading-none">{section.icon}</span>
				<div class="flex-1">
					<div class="font-semibold">{$_(section.title)}</div>
					<div class="admin-muted mt-0.5 text-sm">{$_(section.description)}</div>
				</div>
				<SvgIcons name="right" size="1.25rem" color="#9ca3af" />
			</a>
		{/each}
	</div>
</div>
