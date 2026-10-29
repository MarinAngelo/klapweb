import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { writeFileSync } from 'fs';
import { join } from 'path';
import generatedFieldReference from '$lib/generated/prismic-field-reference.json';
import { fieldDescriptions, fieldKey } from '$lib/fieldDescriptions';
import { agencyLogin, agencyLogout, isAgencyAuthenticated } from '$lib/server/agencyAuth';

export const prerender = false;

const SELF = '/agency/feldreferenz';
const FILE = join(process.cwd(), 'src/lib/fieldDescriptions.json');
const LANGS = ['de-ch', 'en-us'] as const;

type Item = {
	name: string;
	elementType: string;
	customType: string;
	field: string;
	label: string;
	description: string;
	type: string;
};

export const load = ({ cookies }) => {
	if (!isAgencyAuthenticated(cookies)) return { authenticated: false as const };

	// One row per field (a slice field shared by several variations appears once)
	const groups = new Map<
		string,
		{ id: string; name: string; elementType: string; fields: Record<string, unknown>[] }
	>();
	const seen = new Set<string>();
	for (const item of generatedFieldReference as Item[]) {
		const key = fieldKey(item);
		if (seen.has(key)) continue;
		seen.add(key);
		const group = groups.get(item.customType) ?? {
			// Technical id is unique (the name is not: custom type «event» and slice «Event»)
			id: item.customType,
			name: item.name,
			elementType: item.elementType,
			fields: []
		};
		group.fields.push({
			key,
			field: item.field,
			label: item.label,
			type: item.type,
			auto: item.description,
			de: fieldDescriptions[key]?.['de-ch'] ?? '',
			en: fieldDescriptions[key]?.['en-us'] ?? ''
		});
		groups.set(item.customType, group);
	}

	return {
		authenticated: true as const,
		// The file is committed → only editable on the local dev server (like gating.json)
		canEdit: dev,
		groups: [...groups.values()].sort(
			(a, b) => a.elementType.localeCompare(b.elementType) || a.name.localeCompare(b.name)
		),
		count: seen.size,
		described: Object.keys(fieldDescriptions).length
	};
};

export const actions = {
	login: ({ request, cookies }) => agencyLogin(request, cookies, SELF),

	logout: ({ cookies }) => agencyLogout(cookies, SELF),

	async save({ request, cookies }) {
		if (!isAgencyAuthenticated(cookies)) throw error(403, 'Nicht authentifiziert');
		if (!dev) throw error(403, 'Nur auf dem lokalen Dev-Server möglich');

		const form = await request.formData();
		// Keep entries of fields not shown in this plan (other features/branches)
		const next: Record<string, Record<string, string>> = { ...fieldDescriptions };
		for (const [name, value] of form.entries()) {
			const match = /^(de-ch|en-us):(.+)$/.exec(name);
			if (!match) continue;
			const [, lang, key] = match;
			const text = String(value).trim();
			const entry = { ...(next[key] ?? {}) };
			if (text) entry[lang] = text;
			else delete entry[lang];
			if (Object.keys(entry).length) next[key] = entry;
			else delete next[key];
		}
		const sorted = Object.fromEntries(
			Object.keys(next)
				.sort((a, b) => a.localeCompare(b))
				.map((key) => [
					key,
					Object.fromEntries(LANGS.filter((l) => next[key][l]).map((l) => [l, next[key][l]]))
				])
		);
		writeFileSync(FILE, JSON.stringify(sorted, null, '\t') + '\n');
		return { saved: Object.keys(sorted).length };
	}
};
