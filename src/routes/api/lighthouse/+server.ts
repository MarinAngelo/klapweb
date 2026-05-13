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

	// Neuestes production-Deploy mit lighthouse.averages
	const deploy = deploys.find(
		(d) => d.context === 'production' && d.state === 'ready' && d.lighthouse?.averages
	) ?? deploys.find((d) => d.lighthouse?.averages);

	if (!deploy) {
		return new Response(
			JSON.stringify({ error: 'Keine Lighthouse-Daten gefunden.' }),
			{ status: 404 }
		);
	}

	const avg = deploy.lighthouse.averages as Record<string, number>;
	const toScore = (v: number | undefined) => (v != null ? Math.round(v) : null);

	return new Response(JSON.stringify({
		deployUrl:  deploy.deploy_ssl_url ?? deploy.deploy_url ?? '',
		deployedAt: deploy.published_at ?? deploy.created_at ?? null,
		formFactor: deploy.lighthouse.details?.formFactor ?? 'mobile',
		scores: {
			performance:   toScore(avg['performance']),
			accessibility: toScore(avg['accessibility']),
			bestPractices: toScore(avg['best-practices']),
			seo:           toScore(avg['seo']),
			pwa:           toScore(avg['pwa']),
		},
	}), { headers: { 'Content-Type': 'application/json' } });
};
