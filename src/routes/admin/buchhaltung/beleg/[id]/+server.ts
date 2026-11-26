import { error } from '@sveltejs/kit';
import { FEATURE_BUCHHALTUNG } from '$lib/server/features';
import { getBeleg, isValidBuchungId } from '$lib/server/buchhaltung';

export const prerender = false;

/** Receipt of a booking (inline: PDF/image opens in the browser). Admin session via hooks. */
export async function GET({ params }) {
	if (!FEATURE_BUCHHALTUNG || !isValidBuchungId(params.id)) throw error(404, 'Nicht gefunden');
	const beleg = await getBeleg(params.id);
	if (!beleg) throw error(404, 'Beleg nicht gefunden');
	return new Response(beleg.data, {
		headers: {
			'Content-Type': beleg.contentType,
			'Content-Disposition': `inline; filename="${encodeURIComponent(beleg.name)}"`,
			'Cache-Control': 'private, no-store'
		}
	});
}
