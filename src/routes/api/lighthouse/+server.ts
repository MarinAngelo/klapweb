import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const NETLIFY_API = 'https://api.netlify.com/api/v1';

export const GET: RequestHandler = async () => {
	const siteId = env.NETLIFY_SITE_ID;
	const token  = env.NETLIFY_TOKEN;

	if (!siteId || !token) {
		return new Response(
			JSON.stringify({ error: 'NETLIFY_SITE_ID oder NETLIFY_TOKEN nicht konfiguriert' }),
			{ status: 500 }
		);
	}

	// Letzte 10 Deploys abrufen — wir suchen das neueste mit Lighthouse-Daten
	const deploysRes = await fetch(`${NETLIFY_API}/sites/${siteId}/deploys?per_page=10`, {
		headers: { Authorization: `Bearer ${token}` },
	}).catch(() => null);

	if (!deploysRes?.ok) {
		return new Response(
			JSON.stringify({ error: `Netlify API Fehler ${deploysRes?.status ?? 'Netzwerk'}` }),
			{ status: 502 }
		);
	}

	const deploys: any[] = await deploysRes.json();

	// Neuestes Deploy mit lighthouse_scores finden
	const deploy = deploys.find(
		(d) => d.lighthouse_scores && Object.keys(d.lighthouse_scores).length > 0
	);

	if (!deploy) {
		return new Response(
			JSON.stringify({ error: 'Noch keine Lighthouse-Daten verfügbar. Bitte nach dem nächsten Deploy erneut versuchen.' }),
			{ status: 404 }
		);
	}

	const raw = deploy.lighthouse_scores as Record<string, number>;

	// Netlify liefert Werte als 0–100 Integer
	const toScore = (v: number | undefined) => (v != null ? Math.round(v) : null);

	return new Response(JSON.stringify({
		deployUrl:  deploy.deploy_url  ?? deploy.ssl_url ?? '',
		deployedAt: deploy.published_at ?? deploy.created_at ?? null,
		scores: {
			performance:   toScore(raw.performance),
			accessibility: toScore(raw.accessibility),
			bestPractices: toScore(raw.best_practices ?? raw.bestPractices),
			seo:           toScore(raw.seo),
			pwa:           toScore(raw.pwa),
		},
	}), { headers: { 'Content-Type': 'application/json' } });
};
