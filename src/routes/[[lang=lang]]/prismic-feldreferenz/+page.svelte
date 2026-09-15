<script lang="ts">
	import Bounded from '$lib/components/Bounded.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import FieldGroup from '$lib/components/FieldGroup.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import SvgIcons from '$lib/components/SvgIcons.svelte';
	import { _ } from '$lib/stores/i18n';

	type SortField = 'name' | 'elementType' | 'tab' | 'label' | 'type';
	type SortDirection = 'asc' | 'desc';
	type PaginationItem = number | 'ellipsis';

	export let data: {
		title: string;
		fields: Array<{
			name: string;
			elementType: 'Page Type' | 'Custom Type' | 'Slice';
			customType: string;
			customTypeLabel: string;
			tab: string;
			field: string;
			path: string;
			label: string;
			description: string;
			type: string;
		}>;
		pageDocument: any;
	};

	$: fields = data.fields ?? [];
	let searchTerm = '';
	let elementTypeFilter = '';
	let sortField: SortField = 'name';
	let sortDirection: SortDirection = 'asc';
	let currentPage = 1;
	const pageSize = 25;

	function matchesSearch(field: (typeof fields)[number], search: string): boolean {
		const queryTokens = search
			.toLocaleLowerCase('de')
			.split(/[^\p{L}\p{N}]+/u)
			.filter(Boolean);
		if (queryTokens.length === 0) return true;

		const fieldTokens = [
			field.name,
			field.elementType,
			field.tab,
			field.label,
			field.description,
			field.type
		]
			.join(' ')
			.toLocaleLowerCase('de')
			.split(/[^\p{L}\p{N}]+/u)
			.filter(Boolean);

		return queryTokens.every((queryToken) =>
			fieldTokens.some((fieldToken) => fieldToken.startsWith(queryToken))
		);
	}

	$: visibleFields = fields
		.filter((field) => !elementTypeFilter || field.elementType === elementTypeFilter)
		.filter((field) => matchesSearch(field, searchTerm))
		.sort((a, b) => {
			const result = a[sortField].localeCompare(b[sortField], 'de');
			return sortDirection === 'asc' ? result : -result;
		});
	$: totalPages = Math.max(1, Math.ceil(visibleFields.length / pageSize));
	$: currentPage = Math.min(currentPage, totalPages);
	$: paginatedFields = visibleFields.slice((currentPage - 1) * pageSize, currentPage * pageSize);
	$: pageNumbers = getPaginationItems(totalPages, currentPage);

	function resetTableTools() {
		searchTerm = '';
		elementTypeFilter = '';
		sortField = 'name';
		sortDirection = 'asc';
		currentPage = 1;
	}

	function goToPage(page: number) {
		currentPage = Math.max(1, Math.min(page, totalPages));
	}

	function getPaginationItems(total: number, current: number): PaginationItem[] {
		if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

		const items: PaginationItem[] = [1];
		if (current > 4) items.push('ellipsis');
		for (let page = Math.max(2, current - 1); page <= Math.min(total - 1, current + 1); page += 1) {
			items.push(page);
		}
		if (current < total - 3) items.push('ellipsis');
		items.push(total);
		return items;
	}
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<Bounded tag="main" yPadding="base-top" class="field-reference-page">
	<div class="table-tools" aria-label={$_('Tabellenwerkzeuge')}>
		<div class="table-tool table-tool-search">
			<FieldGroup label={$_('Suche')} forId="table-search">
				<InputField
					inputId="table-search"
					showLabel={false}
					field={{
						field_name: '',
						field_type: 'Suche',
						required: false,
						placeholder: $_('Feld, Name oder Beschreibung')
					}}
					bind:value={searchTerm}
				/>
			</FieldGroup>
		</div>
		<div class="table-tool">
			<FieldGroup label={$_('Element Typ')} forId="element-type-filter">
				<Dropdown
					inputId="element-type-filter"
					selectMode
					options={[
						{ value: '', label: $_('Alle') },
						{ value: 'Page Type', label: $_('Page Type') },
						{ value: 'Custom Type', label: $_('Custom Type') },
						{ value: 'Slice', label: $_('Slice') }
					]}
					bind:value={elementTypeFilter}
				/>
			</FieldGroup>
		</div>
		<div class="table-tool">
			<FieldGroup label={$_('Sortieren nach')} forId="sort-field">
				<Dropdown
					inputId="sort-field"
					selectMode
					options={[
						{ value: 'name', label: $_('Name') },
						{ value: 'elementType', label: $_('Element Typ') },
						{ value: 'tab', label: $_('Tab / Variante') },
						{ value: 'label', label: $_('Feld') },
						{ value: 'type', label: $_('Typ') }
					]}
					bind:value={sortField}
				/>
			</FieldGroup>
		</div>
		<button
			type="button"
			class="table-sort-direction"
			on:click={() => (sortDirection = sortDirection === 'asc' ? 'desc' : 'asc')}
			aria-label={sortDirection === 'asc'
				? $_('Absteigend sortieren')
				: $_('Aufsteigend sortieren')}
			title={sortDirection === 'asc' ? $_('Absteigend sortieren') : $_('Aufsteigend sortieren')}
		>
			<SvgIcons name="sort" size="1.1em" color="currentColor" />
		</button>
		<button type="button" class="table-tool-reset" on:click={resetTableTools}
			>{$_('Zurücksetzen')}</button
		>
	</div>

	<div class="table-wrapper">
		<table class="table">
			<thead class="table-header">
				<tr>
					<th>{$_('Name')}</th>
					<th>{$_('Element Typ')}</th>
					<th>{$_('Tab / Variante')}</th>
					<th>{$_('Feld')}</th>
					<th>{$_('Beschreibung')}</th>
					<th>{$_('Typ')}</th>
				</tr>
			</thead>
			<tbody>
				{#if fields.length === 0}
					<tr>
						<td colspan="6" class="table-empty"
							>{$_('Keine aktiven Felder für diesen Branch gefunden.')}</td
						>
					</tr>
				{:else if visibleFields.length === 0}
					<tr>
						<td colspan="6" class="table-empty">{$_('Keine Felder für diese Auswahl gefunden.')}</td
						>
					</tr>
				{:else}
					{#each paginatedFields as field}
						<tr>
							<td>{field.name || field.customTypeLabel || field.customType}</td>
							<td>{field.elementType}</td>
							<td>{field.tab}</td>
							<td>{field.label}</td>
							<td>{field.description}</td>
							<td>{field.type}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<div class="table-pagination">
		<div class="table-pagination-controls" aria-label={$_('Seitennavigation')}>
			<button
				type="button"
				class="table-pagination-button"
				disabled={currentPage === 1}
				on:click={() => goToPage(currentPage - 1)}
				aria-label={$_('Vorherige Seite')}
			>
				<SvgIcons name="left" size="1.1em" color="currentColor" />
			</button>
			{#each pageNumbers as page}
				{#if page === 'ellipsis'}
					<span class="table-pagination-ellipsis" aria-hidden="true">…</span>
				{:else}
					<button
						type="button"
						class="table-pagination-button"
						class:table-pagination-current={page === currentPage}
						on:click={() => goToPage(page)}
						aria-current={page === currentPage ? 'page' : undefined}>{page}</button
					>
				{/if}
			{/each}
			<button
				type="button"
				class="table-pagination-button"
				disabled={currentPage === totalPages}
				on:click={() => goToPage(currentPage + 1)}
				aria-label={$_('Nächste Seite')}
			>
				<SvgIcons name="right" size="1.1em" color="currentColor" />
			</button>
		</div>
		<div class="table-pagination-summary">
			<span class="table-result-count"
				>{visibleFields.length} {$_('von')} {fields.length} {$_('Feldern')}</span
			>
		</div>
	</div>
</Bounded>
