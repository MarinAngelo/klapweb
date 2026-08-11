import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { listEventRegistrations } from '$lib/server/eventRegistrations';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const GET: RequestHandler = async ({ url }) => {
	const secret = url.searchParams.get('secret');
	if (!secret || secret !== env.ADMIN_SECRET) throw error(403, 'Kein Zugriff');

	const uid = url.searchParams.get('uid') ?? '';
	const all = await listEventRegistrations();
	const registrations = uid ? all.filter((r) => r.eventUid === uid) : all;
	if (registrations.length === 0) throw error(404, 'Keine Anmeldungen');

	const eventLabel = registrations[0].eventLabel;

	const pdfDoc = await PDFDocument.create();
	const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

	const black = rgb(0, 0, 0);
	const gray = rgb(0.4, 0.4, 0.4);
	const lightGray = rgb(0.93, 0.93, 0.93);

	const marginL = 40;
	const marginR = 40;
	const pageW = 842;
	const pageH = 595;
	const rowH = 20;
	const cols = [
		{ label: 'Datum', x: marginL, w: 100 },
		{ label: 'Vorname', x: 145, w: 110 },
		{ label: 'Nachname', x: 260, w: 110 },
		{ label: 'E-Mail', x: 375, w: 200 },
		{ label: 'Zahlungsart', x: 580, w: 80 },
		{ label: 'Betrag', x: 665, w: 80 }
	];

	let page = pdfDoc.addPage([pageW, pageH]);
	let y = pageH - 50;

	const addPage = () => {
		page = pdfDoc.addPage([pageW, pageH]);
		y = pageH - 50;
	};
	const checkY = (needed: number) => {
		if (y < needed + 40) addPage();
	};

	// Title
	page.drawText(eventLabel, { x: marginL, y, size: 14, font: fontBold, color: black });
	y -= 14;
	page.drawText(`Teilnehmerliste · ${new Date().toLocaleDateString('de-CH')}`, {
		x: marginL,
		y,
		size: 9,
		font,
		color: gray
	});
	y -= 24;

	// Column header
	page.drawRectangle({
		x: marginL,
		y: y - 4,
		width: pageW - marginL - marginR,
		height: rowH,
		color: lightGray
	});
	for (const col of cols) {
		page.drawText(col.label, { x: col.x, y: y + 2, size: 8, font: fontBold, color: gray });
	}
	y -= rowH;

	// Rows
	for (const r of registrations) {
		checkY(rowH);
		const fmtDate = new Date(r.date).toLocaleDateString('de-CH', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
		const amount = r.amount != null ? `${r.amount} ${r.currency}` : '—';
		const vals = [fmtDate, r.vorname, r.nachname, r.email ?? '—', r.paymentMethod, amount];
		for (let i = 0; i < cols.length; i++) {
			const col = cols[i];
			const text =
				vals[i].length > col.w / 6.5
					? vals[i].slice(0, Math.floor(col.w / 6.5) - 1) + '…'
					: vals[i];
			page.drawText(text, { x: col.x, y: y + 2, size: 8, font, color: black });
		}
		y -= rowH;
	}

	const pdfBytes = await pdfDoc.save();
	const date = new Date().toISOString().slice(0, 10);
	const filename = `teilnehmerliste-${eventLabel.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${date}.pdf`;
	return new Response(pdfBytes, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
