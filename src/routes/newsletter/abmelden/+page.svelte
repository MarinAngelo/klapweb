<script lang="ts">
	import { _ } from '$lib/stores/i18n';
	import Button from '$lib/components/Button.svelte';
	import Bounded from '$lib/components/Bounded.svelte';

	export let data: { email: string; valid: boolean };
	export let form: { done?: boolean; error?: string } | null;
</script>

<Bounded>
	<div class="max-w-xl mx-auto py-12">
		<h1>{$_('Info-Mails abbestellen')}</h1>

		{#if form?.done}
			<p>{$_('Sie wurden abgemeldet und erhalten keine weiteren Info-Mails mehr.')}</p>
		{:else if !data.valid}
			<p>{$_('Dieser Abmelde-Link ist ungültig. Bitte verwenden Sie den Link aus der E-Mail.')}</p>
		{:else}
			<p>
				{$_('Möchten Sie für diese E-Mail-Adresse keine weiteren Info-Mails erhalten?')}
				<strong>{data.email}</strong>
			</p>
			{#if form?.error}
				<p role="alert">{$_(form.error)}</p>
			{/if}
			<form method="POST">
				<Button text={$_('Abmelden')} />
			</form>
		{/if}
	</div>
</Bounded>
