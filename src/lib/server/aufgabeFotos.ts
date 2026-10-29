/**
 * Foto-Storage für Aufgaben (Vorher/Nachher) via Netlify Blobs.
 * Key-Format: {annahmeId}/vorher|nachher — Content-Type als Metadata.
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';

export type FotoArt = 'vorher' | 'nachher';

function getFotoStore() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) throw new Error('Netlify Blobs: NETLIFY_SITE_ID oder NETLIFY_TOKEN fehlt');
	return getStore({ name: 'aufgaben_fotos', siteID, token });
}

export async function saveAufgabeFoto(
	annahmeId: string,
	art: FotoArt,
	file: File
): Promise<string> {
	const store = getFotoStore();
	const buf = await file.arrayBuffer();
	await store.set(`${annahmeId}/${art}`, buf, {
		metadata: { contentType: file.type || 'image/jpeg' }
	});
	// ?v= als Cache-Buster, sonst zeigt der Browser nach Ersetzen das alte Bild
	return `/api/aufgabe-foto?id=${encodeURIComponent(annahmeId)}&art=${art}&v=${Date.now()}`;
}

export async function getAufgabeFoto(
	annahmeId: string,
	art: FotoArt
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
	const store = getFotoStore();
	const meta = (await store.getWithMetadata(`${annahmeId}/${art}`, { type: 'arrayBuffer' })) as any;
	if (!meta?.data) return null;
	return { data: meta.data, contentType: meta.metadata?.contentType || 'image/jpeg' };
}
