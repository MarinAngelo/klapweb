import { createClient } from '$lib/prismicio';

export const prerender = false;

export async function load({ url, parent, fetch, cookies }) {
	const { settings } = await parent();
	const dienstleistung = url.searchParams.get('dienstleistung') ?? '';
	const eventCheckout = url.searchParams.get('event_checkout') === 'true';

	// Extra fields from first form-slice in Settings E-Commerce tab
	const formSlice = (settings.data as any).slices3?.[0];
	const extraFields: Array<{
		field_name: string | null;
		field_type: string | null;
		required: boolean;
		options?: string | null;
		placeholder?: string | null;
		invalid_feedback_text?: string | null;
	}> = formSlice?.primary?.form_fields ?? [];

	let pageTitle: string = (settings.data as any).beauftragung_title?.trim() || '';

	if (eventCheckout && dienstleistung) {
		const client = createClient({ fetch, cookies });
		const eventDoc = await client.getByUID('event', dienstleistung).catch(() => null);
		pageTitle =
			(eventDoc?.data as any)?.checkout_title?.trim() ||
			(eventDoc?.data as any)?.title?.trim() ||
			'Anmeldung';
		return {
			dienstleistung,
			extraFields,
			pageTitle,
			eventCheckout,
			showFirmaField: (eventDoc?.data as any)?.show_company_field === true,
			showAddressFields: (eventDoc?.data as any)?.show_address_fields === true,
			showCommentField: (eventDoc?.data as any)?.show_comment_field === true
		};
	}

	return {
		dienstleistung,
		extraFields,
		pageTitle,
		eventCheckout,
		showFirmaField: true,
		showAddressFields: true,
		showCommentField: true
	};
}
