<script lang="ts">
	import type { PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { formatDateWithWeekday } from '$lib/utils/formatDate';
	export let data: PageData;

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
</script>

<svelte:head><title>Buchungen</title></svelte:head>

<div class="admin-container">
	<AdminHeader title="Terminverwaltung">
		<form
			method="POST"
			action="?/deleteAll"
			on:submit={(e) => {
				if (!confirm('Alle Buchungen löschen?')) e.preventDefault();
			}}
		>
			<button type="submit" class="admin-btn admin-btn-danger-outline">Alle löschen</button>
		</form>
	</AdminHeader>

	{#if data.blobError}
		<p class="admin-notice admin-notice-error admin-mono">Fehler: {data.blobError}</p>
	{/if}

	<!-- Gebuchte Termine -->
	<section class="admin-card">
		<h2 class="admin-card-title">
			Gebuchte Termine <span class="admin-count">({data.bookings.length})</span>
		</h2>
		{#if data.bookings.length === 0}
			<p class="admin-empty">Noch keine Buchungen.</p>
		{:else}
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							{#each ['Termin', 'Titel', 'Ort', 'Name', 'E-Mail', 'Gebucht am', ''] as col}
								<th>{col}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each data.bookings as b}
							<tr>
								<td class="nowrap">{fmtDate(b.datum, b.uhrzeit, b.endzeit)}</td>
								<td>{b.titel || b.terminId}</td>
								<td class="admin-muted">{getOrtName(b)}</td>
								<td>{b.name ?? '–'}</td>
								<td>{b.email ?? '–'}</td>
								<td class="nowrap admin-muted">
									{new Date(b.bookedAt).toLocaleString('de-CH', {
										day: '2-digit',
										month: '2-digit',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</td>
								<td>
									<form
										method="POST"
										action="?/delete"
										on:submit|preventDefault={(e) => confirmDelete(e, b.titel || b.terminId)}
									>
										<input type="hidden" name="id" value={b.terminId} />
										<button type="submit" class="admin-link-danger text-xs">Löschen</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<!-- Freie Termine -->
	<section class="admin-card">
		<h2 class="admin-card-title">
			Freie Termine <span class="admin-count">({data.freeSlots.length})</span>
		</h2>
		{#if data.freeSlots.length === 0}
			<p class="admin-empty">Keine freien Termine.</p>
		{:else}
			<form method="POST" action="?/cancelSelected" on:submit={confirmBulkCancel}>
				<div class="mb-3 flex flex-wrap items-center gap-3">
					<button
						type="submit"
						disabled={!someFreeSelected}
						class="admin-btn admin-btn-warn admin-btn-sm"
					>
						Ausgewählte sperren ({selectedFreeSlots.length})
					</button>
					<button
						type="button"
						on:click={toggleMobileSelectionMode}
						class="admin-btn admin-btn-sm"
						class:admin-btn-toggle-on={mobileSelectionMode}
					>
						{mobileSelectionMode ? 'Auswahlmodus beenden' : 'Bereich auswählen'}
					</button>
					<span class="admin-muted text-xs">
						{#if mobileSelectionMode && mobileRangeStartIndex === null}
							Startpunkt antippen
						{:else if mobileSelectionMode}
							Endpunkt antippen
						{:else}
							{someFreeSelected ? `${selectedFreeSlots.length} ausgewählt` : 'Keine Auswahl'}
						{/if}
					</span>
				</div>
				<div class="admin-table-wrap">
					<table class="admin-table">
						<thead>
							<tr>
								<th>
									<input
										type="checkbox"
										class="admin-checkbox"
										aria-label="Alle freien Termine auswählen"
										checked={allFreeSelected}
										on:change={(e) => toggleAllFreeSlots(e.currentTarget.checked)}
									/>
								</th>
								{#each ['Datum', 'Von–Bis', 'Titel', 'Dauer', 'Zeitzone', ''] as col}
									<th>{col}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each data.freeSlots as s, i}
								<tr class:admin-row-selected={mobileSelectionMode && mobileRangeStartIndex === i}>
									<td class="nowrap">
										<input
											type="checkbox"
											class="admin-checkbox"
											name="slotId"
											value={s.id}
											aria-label={`Termin ${s.titel} auswählen`}
											bind:group={selectedFreeSlots}
											on:click={(e) => onFreeSlotClick(e, i)}
											on:keydown={(e) => onFreeSlotKeydown(e, i)}
											on:change={() => onFreeSlotChange(i)}
										/>
									</td>
									<td class="nowrap">{formatDateWithWeekday(s.datum, null)}</td>
									<td class="nowrap">{fmtTimeRange(s.uhrzeit, s.endzeit)}</td>
									<td>{s.titel}</td>
									<td class="nowrap">{s.sessionLaenge ? s.sessionLaenge + ' min' : '–'}</td>
									<td class="admin-muted">{s.zeitzone}</td>
									<td>
										<form
											method="POST"
											action="?/cancel"
											on:submit|preventDefault={(e) => confirmCancel(e, s.titel)}
										>
											<input type="hidden" name="id" value={s.id} />
											<button type="submit" class="admin-link-warn text-xs">Sperren</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</form>
		{/if}
	</section>

	<!-- Vergangene Termine -->
	{#if data.pastSlots?.length > 0}
		<section class="admin-card">
			<h2 class="admin-card-title admin-muted">
				Vergangene Termine <span class="admin-count">({data.pastSlots.length})</span>
			</h2>
			<div class="admin-table-wrap">
				<table class="admin-table admin-table-muted">
					<thead>
						<tr>
							{#each ['Datum', 'Von–Bis', 'Titel', 'Dauer'] as col}
								<th>{col}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each data.pastSlots as s}
							<tr>
								<td class="nowrap">{formatDateWithWeekday(s.datum, null)}</td>
								<td class="nowrap">{fmtTimeRange(s.uhrzeit, s.endzeit)}</td>
								<td>{s.titel}</td>
								<td class="nowrap">{s.sessionLaenge ? s.sessionLaenge + ' min' : '–'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	<!-- Gesperrte Termine -->
	{#if data.cancelledSlots.length > 0}
		<section class="admin-card">
			<h2 class="admin-card-title admin-muted">
				Gesperrte Termine <span class="admin-count">({data.cancelledSlots.length})</span>
			</h2>
			<div class="admin-table-wrap">
				<table class="admin-table admin-table-muted">
					<thead>
						<tr>
							{#each ['Datum', 'Von–Bis', 'Titel', 'Dauer', ''] as col}
								<th>{col}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each data.cancelledSlots as s}
							<tr>
								<td class="nowrap line-through">{formatDateWithWeekday(s.datum, null)}</td>
								<td class="nowrap line-through">{fmtTimeRange(s.uhrzeit, s.endzeit)}</td>
								<td class="line-through">{s.titel}</td>
								<td class="nowrap">{s.sessionLaenge ? s.sessionLaenge + ' min' : '–'}</td>
								<td>
									<form method="POST" action="?/uncancel">
										<input type="hidden" name="id" value={s.id} />
										<button type="submit" class="admin-link-success text-xs">Freigeben</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	{#if actionLoading}
		<div class="admin-loading-overlay">
			<div class="admin-loading-spinner"></div>
		</div>
	{/if}
</div>
