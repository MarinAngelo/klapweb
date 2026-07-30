<script lang="ts">
	import { onDestroy } from 'svelte';
	import { components } from '$lib/slices';
	import { theme } from '$lib/stores/theme';
	import { isMobile } from '$lib/stores/isMobile';
	import { _ } from '$lib/stores/i18n';
	import type { PageData } from './$types';

	export let data: PageData;

	$: Component = components[data.sliceId as keyof typeof components];

	$: bg = $theme.headerBgColor || '#1f2937';
	$: fg = $theme.headerLinkColor || '#e5e7eb';
	$: fgMuted = $theme.headerColor || '#9ca3af';
	$: pageBg = $theme.pageBgColor || '#ffffff';
	$: pageColor = $theme.pageColor || '#111827';
	$: previewBg = data.previewBg ?? pageBg;
	$: previewColor = data.previewColor ?? pageColor;

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

	function buildImageField(url: string) {
		if (!url) return { url: '', dimensions: null, alt: null, copyright: null, edit: null };
		return {
			url,
			dimensions: { width: 1200, height: 800 },
			alt: null,
			copyright: null,
			edit: { x: 0, y: 0, zoom: 1, background: 'transparent' }
		};
	}

	$: hasPanel = (data.functionalFields?.length ?? 0) > 0;

	let viewMode: 'desktop' | 'mobile' = 'desktop';
	$: isMobile.forceSet(viewMode === 'mobile');
	onDestroy(() => isMobile.unlock());

	$: beschreibung = (data.meta as any)?.Beschreibung as string | undefined;
</script>

<svelte:head
	><title>{$_(data.sliceName)} / {$_(data.variationName)} – {$_('Slice-Katalog')}</title
	></svelte:head
>

<!-- Äusserer Flex: Mobile vertikal, Desktop horizontal -->
<div class="flex flex-col md:flex-row">
	<!-- Linke Spalte: Tabs, Info, Preview -->
	<div class="flex-1 min-w-0">
		<!-- Tabs + Slice-Info -->
		<div
			class="flex items-center justify-between px-5 py-2 border-b"
			style="background-color: {bg}; border-color: {fgMuted}22;"
		>
			<!-- Links: Slice / Variation / Badge -->
			<div class="flex items-center gap-3">
				<span class="font-semibold" style="color: {fg}; font-size: 16px;">{$_(data.sliceName)}</span
				>
				<span style="color: {fgMuted}; opacity: 0.4;">/</span>
				<span style="color: {fg}; font-size: 16px;">{$_(data.variationName)}</span>
				{#each Object.entries(data.meta ?? {}).filter(([k]) => k !== 'Beschreibung' && k !== 'BeschreibungEn' && k !== 'Paket') as [key, value]}
					<span
						class="px-2 py-0.5 rounded font-medium"
						style="font-size: 13px; background-color: {fgMuted}22; color: {fgMuted};"
					>
						{key}: {value}
					</span>
				{/each}
			</div>
			<!-- Rechts: Device-Toggle -->
			<div class="hidden md:flex items-center gap-1">
				<button
					on:click={() => (viewMode = 'desktop')}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors"
					style="font-size: 13px; background-color: {viewMode === 'desktop'
						? fgMuted + '33'
						: 'transparent'}; color: {viewMode === 'desktop' ? fg : fgMuted};"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M0 21h24" /></svg
					>
					{$_('Laptop')}
				</button>
				<button
					on:click={() => (viewMode = 'mobile')}
					class="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors"
					style="font-size: 13px; background-color: {viewMode === 'mobile'
						? fgMuted + '33'
						: 'transparent'}; color: {viewMode === 'mobile' ? fg : fgMuted};"
				>
					<svg
						width="14"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><rect x="5" y="2" width="14" height="20" rx="2" /><circle
							cx="12"
							cy="18"
							r="1"
							fill="currentColor"
							stroke="none"
						/></svg
					>
					{$_('Telefon')}
				</button>
			</div>
		</div>

		<!-- Info-Leiste: nur Beschreibung (falls vorhanden) -->
		{#if beschreibung}
			<details class="border-b group" style="background-color: {bg}; border-color: {fgMuted}22;">
				<summary
					class="px-5 py-2.5 cursor-pointer list-none flex items-center gap-2"
					style="color: {fgMuted}; font-size: 14px;"
				>
					<svg
						class="shrink-0 transition-transform group-open:rotate-90"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg
					>
					{$_('Beschreibung')}
				</summary>
				<div class="px-5 pb-3 pt-1" style="color: {fgMuted}; font-size: 16px;">
					{beschreibung}
				</div>
			</details>
		{/if}

		<!-- Preview -->
		<div
			style="background-color: {previewBg}; color: {previewColor}; {data.previewBg
				? `--page-bg-color: ${previewBg}; --page-color: ${previewColor};`
				: ''}"
		>
			<div
				class={viewMode === 'mobile' ? 'preview-mobile' : ''}
				style={viewMode === 'mobile' ? 'max-width: 390px; margin: 0 auto;' : ''}
			>
				{#key mockSlice}
					{#if Component}
						<svelte:component
							this={Component}
							slice={mockSlice}
							index={0}
							slices={[mockSlice]}
							context={{}}
						/>
					{:else}
						<div class="p-12 text-center text-gray-400 text-sm">
							{$_('Kein Component registriert für')} <code class="font-mono">{data.sliceId}</code>
						</div>
					{/if}
				{/key}
			</div>
		</div>
	</div>
	<!-- /Content-Spalte -->

	<!-- Funktions-Panel: Mobile unter Slice, Desktop als Sidebar -->
	{#if hasPanel}
		<div
			class="shrink-0 overflow-y-auto md:w-56 md:sticky md:top-0 md:h-screen mt-8 md:mt-0 border-t md:border-t-0 md:border-l"
			style="background-color: {bg}; border-color: {fgMuted}22;"
		>
			<div class="px-4 py-3" style="border-bottom: 1px solid {fgMuted}22;">
				<span
					class="font-semibold tracking-wide"
					style="color: {fgMuted}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;"
					>{$_('Funktionen')}</span
				>
			</div>
			<div class="px-4 py-4 flex flex-col gap-5 md:flex-col sm:flex-row sm:flex-wrap">
				{#each data.functionalFields as field}
					{#if field.type === 'Boolean'}
						<label class="flex items-center gap-2.5 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={mockSlice.primary[field.key] ?? field.default_value ?? false}
								on:change={(e) => updateField(field.key, e.currentTarget.checked)}
								class="w-4 h-4 cursor-pointer"
							/>
							<span style="color: {fg}; font-size: 14px;">{$_(field.label)}</span>
						</label>
					{:else if field.type === 'Select'}
						<div class="flex flex-col gap-1.5">
							<span style="color: {fgMuted}; font-size: 12px;">{$_(field.label)}</span>
							<select
								on:change={(e) => updateField(field.key, e.currentTarget.value)}
								style="background-color: {bg}; color: {fg}; border: 1px solid {fgMuted}44; font-size: 14px; padding: 4px 8px; border-radius: 4px; width: 100%;"
							>
								{#each field.options ?? [] as option}
									<option value={option} selected={mockSlice.primary[field.key] === option}
										>{$_(option)}</option
									>
								{/each}
							</select>
						</div>
					{:else if field.type === 'Number'}
						<div class="flex flex-col gap-1.5">
							<span style="color: {fgMuted}; font-size: 12px;">{$_(field.label)}</span>
							<input
								type="number"
								value={mockSlice.primary[field.key] ?? field.default_value ?? ''}
								placeholder={field.placeholder}
								on:input={(e) => updateField(field.key, Number(e.currentTarget.value))}
								style="background-color: {bg}; color: {fg}; border: 1px solid {fgMuted}44; font-size: 14px; padding: 4px 8px; border-radius: 4px; width: 100%;"
							/>
						</div>
					{:else if field.type === 'Image'}
						<div class="flex flex-col gap-1.5">
							<span style="color: {fgMuted}; font-size: 12px;">{$_(field.label)}</span>
							<input
								type="url"
								value={field.default_url ?? ''}
								placeholder="https://"
								on:input={(e) => updateField(field.key, buildImageField(e.currentTarget.value))}
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
	.preview-mobile :global([class*='md:grid-cols-']) {
		grid-template-columns: 1fr !important;
	}
	.preview-mobile :global([class*='md:flex-row']) {
		flex-direction: column !important;
	}
	.preview-mobile :global(.md\:px-6) {
		padding-left: 1.5rem !important;
		padding-right: 1.5rem !important;
	}
</style>
