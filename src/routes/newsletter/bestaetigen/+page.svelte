<script lang="ts">
	import { _ } from '$lib/stores/i18n';
	import Button from '$lib/components/Button.svelte';
	import Bounded from '$lib/components/Bounded.svelte';

	export let data: { valid: boolean; email: string };
	export let form: { done?: boolean; error?: string } | null;
</script>

<Bounded>
	<div class="max-w-xl mx-auto py-12">
		<h1>{form?.done ? $_('Anmeldung bestätigt') : $_('Anmeldung bestätigen')}</h1>

		{#if form?.done}
			<p>
				{$_('Vielen Dank! Ihre Anmeldung ist bestätigt. Sie erhalten ab jetzt unsere Info-Mails.')}
			</p>
		{:else if !data.valid}
			<p>{$_('Dieser Bestätigungslink ist ungültig oder abgelaufen.')}</p>
			<p>{$_('Bitte melden Sie sich erneut an.')}</p>
		{:else}
			<p>
				{$_('Bitte bestätigen Sie die Anmeldung für die Info-Mails mit dieser E-Mail-Adresse:')}
				<strong>{data.email}</strong>
			</p>
			{#if form?.error}
				<p role="alert">{$_(form.error)}</p>
			{/if}
			<form method="POST">
				<Button text={$_('Anmeldung bestätigen')} />
			</form>
		{/if}
	</div>
</Bounded>
