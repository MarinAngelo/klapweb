<script lang="ts">
	import type { PageData } from './$types';
	import { formatDateWithWeekday } from '$lib/utils/formatDate';
	export let data: PageData;

	const formatDate = (datum: string, uhrzeit: string) =>
		formatDateWithWeekday(datum, uhrzeit || null) + (uhrzeit ? ' Uhr' : '');

	type BookingWithOrt = (typeof data.bookings)[number] & {
		ort?: { name: string; adresse: string } | null;
	};
	const formatOrt = (booking: BookingWithOrt): string | null => {
		const adresse = booking.ort?.adresse?.trim();
		return adresse || null;
	};

	const today = new Date().toISOString().slice(0, 10);
	$: upcoming = data.bookings.filter((b) => b.datum >= today);
	$: past = data.bookings.filter((b) => b.datum < today);
</script>

<svelte:head><title>Mein Konto</title></svelte:head>

<div class="admin-container-narrow flex flex-col gap-6">
	<!-- E-Mail-Verifikations-Banner -->
	{#if !data.user.verified}
		<div class="admin-notice admin-notice-warn mb-0 flex items-start gap-3">
			<span class="text-lg leading-snug">⚠️</span>
			<div>
				<p class="text-sm font-semibold">E-Mail-Adresse noch nicht bestätigt</p>
				<p class="mt-1 text-sm">
					Bitte prüfe dein Postfach ({data.user.email}) und klicke auf den Bestätigungslink.
				</p>
			</div>
		</div>
	{/if}

	<!-- Header -->
	<div class="admin-header mb-0">
		<div>
			<h1>Mein Konto</h1>
			<p class="admin-muted mt-1 text-sm">{data.user.name} · {data.user.email}</p>
		</div>
		<form method="POST" action="/konto/abmelden" class="admin-header-actions">
			<button type="submit" class="admin-btn">Abmelden</button>
		</form>
	</div>

	<!-- Bevorstehende Termine -->
	<section class="admin-card mb-0 overflow-hidden p-0 md:p-0">
		<h2 class="border-b border-gray-100 px-5 py-4">Bevorstehende Termine</h2>
		{#if upcoming.length === 0}
			<p class="admin-muted px-5 py-5 text-sm">Keine bevorstehenden Termine.</p>
		{:else}
			<ul class="m-0 list-none p-0">
				{#each upcoming as booking}
					<li class="flex flex-col gap-1 border-b border-gray-100 px-5 py-4 last:border-b-0">
						<span class="font-medium">{booking.titel}</span>
						<span class="admin-muted text-sm">{formatDate(booking.datum, booking.uhrzeit)}</span>
						{#if formatOrt(booking)}
							<span class="admin-muted text-sm">📍 {formatOrt(booking)}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Vergangene Termine -->
	{#if past.length > 0}
		<section class="admin-card mb-0 overflow-hidden p-0 md:p-0">
			<h2 class="admin-muted border-b border-gray-100 px-5 py-4">Vergangene Termine</h2>
			<ul class="m-0 list-none p-0">
				{#each past as booking}
					<li
						class="flex flex-col gap-1 border-b border-gray-100 px-5 py-4 last:border-b-0 text-gray-500"
					>
						<span class="font-medium">{booking.titel}</span>
						<span class="admin-muted text-sm">{formatDate(booking.datum, booking.uhrzeit)}</span>
						{#if formatOrt(booking)}
							<span class="admin-muted text-sm">📍 {formatOrt(booking)}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
