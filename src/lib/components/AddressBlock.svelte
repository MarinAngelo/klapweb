<script lang="ts">
	export let responsible_person_company: string;
	export let responsible_address: any[] | null | undefined;
	export let responsible_email: string;
</script>

<div class="prose address-block">
	{#if responsible_person_company && responsible_person_company.includes('Bitte für die Inhalte verantwortliche Person oder Firma im CMS')}
		<p class="text-red-600">{responsible_person_company}</p>
	{:else}
		<p>{responsible_person_company}</p>
	{/if}
	{#if Array.isArray(responsible_address)}
		{#each (responsible_address ?? []).filter((b) => b.type === 'paragraph' && typeof b.text === 'string') as block}
			{#if block.text.includes('Bitte Adresse der verantwortlichen Person oder Firma im CMS')}
				{#each block.text.split(/\r?\n/) as line}
					<p class="text-red-600">{line}</p>
				{/each}
			{:else}
				{#each block.text.split(/\r?\n/) as line}
					<p>{line}</p>
				{/each}
			{/if}
		{/each}
	{:else}
		<p class="text-red-600">{responsible_address}</p>
	{/if}
	{#if responsible_email === 'Bitte E-Mail-Adresse für die Kontaktaufnahme im CMS eintragen'}
		<p class="text-red-600">{responsible_email}</p>
	{:else if responsible_email}
		<p>
			E-Mail: <a
				href={`mailto:${responsible_email}`}
				class="hover:underline text-inherit"
				style="color: inherit;">{responsible_email}</a
			>
		</p>
	{/if}
</div>

<style>
	.address-block p {
		margin-bottom: 2px;
	}
</style>
