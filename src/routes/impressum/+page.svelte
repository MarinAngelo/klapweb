<script lang="ts">
	import { page } from '$app/stores';
	export let data;
	// contacts: Array aus Settings
	const contacts = data?.settings?.data?.contacts ?? [];
	import AddressBlock from '../../lib/components/AddressBlock.svelte';
	import PrismicRichText from '../../lib/components/PrismicRichText.svelte';
	// Felder für AddressBlock
	const responsible_person_company = data?.settings?.data?.responsible_person_company ?? '';
	const responsible_address = data?.settings?.data?.responsible_address ?? [];
	const responsible_email = data?.settings?.data?.responsible_email ?? '';
	const legal_disclosure = data?.settings?.data?.legal_disclosure;
</script>

<main class="prose mx-auto py-12 px-4 sm:px-6">
	<h1>Impressum</h1>
	{#if legal_disclosure}
		<PrismicRichText field={legal_disclosure} />
	{/if}
	<div class="mt-8">
		<h2 class="text-lg font-semibold">Webentwicklung</h2>
		<p>
			Angelo Klap<br />
			Website:
			<a
				href="https://www.klap-web.ch/"
				target="_blank"
				class="hover:underline text-inherit"
				style="color: inherit;"
			>
				Klap Web
			</a><br />
			E-Mail: <a href="mailto:admin@klap-web.ch">admin@klap-web.ch</a>
		</p>
	</div>
	{#if contacts.length > 0}
		{#each contacts as contact, i (contact)}
			<div class={i < contacts.length - 1 ? 'mb-6' : ''}>
				{#if contact.title}
					<h2 class="text-lg font-semibold">{contact.title}</h2>
				{/if}
				<AddressBlock
					responsible_person_company={contact.name ?? ''}
					responsible_address={contact.address ?? []}
					responsible_email={contact.email ?? ''}
				/>
				{#if contact.website?.url}
					<p>
						Website: <a
							href={contact.website.url}
							target="_blank"
							class="hover:underline text-inherit"
							style="color: inherit;">{contact.website.text}</a
						>
					</p>
				{/if}
			</div>
		{/each}
	{/if}
</main>

<style>
	.prose {
		max-width: 65ch;
	}
	.address-block p {
		margin-bottom: 2px;
	}
</style>
