<script lang="ts">
	// "Angemeldet bleiben" checkbox for all login forms (server reads it via wantsRemember())
	import Checkbox from '$lib/components/Checkbox.svelte';
	import { _ } from '$lib/stores/i18n';
	import { REMEMBER_DAYS, REMEMBER_FIELD } from '$lib/auth/remember';

	export let checked = false;
	export let id = 'remember-me';
</script>

<label for={id} class="flex cursor-pointer items-start gap-2 text-sm">
	<Checkbox {id} name={REMEMBER_FIELD} value="on" bind:checked />
	<span>{$_('Angemeldet bleiben ({tage} Tage)').replace('{tage}', String(REMEMBER_DAYS))}</span>
</label>
