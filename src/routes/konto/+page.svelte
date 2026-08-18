<script lang="ts">
	import type { PageData } from './$types';
	import { formatDateWithWeekday } from '$lib/utils/formatDate';
	export let data: PageData;

	const formatDate = (datum: string, uhrzeit: string) =>
		formatDateWithWeekday(datum, uhrzeit || null) + (uhrzeit ? ' Uhr' : '');

	const today = new Date().toISOString().slice(0, 10);
	$: upcoming = data.bookings.filter((b) => b.datum >= today);
	$: past = data.bookings.filter((b) => b.datum < today);
</script>

<svelte:head><title>Mein Konto</title></svelte:head>

<div style="font-family: sans-serif; min-height: 100vh; background: #f9fafb; padding: 2rem 1rem;">
	<div style="max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem;">
		<!-- E-Mail-Verifikations-Banner -->
		{#if !data.user.verified}
			<div
				style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 0.5rem; padding: 1rem 1.25rem; display: flex; align-items: flex-start; gap: 0.75rem;"
			>
				<span style="font-size: 1.1rem; line-height: 1.4;">⚠️</span>
				<div>
					<p style="margin: 0; font-size: 0.875rem; font-weight: 600; color: #92400e;">
						E-Mail-Adresse noch nicht bestätigt
					</p>
					<p style="margin: 0.25rem 0 0; font-size: 0.8125rem; color: #92400e;">
						Bitte prüfe dein Postfach ({data.user.email}) und klicke auf den Bestätigungslink.
					</p>
				</div>
			</div>
		{/if}

		<!-- Header -->
		<div style="display: flex; align-items: center; justify-content: space-between;">
			<div>
				<h1 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Mein Konto</h1>
				<p style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0;">
					{data.user.name} · {data.user.email}
				</p>
			</div>
			<form method="POST" action="/konto/abmelden">
				<button
					type="submit"
					style="font-size: 0.875rem; color: #6b7280; background: none; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.375rem 0.75rem; cursor: pointer;"
				>
					Abmelden
				</button>
			</form>
		</div>

		<!-- Bevorstehende Termine -->
		<div
			style="background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;"
		>
			<div style="padding: 1rem 1.25rem; border-bottom: 1px solid #f3f4f6;">
				<h2 style="font-size: 1rem; font-weight: 600; margin: 0;">Bevorstehende Termine</h2>
			</div>

			{#if upcoming.length === 0}
				<p style="padding: 1.25rem; font-size: 0.875rem; color: #9ca3af; margin: 0;">
					Keine bevorstehenden Termine.
				</p>
			{:else}
				<ul style="margin: 0; padding: 0; list-style: none;">
					{#each upcoming as booking}
						<li
							style="padding: 1rem 1.25rem; border-bottom: 1px solid #f9fafb; display: flex; flex-direction: column; gap: 0.25rem;"
						>
							<span style="font-weight: 500; font-size: 0.9375rem;">{booking.titel}</span>
							<span style="font-size: 0.875rem; color: #6b7280;"
								>{formatDate(booking.datum, booking.uhrzeit)}</span
							>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Vergangene Termine -->
		{#if past.length > 0}
			<div
				style="background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;"
			>
				<div style="padding: 1rem 1.25rem; border-bottom: 1px solid #f3f4f6;">
					<h2 style="font-size: 1rem; font-weight: 600; margin: 0; color: #9ca3af;">
						Vergangene Termine
					</h2>
				</div>
				<ul style="margin: 0; padding: 0; list-style: none;">
					{#each past as booking}
						<li
							style="padding: 1rem 1.25rem; border-bottom: 1px solid #f9fafb; display: flex; flex-direction: column; gap: 0.25rem; opacity: 0.6;"
						>
							<span style="font-weight: 500; font-size: 0.9375rem;">{booking.titel}</span>
							<span style="font-size: 0.875rem; color: #6b7280;"
								>{formatDate(booking.datum, booking.uhrzeit)}</span
							>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
