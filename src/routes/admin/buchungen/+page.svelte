<script lang="ts">
	import type { PageData } from './$types';
	import Button from '$lib/components/Button.svelte';
	import { formatDateWithWeekday } from '$lib/utils/formatDate';
	export let data: PageData;

	import { page } from '$app/stores';

	$: secret = $page.url.searchParams.get('secret') ?? '';

	function confirmDelete(e: SubmitEvent, titel: string) {
		if (!confirm(`Buchung "${titel}" wirklich löschen (Termin wird wieder frei)?`)) return;
		actionLoading = true;
		(e.currentTarget as HTMLFormElement).submit();
	}

	function confirmCancel(e: SubmitEvent, titel: string) {
		if (!confirm(`Termin "${titel}" sperren (wird nicht mehr buchbar)?`)) return;
		actionLoading = true;
		(e.currentTarget as HTMLFormElement).submit();
	}

	const fmtDate = (datum: string, uhrzeit: string, endzeit?: string) => {
		const date = formatDateWithWeekday(datum, uhrzeit || null);
		return endzeit ? `${date}–${endzeit} Uhr` : date;
	};

	const fmtTimeRange = (uhrzeit: string, endzeit?: string) =>
		uhrzeit && endzeit ? `${uhrzeit}–${endzeit} Uhr` : uhrzeit ? `${uhrzeit} Uhr` : '–';

	const getOrtName = (b: unknown) => (b as { ortName?: string }).ortName || '–';

	let selectedFreeSlots: string[] = [];
	let lastFreeSlotIndex: number | null = null;
	let mobileSelectionMode = false;
	let mobileRangeStartIndex: number | null = null;
	let actionLoading = false;

	function isFreeSlotSelected(index: number): boolean {
		const id = data.freeSlots[index]?.id;
		return !!id && selectedFreeSlots.includes(id);
	}

	function setFreeSlotRange(startIndex: number, endIndex: number, checked: boolean) {
		const start = Math.min(startIndex, endIndex);
		const end = Math.max(startIndex, endIndex);
		const next = new Set(selectedFreeSlots);
		for (let i = start; i <= end; i++) {
			const id = data.freeSlots[i]?.id;
			if (!id) continue;
			if (checked) next.add(id);
			else next.delete(id);
		}
		selectedFreeSlots = [...next];
	}

	function onFreeSlotChange(index: number) {
		if (mobileSelectionMode) {
			if (mobileRangeStartIndex === null) {
				mobileRangeStartIndex = index;
				lastFreeSlotIndex = index;
				return;
			}
			const checked = isFreeSlotSelected(mobileRangeStartIndex);
			setFreeSlotRange(mobileRangeStartIndex, index, checked);
			lastFreeSlotIndex = index;
			mobileRangeStartIndex = null;
			mobileSelectionMode = false;
			return;
		}
		lastFreeSlotIndex = index;
	}

	function onFreeSlotClick(e: MouseEvent, index: number) {
		if (!e.shiftKey || mobileSelectionMode || lastFreeSlotIndex === null) return;
		e.preventDefault();
		e.stopPropagation();
		const checked = isFreeSlotSelected(lastFreeSlotIndex);
		setFreeSlotRange(lastFreeSlotIndex, index, checked);
		lastFreeSlotIndex = index;
	}

	function onFreeSlotKeydown(e: KeyboardEvent, index: number) {
		if (e.key !== ' ' || !e.shiftKey || mobileSelectionMode || lastFreeSlotIndex === null) return;
		e.preventDefault();
		const checked = isFreeSlotSelected(lastFreeSlotIndex);
		setFreeSlotRange(lastFreeSlotIndex, index, checked);
		lastFreeSlotIndex = index;
	}

	function toggleMobileSelectionMode() {
		mobileSelectionMode = !mobileSelectionMode;
		mobileRangeStartIndex = null;
	}

	function toggleAllFreeSlots(checked: boolean) {
		selectedFreeSlots = checked ? data.freeSlots.map((s) => s.id) : [];
		lastFreeSlotIndex = null;
		mobileRangeStartIndex = null;
	}

	function confirmBulkCancel(e: SubmitEvent) {
		if (!selectedFreeSlots.length) {
			e.preventDefault();
			return;
		}
		if (!confirm(`${selectedFreeSlots.length} Termine sperren (werden nicht mehr buchbar)?`)) {
			e.preventDefault();
		}
	}

	$: allFreeSelected =
		data.freeSlots.length > 0 && selectedFreeSlots.length === data.freeSlots.length;
	$: someFreeSelected = selectedFreeSlots.length > 0;

	const tdStyle = 'padding: 0.5rem 0.75rem;';
	const tdNowrap = tdStyle + ' white-space: nowrap;';
</script>

<svelte:head><title>Buchungen</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 1100px; margin: 0 auto;">
	<div class="page-header">
		<h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">Terminverwaltung</h1>
		<div class="header-actions">
			<Button
				href="/admin/dashboard?secret={secret}"
				text="← Dashboard"
				color="#374151"
				bgColor="transparent"
				hoverColor="#111827"
				hoverBgColor="transparent"
				size="sm"
				mb={false}
			/>
			<form
				method="POST"
				action="?/deleteAll&secret={secret}"
				on:submit={(e) => {
					if (!confirm('Alle Buchungen löschen?')) e.preventDefault();
				}}
			>
				<input type="hidden" name="secret" value={secret} />
				<Button
					text="Alle löschen"
					color="#dc2626"
					bgColor="transparent"
					hoverColor="#991b1b"
					hoverBgColor="transparent"
					size="sm"
					mb={false}
				/>
			</form>
		</div>
	</div>

	{#if data.blobError}
		<p style="color: red; font-family: monospace; font-size: 0.8rem; margin-bottom: 1rem;">
			Fehler: {data.blobError}
		</p>
	{/if}

	<!-- Gebuchte Termine -->
	<h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem;">
		Gebuchte Termine ({data.bookings.length})
	</h2>

	{#if data.bookings.length === 0}
		<p style="opacity: 0.5; margin-bottom: 2rem;">Noch keine Buchungen.</p>
	{:else}
		<div style="overflow-x: auto; margin-bottom: 2.5rem;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each ['Termin', 'Titel', 'Ort', 'Name', 'E-Mail', 'Gebucht am', ''] as col}
							<th style={tdNowrap}>{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.bookings as b}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style={tdNowrap}>{fmtDate(b.datum, b.uhrzeit, b.endzeit)}</td>
							<td style={tdStyle}>{b.titel || b.terminId}</td>
							<td style="{tdStyle} opacity: 0.7;">{getOrtName(b)}</td>
							<td style={tdStyle}>{b.name ?? '–'}</td>
							<td style={tdStyle}>{b.email ?? '–'}</td>
							<td style="{tdNowrap} opacity: 0.6;">
								{new Date(b.bookedAt).toLocaleString('de-CH', {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</td>
							<td style={tdStyle}>
								<form
									method="POST"
									action="?/delete&secret={secret}"
									on:submit|preventDefault={(e) => confirmDelete(e, b.titel || b.terminId)}
								>
									<input type="hidden" name="id" value={b.terminId} />
									<button
										type="submit"
										style="color: #dc2626; font-size: 0.75rem; background: none; border: none; cursor: pointer; padding: 0;"
									>
										Löschen
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Freie Termine -->
	<h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem;">
		Freie Termine ({data.freeSlots.length})
	</h2>

	{#if data.freeSlots.length === 0}
		<p style="opacity: 0.5; margin-bottom: 2rem;">Keine freien Termine.</p>
	{:else}
		<form
			method="POST"
			action="?/cancelSelected&secret={secret}"
			on:submit={confirmBulkCancel}
			style="margin-bottom: 2.5rem;"
		>
			<div
				style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap;"
			>
				<button
					type="submit"
					disabled={!someFreeSelected}
					style="font-size: 0.8rem; background: #d97706; color: #fff; border: none; border-radius: 4px; cursor: pointer; padding: 4px 10px; font-weight: 600; opacity: {someFreeSelected
						? 1
						: 0.45};"
				>
					Ausgewählte sperren ({selectedFreeSlots.length})
				</button>
				<button
					type="button"
					on:click={toggleMobileSelectionMode}
					style="font-size: 0.8rem; background: {mobileSelectionMode
						? '#0369a1'
						: '#e0f2fe'}; color: {mobileSelectionMode
						? '#fff'
						: '#0369a1'}; border: 1px solid #7dd3fc; border-radius: 4px; cursor: pointer; padding: 4px 10px; font-weight: 600;"
				>
					{mobileSelectionMode ? 'Auswahlmodus beenden' : 'Bereich auswählen'}
				</button>
				<span style="font-size: 0.8rem; color: #6b7280;">
					{#if mobileSelectionMode && mobileRangeStartIndex === null}
						Startpunkt antippen
					{:else if mobileSelectionMode}
						Endpunkt antippen
					{:else}
						{someFreeSelected ? `${selectedFreeSlots.length} ausgewählt` : 'Keine Auswahl'}
					{/if}
				</span>
			</div>
			<div style="overflow-x: auto;">
				<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
					<thead>
						<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
							<th style={tdNowrap}>
								<input
									type="checkbox"
									aria-label="Alle freien Termine auswählen"
									checked={allFreeSelected}
									on:change={(e) => toggleAllFreeSlots(e.currentTarget.checked)}
								/>
							</th>
							{#each ['Datum', 'Von–Bis', 'Titel', 'Dauer', 'Zeitzone', ''] as col}
								<th style={tdNowrap}>{col}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each data.freeSlots as s, i}
							<tr
								style="border-bottom: 1px solid #e5e7eb; {mobileSelectionMode &&
								mobileRangeStartIndex === i
									? 'background: #e0f2fe;'
									: ''}"
							>
								<td style={tdNowrap}>
									<input
										type="checkbox"
										name="slotId"
										value={s.id}
										aria-label={`Termin ${s.titel} auswählen`}
										bind:group={selectedFreeSlots}
										on:click={(e) => onFreeSlotClick(e, i)}
										on:keydown={(e) => onFreeSlotKeydown(e, i)}
										on:change={() => onFreeSlotChange(i)}
									/>
								</td>
								<td style="{tdNowrap} opacity: 0.8;">{formatDateWithWeekday(s.datum, null)}</td>
								<td style="{tdNowrap} opacity: 0.8;">{fmtTimeRange(s.uhrzeit, s.endzeit)}</td>
								<td style={tdStyle}>{s.titel}</td>
								<td style={tdNowrap}>{s.sessionLaenge ? s.sessionLaenge + ' min' : '–'}</td>
								<td style="{tdStyle} opacity: 0.6;">{s.zeitzone}</td>
								<td style={tdStyle}>
									<form
										method="POST"
										action="?/cancel&secret={secret}"
										on:submit|preventDefault={(e) => confirmCancel(e, s.titel)}
									>
										<input type="hidden" name="id" value={s.id} />
										<button
											type="submit"
											style="color: #d97706; font-size: 0.75rem; background: none; border: none; cursor: pointer; padding: 0;"
										>
											Sperren
										</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</form>
	{/if}

	<!-- Vergangene Termine -->
	{#if data.pastSlots?.length > 0}
		<h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; opacity: 0.5;">
			Vergangene Termine ({data.pastSlots.length})
		</h2>
		<div style="overflow-x: auto; margin-bottom: 2.5rem;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; opacity: 0.5;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each ['Datum', 'Von–Bis', 'Titel', 'Dauer'] as col}
							<th style={tdNowrap}>{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.pastSlots as s}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style={tdNowrap}>{formatDateWithWeekday(s.datum, null)}</td>
							<td style={tdNowrap}>{fmtTimeRange(s.uhrzeit, s.endzeit)}</td>
							<td style={tdStyle}>{s.titel}</td>
							<td style={tdNowrap}>{s.sessionLaenge ? s.sessionLaenge + ' min' : '–'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Gesperrte Termine -->
	{#if data.cancelledSlots.length > 0}
		<h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; opacity: 0.6;">
			Gesperrte Termine ({data.cancelledSlots.length})
		</h2>
		<div style="overflow-x: auto;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; opacity: 0.7;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each ['Datum', 'Von–Bis', 'Titel', 'Dauer', ''] as col}
							<th style={tdNowrap}>{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.cancelledSlots as s}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style="{tdNowrap} text-decoration: line-through;"
								>{formatDateWithWeekday(s.datum, null)}</td
							>
							<td style="{tdNowrap} text-decoration: line-through;"
								>{fmtTimeRange(s.uhrzeit, s.endzeit)}</td
							>
							<td style="{tdStyle} text-decoration: line-through;">{s.titel}</td>
							<td style={tdNowrap}>{s.sessionLaenge ? s.sessionLaenge + ' min' : '–'}</td>
							<td style={tdStyle}>
								<form method="POST" action="?/uncancel&secret={secret}">
									<input type="hidden" name="id" value={s.id} />
									<button
										type="submit"
										style="color: #059669; font-size: 0.75rem; background: none; border: none; cursor: pointer; padding: 0;"
									>
										Freigeben
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if actionLoading}
		<div class="admin-loading-overlay">
			<div class="admin-loading-spinner"></div>
		</div>
	{/if}
</div>

<style>
	.page-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.header-actions {
		margin-left: auto;
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	@media (max-width: 640px) {
		.page-header {
			align-items: flex-start;
			flex-wrap: wrap;
		}

		.header-actions {
			margin-left: 0;
			flex: 0 0 100%;
			justify-content: flex-start;
			flex-wrap: wrap;
		}
	}

	.admin-loading-overlay {
		position: fixed;
		inset: 0;
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.admin-loading-spinner {
		width: 3rem;
		height: 3rem;
		border: 4px solid #e5e7eb;
		border-top-color: #1e2d5a;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
