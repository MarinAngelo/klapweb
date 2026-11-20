<script lang="ts">
	/**
	 * Bulk actions for admin tables: «n ausgewählt» + action select + «Ausführen».
	 * Posts the form action `formAction` with fields `action` and `ids` (JSON array) in the
	 * background (use:enhance), asks for confirmation first (action.confirm, {n} = count).
	 * New actions: add an entry to `actions` and handle it in the server action.
	 */
	import { enhance } from '$app/forms';
	import { createEventDispatcher } from 'svelte';
	import { _ } from '$lib/stores/i18n';

	export let selectedIds: string[] = [];
	export let actions: { value: string; label: string; confirm?: string }[];
	/** Form action, e.g. '?/bulk' */
	export let formAction: string;

	const dispatch = createEventDispatcher<{ done: void }>();
	let action = '';

	$: chosen = actions.find((a) => a.value === action);
</script>

<form
	method="POST"
	action={formAction}
	class="admin-bulk"
	use:enhance={({ formData, cancel }) => {
		if (!chosen || !selectedIds.length) return cancel();
		if (chosen.confirm && !confirm(chosen.confirm.replace('{n}', String(selectedIds.length)))) {
			return cancel();
		}
		formData.set('action', chosen.value);
		formData.set('ids', JSON.stringify(selectedIds));
		return async ({ update }) => {
			await update();
			action = '';
			dispatch('done');
		};
	}}
>
	<span class="admin-muted">{selectedIds.length} {$_('ausgewählt')}</span>
	<select bind:value={action} class="admin-input admin-input-sm w-auto" aria-label={$_('Aktion')}>
		<option value="">{$_('Aktion wählen …')}</option>
		{#each actions as a}
			<option value={a.value}>{a.label}</option>
		{/each}
	</select>
	<button type="submit" class="admin-btn admin-btn-sm" disabled={!action || !selectedIds.length}>
		{$_('Ausführen')}
	</button>
</form>
