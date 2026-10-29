<script lang="ts">
	import { enhance } from '$app/forms';
	import LoginCard from '$lib/components/auth/LoginCard.svelte';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import RememberMe from '$lib/components/auth/RememberMe.svelte';
	import CancelLogin from '$lib/components/auth/CancelLogin.svelte';
	import { _ } from '$lib/stores/i18n';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let query = '';
	let saving = false;
	$: q = query.trim().toLowerCase();
	const matches = (f: any, groupName: string) =>
		!q ||
		[groupName, f.label, f.field, f.de, f.en].some((v) =>
			String(v ?? '')
				.toLowerCase()
				.includes(q)
		);
</script>

<svelte:head><title>{$_('Feldreferenz – Beschreibungen')}</title></svelte:head>

{#if !data.authenticated}
	<!-- Login in the look of the site (same as /agency/gating) -->
	<LoginCard title={$_('Feldreferenz – Beschreibungen')} action="?/login">
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
	<!-- Editor: neutral admin UI, like /agency/gating -->
	<div class="admin">
		<div class="admin-container">
			<AdminHeader title={$_('Feldreferenz – Beschreibungen')} back={false}>
				<a href="/agency/gating" class="admin-btn">{$_('Gating-Editor')}</a>
				<a href="/prismic-feldreferenz" target="_blank" rel="noopener" class="admin-btn"
					>{$_('Referenz ansehen')} ↗</a
				>
				<form method="POST" action="?/logout">
					<button type="submit" class="admin-btn">{$_('Abmelden')}</button>
				</form>
			</AdminHeader>

			<p class="admin-intro">
				{$_(
					'Beschreibungen für die Prismic-Feldreferenz der Website-Betreiber. Leer = automatische Beschreibung (grau). Gilt für alle Kunden-Branches: auf main pflegen und committen.'
				)}
			</p>
			<p class="admin-hint">
				{data.described} / {data.count}
				{$_('Felder beschrieben')}
			</p>

			{#if !data.canEdit}
				<p class="admin-notice admin-notice-warn">
					{$_('Bearbeiten nur auf dem lokalen Dev-Server möglich (die Datei wird committet).')}
				</p>
			{/if}
			{#if form && 'saved' in form}
				<p class="admin-notice admin-notice-ok">{$_('Gespeichert.')}</p>
			{/if}

			<input
				type="search"
				class="admin-input mb-4"
				placeholder={$_('Suchen …')}
				bind:value={query}
			/>

			<form
				method="POST"
				action="?/save"
				use:enhance={() => {
					saving = true;
					return async ({ update }) => {
						await update({ reset: false });
						saving = false;
					};
				}}
			>
				{#each data.groups as group (group.name)}
					{@const visible = group.fields.filter((f) => matches(f, group.name))}
					<section class="admin-card" class:hidden={visible.length === 0}>
						<h2 class="admin-card-title">
							{group.name}
							<span class="admin-badge admin-badge-blue">{group.elementType}</span>
						</h2>
						<div class="flex flex-col gap-4">
							{#each group.fields as f (f.key)}
								<div class="flex flex-col gap-2" class:hidden={!matches(f, group.name)}>
									<div class="flex flex-wrap items-baseline gap-x-3">
										<span class="font-semibold">{f.label}</span>
										<span class="admin-mono admin-muted">{f.field}</span>
										<span class="admin-muted text-xs">{f.type}</span>
									</div>
									<div class="grid gap-2 md:grid-cols-2">
										<label class="flex flex-col gap-1 text-xs">
											<span class="admin-muted">DE</span>
											<textarea
												name="de-ch:{f.key}"
												rows="2"
												class="admin-input"
												placeholder={String(f.auto)}
												disabled={!data.canEdit}>{f.de}</textarea
											>
										</label>
										<label class="flex flex-col gap-1 text-xs">
											<span class="admin-muted">EN</span>
											<textarea
												name="en-us:{f.key}"
												rows="2"
												class="admin-input"
												placeholder={$_('Leer = deutsche Beschreibung')}
												disabled={!data.canEdit}>{f.en}</textarea
											>
										</label>
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/each}

				{#if data.canEdit}
					<div class="sticky bottom-0 bg-white py-3">
						<button class="admin-btn admin-btn-dark" disabled={saving}
							>{saving ? $_('Wird gespeichert…') : $_('Speichern')}</button
						>
					</div>
				{/if}
			</form>
		</div>
	</div>
{/if}
