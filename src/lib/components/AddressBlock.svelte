<script lang="ts">
	export let responsible_person_company: string;
	export let responsible_address: any[] | null | undefined;
	export let responsible_email: string;
</script>

<div class="prose address-block">
	<p>{responsible_person_company}</p>
	{#each (responsible_address ?? []).filter((b) => b.type === 'paragraph' && typeof b.text === 'string') as block}
		{#each block.text.split(/\r?\n/) as line}
			<p>{line}</p>
		{/each}
	{/each}
	<p>{responsible_email}</p>
</div>

<style>
	.address-block p {
		margin-bottom: 2px;
	}
</style>
