<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { theme } from '$lib/stores/theme';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: currentSlice = $page.params.slice;
	$: currentVariation = $page.params.variation;

	$: bg = $theme.headerBgColor || '#1f2937';
	$: fg = $theme.headerLinkColor || '#e5e7eb';
	$: fgHover = $theme.headerLinkHoverColor || '#ffffff';
	$: fgMuted = $theme.headerColor || '#9ca3af';
	$: activeBg = fgHover + '22';

	let selectedPlan = 'individuell';

	$: plansMap = Object.fromEntries(data.plans.map((p) => [p.id, p]));

	function getPlanChain(planId: string): string[] {
		const chain: string[] = [planId];
		let current = plansMap[planId];
		while (current?.extends) {
			chain.push(current.extends);
			current = plansMap[current.extends];
		}
		return chain;
	}

	$: planChain = getPlanChain(selectedPlan);

	$: filteredSlices = data.katalogSlices
		.map((slice) => ({
			...slice,
			variations: slice.variations.filter(
				(v: { id: string; name: string; requiredPlan: string | null }) =>
					!v.requiredPlan || planChain.includes(v.requiredPlan)
			)
		}))
		.filter((slice) => slice.variations.length > 0);

	function onSelectChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		if (val) goto(val);
	}
</script>

<div>
	<!-- Top-Bar: Seitentitel -->
	<div style="background-color: {bg}; border-bottom: 1px solid {fgMuted}33;">
		<div class="px-6 py-2 flex justify-start" style="border-bottom: 1px solid {fgMuted}22;">
			<a
				href="/"
				class="flex items-center gap-1.5 transition-opacity hover:opacity-80"
				style="color: {fgMuted}; font-size: 16px;"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg
				>
				Zurück
			</a>
		</div>
	</div>

	<!-- Mobile: Dropdown-Nav (ausserhalb sticky, damit nativer Select korrekt öffnet) -->
	<div
		class="md:hidden px-4 py-3"
		style="background-color: {bg}; border-bottom: 1px solid {fgMuted}22;"
	>
		<!-- Plan-Auswahl Mobile -->
		<select
			bind:value={selectedPlan}
			class="w-full rounded px-3 py-2 mb-2"
			style="background-color: {bg}; color: {fg}; border: 1px solid {fgMuted}44; font-size: 16px;"
		>
			{#each data.plans as plan}
				<option value={plan.id} style="background-color: {fg}; color: {bg};">{plan.label}</option>
			{/each}
		</select>
		<select
			on:change={onSelectChange}
			class="w-full rounded px-3 py-2"
			style="background-color: {bg}; color: {fg}; border: 1px solid {fgMuted}44; font-size: 16px;"
		>
			<option value="" disabled selected style="background-color: {fg}; color: {bg};">Elemente auswählen</option>
			{#each filteredSlices as slice}
				<optgroup label={slice.name} style="background-color: {fg}; color: {bg};">
					{#each slice.variations as variation}
						{@const path = `/katalog/${slice.dirName}/${variation.id}`}
						<option value={path} style="background-color: {fg}; color: {bg};">{slice.name} – {variation.name}</option>
					{/each}
				</optgroup>
			{/each}
		</select>
	</div>

	<div class="flex w-full" style="min-height: calc(100vh - 4rem);">
		<!-- Sidebar: nur Desktop -->
		<nav
			class="hidden md:block w-64 shrink-0 overflow-y-auto"
			style="position: sticky; top: 0; height: 100vh; background-color: {bg}; border-right: 1px solid {fgMuted}22;"
		>
			<a
				href="/katalog"
				class="flex items-center px-4 py-3 transition-opacity hover:opacity-80"
				style="border-bottom: 1px solid {fgMuted}33;"
			>
				<span class="tracking-wider opacity-60" style="color: {fg}; font-size: 20px;"
					>Inhalts-Elemente</span
				>
			</a>

			<!-- Plan-Auswahl -->
			<div class="px-4 py-3" style="border-bottom: 1px solid {fgMuted}22;">
				<div class="flex flex-col gap-1">
					<span style="color: {fgMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;">Plan</span>
					<select
						bind:value={selectedPlan}
						class="w-full rounded px-2 py-1.5"
						style="background-color: {fgMuted}18; color: {fg}; border: 1px solid {fgMuted}33; font-size: 14px;"
					>
						{#each data.plans as plan}
							<option value={plan.id} style="background-color: {fg}; color: {bg};">{plan.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="pb-8">
				{#each filteredSlices as slice}
					<div class="mt-3">
						<div
							class="px-4 py-1 font-semibold tracking-wide"
							style="color: {fgMuted}; font-size: 16px;"
						>
							{slice.name}
						</div>
						{#each slice.variations as variation}
							{@const isActive =
								currentSlice === slice.dirName && currentVariation === variation.id}
							<a
								href="/katalog/{slice.dirName}/{variation.id}"
								class="flex items-center gap-2 px-5 py-1 transition-colors"
								style="font-size: 16px; color: {isActive
									? fgHover
									: fg}; background-color: {isActive ? activeBg : 'transparent'};"
							>
								<span style="color: {fgMuted}; opacity: 0.5;">›</span>
								{variation.name}
							</a>
						{/each}
					</div>
				{/each}
			</div>
		</nav>

		<!-- Content -->
		<div class="flex-1 min-w-0 overflow-x-hidden">
			<slot />
		</div>
	</div>
</div>
