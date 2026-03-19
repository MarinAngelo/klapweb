/**
 * build-customtypes.js
 * Generates customtypes/*\/index.json and src/lib/slices/*\/model.json
 * from base.json + gating.json rules.
 *
 * gating.json — einzige Konfigurationsquelle für Plan/Feature-Gating:
 *
 *   plans:       Plan-Hierarchie  (id → { label, extends? })
 *   features:    Feature-Mapping  (id → { label, plans: [...] })
 *   customTypes: Custom-Type-Gate (typeId → { plan?, feature? })  [Dokumentation]
 *   slices:      Slice-Gating     (SliceName → {
 *                  plan?, feature?,            // Slice-Ebene
 *                  fields:     { key → { plan?, feature? } },  // Feld-Ebene
 *                  variations: { id  → { plan?, feature? } }   // Variations-Ebene
 *                })
 *
 * Feature-Dateien in customtypes/_features/<feature>/:
 *   page.json / settings.json  → Tab-Overlays für Custom Types (Inhalt bleibt dort)
 *   customtypes/<type>/index.json → Feature-eigene Custom Types
 *
 * slicemachine.config.json: "plan" wählt den aktiven Plan.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;

function read(path) {
	return JSON.parse(readFileSync(join(ROOT, path), 'utf-8'));
}

function write(path, data) {
	const fullPath = join(ROOT, path);
	mkdirSync(dirname(fullPath), { recursive: true });
	writeFileSync(fullPath, JSON.stringify(data, null, '\t') + '\n');
}

const config = read('slicemachine.config.json');
const gating = read('gating.json');

// ── Plan-Chain auflösen ──────────────────────────────────────────────────────────

function resolvePlanChain(planKey) {
	if (!planKey || !gating.plans[planKey]) return planKey ? [planKey] : [];
	const parent = gating.plans[planKey].extends;
	return [planKey, ...(parent ? resolvePlanChain(parent) : [])];
}

const activePlanChain = config.plan ? resolvePlanChain(config.plan) : [];

// ── Aktive Features aus Plan + gating.features ───────────────────────────────────

const features = Object.entries(gating.features ?? {})
	.filter(([, def]) => (def.plans ?? []).some((p) => activePlanChain.includes(p)))
	.map(([id]) => id);

console.log(
	`Plan: ${config.plan} (${gating.plans[config.plan]?.label ?? '?'}) → features: [${features.join(', ') || 'none'}]`
);

// ── Gating-Hilfsfunktionen ───────────────────────────────────────────────────────

/**
 * Prüft ob ein Gate-Objekt { plan?, feature? } mit dem aktiven Plan/Features kompatibel ist.
 * Kein Gate-Objekt (undefined/null) → immer aktiv.
 * Beide Felder gesetzt → beide müssen erfüllt sein (AND).
 */
function isActive(gate) {
	if (!gate) return true;
	if (gate.plan && activePlanChain.length > 0 && !activePlanChain.includes(gate.plan)) return false;
	if (gate.feature && !features.includes(gate.feature)) return false;
	return true;
}

/**
 * Filtert Felder eines primary-Objekts gemäss gating.json slices[name].fields.
 * Entfernt ausserdem _meta-Einträge aus dem Output (Legacy-Kompatibilität).
 */
function filterPrimary(primary, fieldGating) {
	const result = {};
	for (const [key, field] of Object.entries(primary ?? {})) {
		if (!field || typeof field !== 'object') { result[key] = field; continue; }
		const { _meta: _, ...fieldWithoutMeta } = field; // _meta aus Output entfernen
		if (!isActive(fieldGating?.[key])) continue;
		result[key] = fieldWithoutMeta;
	}
	return result;
}

/**
 * Filtert und bereinigt ein komplettes Slice-Model:
 * - Variationen: gefiltert nach gating.slices[name].variations
 * - Felder:      gefiltert nach gating.slices[name].fields
 * - _meta:       aus Variationen und Feldern entfernt
 */
function applyFilters(model, sliceGating) {
	const varGating   = sliceGating?.variations ?? {};
	const fieldGating = sliceGating?.fields     ?? {};
	return {
		...model,
		variations: (model.variations ?? [])
			.filter(({ id, _meta }) => isActive(varGating[id] ?? _meta)) // gating.json hat Vorrang, _meta als Fallback
			.map(({ _meta: _, ...v }) => ({ ...v, primary: filterPrimary(v.primary, fieldGating) })),
	};
}

// ── 1. Custom Types ──────────────────────────────────────────────────────────────

const managedTypes = ['page', 'settings'];

for (const type of managedTypes) {
	const basePath = `customtypes/${type}/base.json`;
	if (!existsSync(join(ROOT, basePath))) {
		console.warn(`⚠ No base.json for "${type}", skipping`);
		continue;
	}

	const doc = read(basePath);
	const tabs = doc.json;

	for (const feature of features) {
		const featurePath = `customtypes/_features/${feature}/${type}.json`;
		if (!existsSync(join(ROOT, featurePath))) continue;

		const featureFile  = read(featurePath);
		const meta         = featureFile._meta ?? {};
		const insertBefore = meta.insertBefore ?? null;
		const sliceChoices = meta.sliceChoices  ?? [];
		const featureTabs  = Object.entries(featureFile).filter(([k]) => k !== '_meta');

		if (insertBefore && Object.prototype.hasOwnProperty.call(tabs, insertBefore)) {
			const rebuilt = {};
			for (const [key, value] of Object.entries(tabs)) {
				if (key === insertBefore) {
					for (const [fk, fv] of featureTabs) rebuilt[fk] = fv;
				}
				rebuilt[key] = value;
			}
			doc.json = rebuilt;
		} else {
			for (const [fk, fv] of featureTabs) tabs[fk] = fv;
		}

		if (sliceChoices.length > 0) {
			for (const tabObj of Object.values(doc.json)) {
				for (const field of Object.values(tabObj)) {
					if (field.type === 'Slices') {
						for (const choiceId of sliceChoices) {
							field.config.choices[choiceId] = { type: 'SharedSlice' };
						}
					}
				}
			}
		}
	}

	write(`customtypes/${type}/index.json`, doc);
	console.log(`✓ customtypes/${type}/index.json`);
}

// ── 2. Slice Models ──────────────────────────────────────────────────────────────

const sliceGatingMap = gating.slices ?? {};

const slicesDir = join(ROOT, 'src/lib/slices');
const allSlices = readdirSync(slicesDir, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => d.name);

for (const sliceName of allSlices) {
	const basePath = `src/lib/slices/${sliceName}/base.json`;
	if (!existsSync(join(ROOT, basePath))) continue;

	const { _meta: _baseMeta, ...base } = read(basePath);
	const sliceGating = sliceGatingMap[sliceName];

	// Slice-level gate (gating.json hat Vorrang, _meta als Fallback)
	const sliceLevelGate = sliceGating?.plan || sliceGating?.feature
		? sliceGating
		: (_baseMeta?.Plan || _baseMeta?.Feature)
			? { plan: _baseMeta.Plan, feature: _baseMeta.Feature }
			: null;

	if (!isActive(sliceLevelGate)) {
		const reason = sliceLevelGate.feature
			? `feature: ${sliceLevelGate.feature}`
			: `plan: ${sliceLevelGate.plan}`;
		console.log(`⊘ slices/${sliceName}/model.json skipped (requires ${reason})`);
		continue;
	}

	const fullModelPath = `src/lib/slices/${sliceName}/model.json`;
	const fullPath      = `src/lib/slices/${sliceName}/full.json`;
	const fullExists    = existsSync(join(ROOT, fullPath));

	// Extra-Variationen aus gating.json.slices[name].variations (ersetzt slices.json)
	const activeExtraIds = new Set(
		Object.entries(sliceGating?.variations ?? {})
			.filter(([, gate]) => isActive(gate))
			.map(([id]) => id)
	);

	let model;
	if (activeExtraIds.size === 0) {
		model = applyFilters(base, sliceGating);
		console.log(`✓ slices/${sliceName}/model.json (base only)`);
	} else {
		if (!fullExists) {
			console.warn(`⚠ ${sliceName}/full.json missing — run npm run build-customtypes:init first`);
			continue;
		}
		const full = read(fullPath);
		const variationsToAdd = full.variations.filter((v) => activeExtraIds.has(v.id));
		const merged = { ...base, variations: [...base.variations, ...variationsToAdd] };
		model = applyFilters(merged, sliceGating);
		console.log(`✓ slices/${sliceName}/model.json (+${[...activeExtraIds].join(', ')})`);
	}

	write(fullModelPath, model);

	// Sync base variation primaries → full.json
	if (fullExists) {
		const full = read(fullPath);
		let fullChanged = false;
		for (const baseVariation of base.variations) {
			const fullVariation = full.variations.find((v) => v.id === baseVariation.id);
			if (
				fullVariation &&
				JSON.stringify(fullVariation.primary) !== JSON.stringify(baseVariation.primary)
			) {
				fullVariation.primary = baseVariation.primary;
				fullChanged = true;
			}
		}
		if (fullChanged) {
			write(fullPath, full);
			console.log(`  ↺ slices/${sliceName}/full.json synced from base.json`);
		}
	}
}

// ── 3. Feature-only Custom Types ─────────────────────────────────────────────────

for (const feature of features) {
	const ctDir = join(ROOT, `customtypes/_features/${feature}/customtypes`);
	if (!existsSync(ctDir)) continue;

	const typeNames = readdirSync(ctDir, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);

	for (const typeName of typeNames) {
		const src = join(ctDir, typeName, 'index.json');
		if (!existsSync(src)) continue;
		const def = JSON.parse(readFileSync(src, 'utf-8'));
		write(`customtypes/${typeName}/index.json`, def);
		console.log(`✓ customtypes/${typeName}/index.json (feature: ${feature})`);
	}
}

console.log(`\nFeatures active: [${features.join(', ') || 'none'}]`);
