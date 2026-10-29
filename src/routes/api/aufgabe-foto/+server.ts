/**
 * POST /api/aufgabe-foto — Foto-Upload (vorher/nachher) für eine Annahme.
 * FormData: annahmeId, art (vorher|nachher), file
 *
 * GET /api/aufgabe-foto?id=ANNahmeId&art=vorher|nachher — Foto ausliefern.
 */
import type { RequestHandler } from '@sveltejs/kit';
import { getAnnahme, updateAnnahme } from '$lib/server/aufgaben';
import { saveAufgabeFoto, getAufgabeFoto, type FotoArt } from '$lib/server/aufgabeFotos';

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export const POST: RequestHandler = async ({ request }) => {
	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return new Response(JSON.stringify({ error: 'Ungültige Anfrage' }), { status: 400 });
	}

	const annahmeId = form.get('annahmeId') as string;
	const art = form.get('art') as FotoArt;
	const file = form.get('file');

	if (!annahmeId || !['vorher', 'nachher'].includes(art)) {
		return new Response(JSON.stringify({ error: 'annahmeId und gültige art erforderlich' }), {
			status: 400
		});
	}
	if (!(file instanceof File) || file.size === 0) {
		return new Response(JSON.stringify({ error: 'Datei fehlt' }), { status: 400 });
	}
	if (!file.type.startsWith('image/')) {
		return new Response(JSON.stringify({ error: 'Nur Bilder erlaubt' }), { status: 400 });
	}
	if (file.size > MAX_SIZE) {
		return new Response(JSON.stringify({ error: 'Bild zu gross (max. 8 MB)' }), { status: 400 });
	}

	try {
		const annahme = await getAnnahme(annahmeId);
		if (!annahme)
			return new Response(JSON.stringify({ error: 'Annahme nicht gefunden' }), { status: 404 });
		if (annahme.status === 'erledigt') {
			return new Response(JSON.stringify({ error: 'Aufgabe ist bereits abgeschlossen' }), {
				status: 409
			});
		}

		const url = await saveAufgabeFoto(annahmeId, art, file);
		await updateAnnahme(annahmeId, { [art === 'vorher' ? 'fotoVorher' : 'fotoNachher']: url });

		return new Response(JSON.stringify({ ok: true, url }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		console.error('POST /api/aufgabe-foto Fehler:', e);
		return new Response(JSON.stringify({ error: 'Upload fehlgeschlagen' }), { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	const art = url.searchParams.get('art') as FotoArt;
	if (!id || !['vorher', 'nachher'].includes(art)) {
		return new Response('Not found', { status: 404 });
	}

	try {
		const foto = await getAufgabeFoto(id, art);
		if (!foto) return new Response('Not found', { status: 404 });
		return new Response(foto.data, {
			headers: {
				'Content-Type': foto.contentType,
				'Cache-Control': 'no-store'
			}
		});
	} catch {
		return new Response('Not found', { status: 404 });
	}
};
