import { redirect, type RequestHandler } from '@sveltejs/kit';

// Old cancellation links (e-mails before /termin-stornieren): no cancellation on GET
// (mail scanners open links) → page with button
export const GET: RequestHandler = ({ url }) => {
	throw redirect(303, `/termin-stornieren${url.search}`);
};
