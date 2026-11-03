<script lang="ts">
	import LoginCard from '$lib/components/auth/LoginCard.svelte';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import RememberMe from '$lib/components/auth/RememberMe.svelte';
	import CancelLogin from '$lib/components/auth/CancelLogin.svelte';
	import SvgIcons from '$lib/components/SvgIcons.svelte';
	import { _ } from '$lib/stores/i18n';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	const tools = [
		{
			title: 'Agency Gating Editor',
			description: 'Plan und Feature-Schalter dieser Website',
			href: '/agency/gating',
			icon: '🎛️'
		},
		{
			title: 'Feldreferenz – Beschreibungen',
			description: 'Erklärungen zu den Prismic-Feldern für die Website-Betreiber pflegen',
			href: '/agency/feldreferenz',
			icon: '📝'
		}
	];

	const links = [
		{
			title: 'Prismic-Feldreferenz',
			description: 'So sehen die Website-Betreiber die Referenz',
			href: '/prismic-feldreferenz',
			icon: '📖'
		},
		{
			title: 'Chat-Bot Wissensbasis',
			description: 'Generierte Wissensbasis zum Kopieren nach Prismic (Einstellungen → Chat-Bot)',
			href: '/agency/wissensbasis',
			icon: '🤖'
		},
		{
			title: 'Admin-Bereich',
			description: 'Verwaltung der Website (eigene Anmeldung)',
			href: '/admin',
			icon: '🔐'
		}
	];
</script>

<svelte:head><title>{$_('Agency Dashboard')}</title></svelte:head>

{#if !data.authenticated}
	<!-- Login in the look of the site (same as the agency tools) -->
	<LoginCard title={$_('Agency Dashboard')} action="?/login">
		<p class="m-0 text-sm">{$_('Bitte geben Sie das Agentur-Passwort ein:')}</p>
		<input
			id="secret"
			name="secret"
			type="password"
			aria-label={$_('Passwort')}
			placeholder={$_('Passwort eingeben')}
			autocomplete="current-password"
			required
			class="form-input"
		/>
		<RememberMe />
		{#if form && 'error' in form && form.error}
			<p role="alert" class="m-0 text-sm text-red-600">{$_(String(form.error))}</p>
		{/if}
		<button type="submit" class="btn-solid rounded px-6 py-2 text-sm font-medium">
			{$_('Anmelden')}
		</button>
		<CancelLogin />
	</LoginCard>
{:else}
	<!-- Neutral admin UI, like /admin/dashboard -->
	<div class="admin">
		<div class="admin-container-narrow">
			<AdminHeader title={$_('Agency Dashboard')} back={false}>
				<form method="POST" action="?/logout">
					<button type="submit" class="admin-btn">{$_('Abmelden')}</button>
				</form>
			</AdminHeader>

			<div class="grid gap-3">
				{#each tools as tool}
					<a
						href={tool.href}
						class="admin-card mb-0 flex items-center gap-4 text-inherit no-underline transition-shadow hover:shadow-md"
					>
						<span class="text-3xl leading-none">{tool.icon}</span>
						<div class="flex-1">
							<div class="font-semibold">{$_(tool.title)}</div>
							<div class="admin-muted mt-0.5 text-sm">{$_(tool.description)}</div>
						</div>
						<SvgIcons name="right" size="1.25rem" color="#9ca3af" />
					</a>
				{/each}
			</div>

			<h2 class="mb-3 mt-8">{$_('Links')}</h2>
			<div class="grid gap-3">
				{#each links as link}
					<a
						href={link.href}
						target="_blank"
						rel="noopener"
						class="admin-card mb-0 flex items-center gap-4 text-inherit no-underline transition-shadow hover:shadow-md"
					>
						<span class="text-3xl leading-none">{link.icon}</span>
						<div class="flex-1">
							<div class="font-semibold">{$_(link.title)}</div>
							<div class="admin-muted mt-0.5 text-sm">{$_(link.description)}</div>
						</div>
						<span class="admin-muted" aria-hidden="true">↗</span>
					</a>
				{/each}
			</div>
		</div>
	</div>
{/if}
