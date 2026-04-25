<script lang="ts">
	import { _ } from '$lib/stores/i18n';

	export let bookedRanges: Array<{ von: string; bis: string; zimmer: string[] }> = [];
	export let allZimmerNamen: string[] = [];
	export let von = '';
	export let bis = '';
	export let textColor = '#000000';
	export let ganzeRessource = false; // wenn true, blockiert auch Teilbuchungen
	export let partialGeklickt = false;

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayStr = today.toISOString().slice(0, 10);

	let viewYear = today.getFullYear();
	let viewMonth = today.getMonth();

	function prevMonth() {
		if (viewMonth === 0) { viewMonth = 11; viewYear--; } else viewMonth--;
	}
	function nextMonth() {
		if (viewMonth === 11) { viewMonth = 0; viewYear++; } else viewMonth++;
	}

	function daysInMonth(year: number, month: number) {
		return new Date(year, month + 1, 0).getDate();
	}
	function firstWeekday(year: number, month: number) {
		return (new Date(year, month, 1).getDay() + 6) % 7;
	}
	function dateStr(year: number, month: number, day: number) {
		return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	}

	// ── Reaktive Status-Map — wird neu berechnet wenn bookedRanges oder allZimmerNamen sich ändern
	type Status = 'free' | 'partial' | 'full';
	let statusMap: Map<string, Status> = new Map();

	$: {
		const map = new Map<string, Status>();
		// Build a set of all dates that appear in any booking
		const allDates = new Set<string>();
		for (const r of bookedRanges) {
			const cur = new Date(r.von + 'T12:00:00Z');
			const end = new Date(r.bis + 'T12:00:00Z');
			while (cur <= end) {
				allDates.add(cur.toISOString().slice(0, 10));
				cur.setUTCDate(cur.getUTCDate() + 1);
			}
		}
		for (const ds of allDates) {
			const covering = bookedRanges.filter((r) => ds >= r.von && ds <= r.bis);
			// Booking without room info = whole-resource → full
			if (covering.some((r) => r.zimmer.length === 0)) {
				map.set(ds, 'full');
				continue;
			}
			const bookedNames = new Set(covering.flatMap((r) => r.zimmer));
			if (allZimmerNamen.length > 0 && allZimmerNamen.every((n) => bookedNames.has(n))) {
				map.set(ds, 'full');
			} else {
				map.set(ds, 'partial');
			}
		}
		statusMap = map;
	}

	function getStatus(ds: string): Status {
		return statusMap.get(ds) ?? 'free';
	}

	function getBelegteNamen(ds: string): string[] {
		const covering = bookedRanges.filter((r) => ds >= r.von && ds < r.bis);
		return [...new Set(covering.flatMap((r) => r.zimmer))];
	}

	function isPast(ds: string) { return ds < todayStr; }
	function isSelected(ds: string) {
		if (!von) return false;
		if (!bis) return ds === von;
		return ds >= von && ds < bis;
	}
	function isRangeStart(ds: string) { return ds === von; }
	function isRangeEnd(ds: string) { return !!bis && ds === bis; }
	function isToday(ds: string) { return ds === todayStr; }

	function isBlocked(ds: string): boolean {
		const s = getStatus(ds);
		return s === 'full' || (ganzeRessource && s === 'partial');
	}

	function handleDayClick(ds: string) {
		if (isPast(ds)) return;
		if (isBlocked(ds)) {
			if (ganzeRessource && getStatus(ds) === 'partial') partialGeklickt = true;
			return;
		}
		if (von && !bis && ds === von) {
			von = ''; bis = '';
		} else if (!von || (von && bis)) {
			von = ds; bis = '';
		} else if (ds <= von) {
			von = ds; bis = '';
		} else {
			const cur = new Date(von + 'T12:00:00Z');
			cur.setUTCDate(cur.getUTCDate() + 1);
			const endD = new Date(ds + 'T12:00:00Z');
			let crossesBlocked = false;
			while (cur < endD) {
				if (isBlocked(cur.toISOString().slice(0, 10))) { crossesBlocked = true; break; }
				cur.setUTCDate(cur.getUTCDate() + 1);
			}
			if (crossesBlocked) { von = ds; bis = ''; } else { bis = ds; }
		}
	}

	let hoverDate = '';
	function isHover(ds: string) {
		if (!von || bis || !hoverDate || hoverDate <= von) return false;
		return ds > von && ds <= hoverDate;
	}

	function buildMonth(year: number, month: number) {
		const total = daysInMonth(year, month);
		const offset = firstWeekday(year, month);
		const cells: Array<{ day: number | null; ds: string }> = [];
		for (let i = 0; i < offset; i++) cells.push({ day: null, ds: '' });
		for (let d = 1; d <= total; d++) cells.push({ day: d, ds: dateStr(year, month, d) });
		return cells;
	}

	$: month1 = { year: viewYear, month: viewMonth };
	$: month2 = viewMonth === 11 ? { year: viewYear + 1, month: 0 } : { year: viewYear, month: viewMonth + 1 };
	$: cells1 = buildMonth(month1.year, month1.month);
	$: cells2 = buildMonth(month2.year, month2.month);

	// Force cell re-render when statusMap or selection changes
	$: allCells = { cells1, cells2, statusMap, von, bis, hoverDate };

	const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
	const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
		'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
</script>

<div class="select-none" style="color: {textColor};">
	<!-- Navigation -->
	<div class="flex items-center justify-between mb-4">
		<button type="button" on:click={prevMonth}
			class="px-3 py-1 rounded text-sm opacity-60 hover:opacity-100 transition-opacity"
			style="border: 1px solid {textColor}33;">‹</button>
		<span class="text-sm font-medium opacity-70">
			{monthNames[month1.month]} {month1.year} – {monthNames[month2.month]} {month2.year}
		</span>
		<button type="button" on:click={nextMonth}
			class="px-3 py-1 rounded text-sm opacity-60 hover:opacity-100 transition-opacity"
			style="border: 1px solid {textColor}33;">›</button>
	</div>

	<!-- Two months -->
	{#key allCells}
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
		{#each [{ m: month1, cells: cells1 }, { m: month2, cells: cells2 }] as { m, cells }}
			<div>
				<p class="text-sm font-semibold text-center mb-2">{monthNames[m.month]} {m.year}</p>
				<div class="grid grid-cols-7 mb-1">
					{#each weekdays as wd}
						<div class="text-center text-xs py-1">{wd}</div>
					{/each}
				</div>
				<div class="grid grid-cols-7">
					{#each cells as cell}
						{#if cell.day === null}
							<div></div>
						{:else}
							{#if true}
								{@const status = getStatus(cell.ds)}
								{@const past = isPast(cell.ds)}
								{@const sel = isSelected(cell.ds)}
								{@const start = isRangeStart(cell.ds)}
								{@const end = isRangeEnd(cell.ds)}
								{@const hover = isHover(cell.ds)}
								{@const blocked = isBlocked(cell.ds)}
								{@const disabled = blocked || past}
								{@const belegteNamen = status === 'partial' ? getBelegteNamen(cell.ds) : []}
								{@const freieNamen = status === 'partial' ? allZimmerNamen.filter(n => !belegteNamen.includes(n)) : []}
								<button
									type="button"
									on:click={() => handleDayClick(cell.ds)}
									on:mouseenter={() => { if (!disabled) hoverDate = cell.ds; }}
									on:mouseleave={() => { hoverDate = ''; }}
									{disabled}
									class="h-8 text-xs rounded transition-colors"
									style="
										{status === 'full' ? 'background:#e29898;color:#5c1f1f;cursor:default;' : ''}
										{status === 'partial' ? `background:#dcfce7;color:#166534;cursor:${ganzeRessource ? 'default' : 'pointer'};` : ''}
										{past && status === 'free' ? 'opacity:0.3;cursor:default;' : ''}
										{(sel || start || end || hover) && !blocked ? 'background:#2563eb;color:#fff;cursor:pointer;' : ''}
										{isToday(cell.ds) && !sel && status === 'free' ? 'font-weight:700;' : ''}
									"
									title={
										status === 'full' ? $_('Voll belegt') :
										status === 'partial' ? `${$_('Teilweise belegt')} · ${$_('Frei')}: ${freieNamen.join(', ')}` :
										''
									}
								>
									{cell.day}
								</button>
							{/if}
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>
	{/key}

	<!-- Legend -->
	<div class="flex flex-wrap gap-4 mt-4 text-xs opacity-60">
		<span class="flex items-center gap-1">
			<span class="inline-block w-3 h-3 rounded" style="background:#e29898;"></span>
			{$_('Voll belegt')}
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block w-3 h-3 rounded" style="background:#dcfce7;"></span>
			{$_('Teilweise belegt')}
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block w-3 h-3 rounded" style="background:#2563eb;"></span>
			{$_('Gewählter Zeitraum')}
		</span>
	</div>
</div>
