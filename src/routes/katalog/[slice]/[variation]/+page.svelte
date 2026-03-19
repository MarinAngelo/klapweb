<script lang="ts">
	import { onDestroy } from 'svelte';
	import { components } from '$lib/slices';
	import { theme } from '$lib/stores/theme';
	import { isMobile } from '$lib/stores/isMobile';
	import type { PageData } from './$types';

	export let data: PageData;

	$: Component = components[data.sliceId as keyof typeof components];

	$: bg = $theme.headerBgColor || '#1f2937';
	$: fg = $theme.headerLinkColor || '#e5e7eb';
	$: fgMuted = $theme.headerColor || '#9ca3af';
	$: pageBg = $theme.pageBgColor || '#ffffff';
	$: pageColor = $theme.pageColor || '#111827';

	// Mutable local copy – reset on variation change
	let mockSlice = JSON.parse(JSON.stringify(data.mockSlice));
	let _sliceKey = data.sliceId + '/' + data.variationId;
	$: {
		const key = data.sliceId + '/' + data.variationId;
		if (key !== _sliceKey) {
			_sliceKey = key;
			mockSlice = JSON.parse(JSON.stringify(data.mockSlice));
		}
	}

	function updateField(key: string, value: any) {
		mockSlice = { ...mockSlice, primary: { ...mockSlice.primary, [key]: value } };
	}

	$: hasPanel = (data.functionalFields?.length ?? 0) > 0;

	// Viewport-Simulation
	let viewMode: 'desktop' | 'mobile' = 'desktop';
	$: isMobile.forceSet(viewMode === 'mobile');
	onDestroy(() => isMobile.unlock());

	$: phoneSrc = `/preview/${data.sliceId}/${data.variationId}?bg=${encodeURIComponent(pageBg)}&data=${encodeURIComponent(JSON.stringify(mockSlice))}`;

	$: beschreibung = (data.meta as any)?.Beschreibung as string | undefined;
</script>

<svelte:head><title>{data.sliceName} / {data.variationName} – Katalog</title></svelte:head>

<!-- Äusserer Flex: Content-Spalte + Panel nebeneinander (wie Layout-Sidebar) -->
<div class="flex">

	<!-- Linke Spalte: Tabs, Info, Preview -->
	<div class="flex-1 min-w-0">

		<!-- Tabs + Slice-Info -->
		<div class="flex items-center justify-between px-5 py-2 border-b" style="background-color: {bg}; border-color: {fgMuted}22;">
			<!-- Links: Slice / Variation / Badge -->
			<div class="flex items-center gap-3">
				<span class="font-semibold" style="color: {fg}; font-size: 16px;">{data.sliceName}</span>
				<span style="color: {fgMuted}; opacity: 0.4;">/</span>
				<span style="color: {fg}; font-size: 16px;">{data.variationName}</span>
				{#each Object.entries(data.meta ?? {}).filter(([k]) => k !== 'Beschreibung') as [key, value]}
					<span class="px-2 py-0.5 rounded font-medium" style="font-size: 13px; background-color: {fgMuted}22; color: {fgMuted};">
						{key}: {value}
					</span>
				{/each}
			</div>
			<!-- Rechts: Device-Toggle -->
			<div class="flex items-center gap-1">
				<button
					on:click={() => (viewMode = 'desktop')}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors"
					style="font-size: 13px; background-color: {viewMode === 'desktop' ? fgMuted + '33' : 'transparent'}; color: {viewMode === 'desktop' ? fg : fgMuted};"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M0 21h24"/></svg>
					Laptop
				</button>
				<button
					on:click={() => (viewMode = 'mobile')}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors"
					style="font-size: 13px; background-color: {viewMode === 'mobile' ? fgMuted + '33' : 'transparent'}; color: {viewMode === 'mobile' ? fg : fgMuted};"
				>
					<svg width="14" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/></svg>
					Telefon
				</button>
			</div>
		</div>

		<!-- Info-Leiste: nur Beschreibung (falls vorhanden) -->
		{#if beschreibung}
			<div class="border-b px-5 py-2.5" style="background-color: {bg}; border-color: {fgMuted}22; color: {fgMuted}; font-size: 18px;">
				{beschreibung}
			</div>
		{/if}

		<!-- Preview -->
		<div class="py-8 px-4" style="background-color: {pageColor}08;">
			{#if viewMode === 'mobile'}
				<div class="phone-wrap">
					<div class="phone-frame mx-auto">
						<div class="phone-notch"></div>
						<div class="phone-screen" style="--screen-bg: {pageBg}">
							<iframe
								title="Mobile Vorschau"
								src={phoneSrc}
								style="width: 100%; height: 100%; border: none; display: block;"
							/>
						</div>
						<div class="phone-home"></div>
					</div>
				</div>
			{:else}
				<div class="laptop-wrap mx-auto">
					<div class="laptop-screen-bezel">
						<div class="laptop-cam"></div>
						<div class="laptop-screen" style="--screen-bg: {pageBg}">
							{#key mockSlice}
								{#if Component}
									<svelte:component this={Component} slice={mockSlice} index={0} slices={[mockSlice]} context={{}} />
								{/if}
							{/key}
						</div>
					</div>
					<div class="laptop-chin"></div>
					<div class="laptop-base"></div>
				</div>
			{/if}
			{#if !Component}
				<div class="p-12 text-center text-gray-400 text-sm">
					Kein Component registriert für <code class="font-mono">{data.sliceId}</code>
				</div>
			{/if}
		</div>

	</div><!-- /Content-Spalte -->

	<!-- Funktions-Panel: gleiche Ebene wie Sidebar im Layout -->
	{#if hasPanel}
		<div
			class="w-56 shrink-0 overflow-y-auto"
			style="position: sticky; top: 0; height: 100vh; background-color: {bg}; border-left: 1px solid {fgMuted}22;"
		>
			<div class="px-4 py-3" style="border-bottom: 1px solid {fgMuted}22;">
				<span class="font-semibold tracking-wide" style="color: {fgMuted}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">Funktionen</span>
			</div>
			<div class="px-4 py-4 flex flex-col gap-5">
				{#each data.functionalFields as field}
					{#if field.type === 'Boolean'}
						<label class="flex items-center gap-2.5 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={mockSlice.primary[field.key] ?? field.default_value ?? false}
								on:change={(e) => updateField(field.key, e.currentTarget.checked)}
								class="w-4 h-4 cursor-pointer"
							/>
							<span style="color: {fg}; font-size: 14px;">{field.label}</span>
						</label>
					{:else if field.type === 'Select'}
						<div class="flex flex-col gap-1.5">
							<span style="color: {fgMuted}; font-size: 12px;">{field.label}</span>
							<select
								on:change={(e) => updateField(field.key, e.currentTarget.value)}
								style="background-color: {bg}; color: {fg}; border: 1px solid {fgMuted}44; font-size: 14px; padding: 4px 8px; border-radius: 4px; width: 100%;"
							>
								{#each field.options ?? [] as option}
									<option value={option} selected={mockSlice.primary[field.key] === option}>{option}</option>
								{/each}
							</select>
						</div>
					{:else if field.type === 'Number'}
						<div class="flex flex-col gap-1.5">
							<span style="color: {fgMuted}; font-size: 12px;">{field.label}</span>
							<input
								type="number"
								value={mockSlice.primary[field.key] ?? field.default_value ?? ''}
								placeholder={field.placeholder}
								on:input={(e) => updateField(field.key, Number(e.currentTarget.value))}
								style="background-color: {bg}; color: {fg}; border: 1px solid {fgMuted}44; font-size: 14px; padding: 4px 8px; border-radius: 4px; width: 100%;"
							/>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

</div>

<style>
/* ── Phone Frame ──────────────────────────────────────────────── */
.phone-wrap {
	max-height: 828px;
	overflow-y: auto;
}
.phone-frame {
	width: 390px;
	background: #1c1c1e;
	border-radius: 50px;
	padding: 16px;
	overflow: hidden;
	box-shadow:
		0 0 0 1.5px #3a3a3c,
		0 0 0 3px rgba(255,255,255,0.04),
		0 40px 80px rgba(0,0,0,0.55),
		0 8px 24px rgba(0,0,0,0.3);
	position: relative;
}
.phone-notch {
	position: absolute;
	top: 26px;
	left: 50%;
	transform: translateX(-50%);
	width: 120px;
	height: 30px;
	background: #1c1c1e;
	border-radius: 20px;
	z-index: 10;
}
.phone-screen {
	background: var(--screen-bg, white);
	border-radius: 36px;
	overflow: hidden;
	aspect-ratio: 9 / 19.5;
}
.phone-home {
	width: 140px;
	height: 5px;
	background: #4a4a4c;
	border-radius: 3px;
	margin: 12px auto 0;
}

/* ── Laptop Frame ─────────────────────────────────────────────── */
.laptop-wrap {
	max-width: 900px;
	width: 100%;
}
.laptop-screen-bezel {
	background: #1a1a1c;
	border-radius: 12px 12px 0 0;
	padding: 22px 16px 0;
	position: relative;
	box-shadow:
		0 0 0 1.5px #3a3a3c,
		inset 0 0 0 1px rgba(255,255,255,0.04);
}
.laptop-cam {
	width: 8px;
	height: 8px;
	background: #3a3a3c;
	border-radius: 50%;
	margin: 0 auto 10px;
}
.laptop-screen {
	background: var(--screen-bg, white);
	border-radius: 4px 4px 0 0;
	overflow: hidden;
	aspect-ratio: 16 / 10;
	overflow-y: auto;
}
.laptop-chin {
	height: 22px;
	background: #1a1a1c;
	border-bottom: 1px solid #2c2c2e;
}
.laptop-base {
	height: 14px;
	background: linear-gradient(to bottom, #2c2c2e, #222224);
	border-radius: 0 0 6px 6px;
	margin: 0 -40px;
	box-shadow: 0 6px 20px rgba(0,0,0,0.45);
}
</style>
