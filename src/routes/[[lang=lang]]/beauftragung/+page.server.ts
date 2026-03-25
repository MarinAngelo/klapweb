export const prerender = false;

export async function load({ url, parent }) {
	const { settings } = await parent();
	const dienstleistung = url.searchParams.get('dienstleistung') ?? '';

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

	const pageTitle: string = (settings.data as any).beauftragung_title?.trim() || 'Beauftragung';

	return { dienstleistung, extraFields, pageTitle };
}
