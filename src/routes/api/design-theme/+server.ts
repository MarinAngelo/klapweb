import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import * as prismic from '@prismicio/client';
import { repositoryName } from '$lib/prismicio';

const themeFields = [
	'header_bottom_curve',
	'header_bottom_curve_color',
	'header_bottom_curve_height',
	'header_bottom_curve_amplitude',
	'header_bottom_curve_waves',
	'header_bottom_curve_start'
] as const;

type ThemeField = (typeof themeFields)[number];
type ThemeValues = Partial<Record<ThemeField, boolean | number | string>>;

function isValidColor(value: unknown): value is string {
	return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

function validateValues(input: unknown): ThemeValues | null {
	if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
	const values: ThemeValues = {};
	for (const field of themeFields) {
		if (!(field in input)) continue;
		const value = (input as Record<string, unknown>)[field];
		if (field === 'header_bottom_curve' && typeof value !== 'boolean') return null;
		if (field === 'header_bottom_curve_color' && !isValidColor(value)) return null;
		if (
			[
				'header_bottom_curve_height',
				'header_bottom_curve_amplitude',
				'header_bottom_curve_waves'
			].includes(field) &&
			(typeof value !== 'number' || !Number.isFinite(value))
		)
			return null;
		if (field === 'header_bottom_curve_start' && value !== '0' && value !== 'Maximale Höhe') {
			return null;
		}
		values[field] = value as never;
	}
	if (!Object.keys(values).length) return null;

	const height = values.header_bottom_curve_height;
	const amplitude = values.header_bottom_curve_amplitude;
	const waves = values.header_bottom_curve_waves;
	if (height !== undefined && (height < 8 || height > 160)) return null;
	if (amplitude !== undefined && (amplitude < 0 || amplitude > 160)) return null;
	if (waves !== undefined && (waves < 1 || waves > 8)) return null;
	if (height !== undefined && amplitude !== undefined && amplitude > height) return null;
	return values;
}

export const prerender = false;

export async function POST({ request, url }) {
	const adminSecret = env.ADMIN_SECRET;
	const providedSecret = url.searchParams.get('secret');
	if (!adminSecret || providedSecret !== adminSecret) {
		return json({ error: 'Nicht autorisiert.' }, { status: 401 });
	}
	if (!env.PRISMIC_WRITE_TOKEN) {
		return json({ error: 'PRISMIC_WRITE_TOKEN ist nicht konfiguriert.' }, { status: 503 });
	}

	const values = validateValues(await request.json().catch(() => null));
	if (!values) return json({ error: 'Ungültige Theme-Werte.' }, { status: 400 });

	try {
		const client = prismic.createWriteClient(repositoryName, {
			writeToken: env.PRISMIC_WRITE_TOKEN
		});
		const themes = await client.getAllByType('theme', { lang: '*' });
		const activeThemes = themes.filter((theme) => theme.data?.activ === true);
		if (!activeThemes.length) {
			return json({ error: 'Kein aktives Theme gefunden.' }, { status: 404 });
		}

		const migration = prismic.createMigration();
		for (const theme of activeThemes) {
			const document = migration.updateDocument(theme as never);
			document.document.data = { ...theme.data, ...values } as never;
		}
		await client.migrate(migration);
		return json({ saved: true, documents: activeThemes.length });
	} catch (error) {
		console.error('Prismic Theme konnte nicht gespeichert werden:', error);
		return json({ error: 'Prismic Theme konnte nicht gespeichert werden.' }, { status: 502 });
	}
}
