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
 *   icons:       Icon-Registry    (slug → { label })
 *                → Slugs werden als Select-Optionen in theme/button_stile.icon geschrieben
 *                → Built-ins (external-link, menu, close) + CMS-Icons hier eintragen
 *   button_stile: Button-Stil-Registry (slug → { label, color?, bgColor?, hoverColor?, hoverBgColor? })
 *                → Labels werden als Select-Optionen in Slice-Feldern "button_style" geschrieben
 *                → optionale Farb-Defaults dienen als Fallback wenn Theme-Dokument den Stil nicht kennt
 *                → Button.svelte sucht Eintrag per label, setzt CSS-Vars per slug
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

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, rmSync } from 'fs';
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

function writeIfChanged(path, data) {
	const fullPath = join(ROOT, path);
	const newContent = JSON.stringify(data, null, '\t') + '\n';
	if (existsSync(fullPath)) {
		const oldContent = readFileSync(fullPath, 'utf-8');
		if (oldContent === newContent) return; // Keine Änderung, nicht überschreiben
	}
	mkdirSync(dirname(fullPath), { recursive: true });
	writeFileSync(fullPath, newContent);
}

const config = read('slicemachine.config.json');
const gating = read('gating.json');
const overridesPath = join(ROOT, 'gating.overrides.json');
const overrides = existsSync(overridesPath)
	? read('gating.overrides.json')
	: { enabled: [], disabled: [] };

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

// Zusätzliche Features aus gating.overrides.json (Branch-spezifisch)
// Format: { enabled: [...], disabled: [...] }
const enabledFeatures = (overrides.enabled ?? []).filter((f) => gating.features?.[f]);
const disabledFeatures = overrides.disabled ?? [];
const allFeatures = [
	...new Set([...features.filter((f) => !disabledFeatures.includes(f)), ...enabledFeatures])
];

console.log(
	`Plan: ${config.plan} (${gating.plans[config.plan]?.label ?? '?'}) → features: [${allFeatures.join(', ') || 'none'}]`
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
	if (gate.feature && !allFeatures.includes(gate.feature)) return false;
	return true;
}

/**
 * Filtert Felder eines primary-Objekts gemäss gating.json slices[name].fields.
 * Entfernt ausserdem _meta-Einträge aus dem Output (Legacy-Kompatibilität).
 */
function filterPrimary(primary, fieldGating) {
	const result = {};
	for (const [key, field] of Object.entries(primary ?? {})) {
		if (!field || typeof field !== 'object') {
			result[key] = field;
			continue;
		}
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
	const varGating = sliceGating?.variations ?? {};
	const fieldGating = sliceGating?.fields ?? {};
	return {
		...model,
		variations: (model.variations ?? [])
			.filter(({ id, _meta }) => isActive(varGating[id] ?? _meta)) // gating.json hat Vorrang, _meta als Fallback
			.map(({ _meta: _, ...v }) => ({ ...v, primary: filterPrimary(v.primary, fieldGating) }))
	};
}

/**
 * Filtert Felder eines Custom-Type-Tabs gemäss gating.json customTypes[typeId].fields.
 */
function filterTabFields(tab, fieldGating) {
	if (!fieldGating || Object.keys(fieldGating).length === 0) return tab;
	const result = {};
	for (const [key, field] of Object.entries(tab)) {
		if (!isActive(fieldGating[key])) continue;
		result[key] = field;
	}
	return result;
}

// ── 1. Custom Types ──────────────────────────────────────────────────────────────

const managedTypes = ['page', 'settings'];

// ── Warnung: Slice-Choices in index.json aber nicht in base.json ─────────────────
// Passiert wenn man in der Slice Machine UI einen Slice zur Page hinzufügt,
// aber base.json nicht manuell aktualisiert. index.json ist gitignored → geht verloren.
function getSliceChoices(doc) {
	const choices = new Set();
	for (const tab of Object.values(doc.json ?? {})) {
		for (const field of Object.values(tab)) {
			if (field?.type === 'Slices') {
				for (const key of Object.keys(field?.config?.choices ?? {})) {
					choices.add(key);
				}
			}
		}
	}
	return choices;
}

for (const type of managedTypes) {
	const indexPath = `customtypes/${type}/index.json`;
	const basePath = `customtypes/${type}/base.json`;
	if (existsSync(join(ROOT, indexPath)) && existsSync(join(ROOT, basePath))) {
		const indexChoices = getSliceChoices(read(indexPath));
		const baseChoices = getSliceChoices(read(basePath));
		const missing = [...indexChoices].filter((c) => !baseChoices.has(c));
		if (missing.length > 0) {
			console.warn(`⚠ ${type}/base.json fehlen Slice-Choices, die in index.json vorhanden sind:`);
			console.warn(`  → ${missing.join(', ')}`);
			console.warn(`  Bitte base.json manuell ergänzen, damit es in allen Branches verfügbar ist.`);
		}
	}
}

for (const type of managedTypes) {
	const basePath = `customtypes/${type}/base.json`;
	if (!existsSync(join(ROOT, basePath))) {
		console.warn(`⚠ No base.json for "${type}", skipping`);
		continue;
	}

	const doc = read(basePath);
	const tabs = doc.json;

	for (const feature of allFeatures) {
		const featurePath = `customtypes/_features/${feature}/${type}.json`;
		if (!existsSync(join(ROOT, featurePath))) continue;

		const featureFile = read(featurePath);
		const meta = featureFile._meta ?? {};
		const insertBefore = meta.insertBefore ?? null;
		const sliceChoices = meta.sliceChoices ?? [];
		const featureTabs = Object.entries(featureFile).filter(([k]) => k !== '_meta');

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

	// Feld-Gating für Custom Types (gating.json customTypes[typeId].fields)
	const ctFieldGating = gating.customTypes?.[type]?.fields ?? {};
	if (Object.keys(ctFieldGating).length > 0) {
		for (const [tabName, tabContent] of Object.entries(doc.json)) {
			doc.json[tabName] = filterTabFields(tabContent, ctFieldGating);
		}
	}

	write(`customtypes/${type}/index.json`, doc);
	console.log(`✓ customtypes/${type}/index.json`);
}

// ── 3. Slice Models ──────────────────────────────────────────────────────────────

const sliceGatingMap = gating.slices ?? {};

const slicesDir = join(ROOT, 'src/lib/slices');
const allSlices = readdirSync(slicesDir, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => d.name);

// Warnung: Slice-Verzeichnis vorhanden aber kein base.json → model.json kann nicht generiert werden.
// Passiert wenn ein alter committed model.json durch einen Gitignore-Merge gelöscht wurde.
const slicesWithoutBase = allSlices.filter(
	(n) => n !== 'index.ts' && !existsSync(join(ROOT, `src/lib/slices/${n}/base.json`))
);
if (slicesWithoutBase.length > 0) {
	console.warn(`⚠ Slice-Verzeichnisse ohne base.json (werden nicht generiert):`);
	console.warn(`  → ${slicesWithoutBase.join(', ')}`);
	console.warn(`  Lösung: base.json aus Git-History restaurieren oder neu erstellen.`);
}

for (const sliceName of allSlices) {
	const basePath = `src/lib/slices/${sliceName}/base.json`;
	if (!existsSync(join(ROOT, basePath))) continue;

	const { _meta: _baseMeta, ...base } = read(basePath);
	const sliceGating = sliceGatingMap[sliceName];

	// Slice-level gate (gating.json hat Vorrang, _meta als Fallback)
	const sliceLevelGate =
		sliceGating?.plan || sliceGating?.feature
			? sliceGating
			: _baseMeta?.Plan || _baseMeta?.Feature
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
	const fullPath = `src/lib/slices/${sliceName}/full.json`;
	const fullExists = existsSync(join(ROOT, fullPath));

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

	// Schreibe model.json nur bei echter Änderung
	writeIfChanged(fullModelPath, model);

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

// ── 4. Feature-only Custom Types ─────────────────────────────────────────────────

for (const feature of allFeatures) {
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

console.log(`\nFeatures active: [${allFeatures.join(', ') || 'none'}]`);

// ── 5. Gated Custom Types aufräumen ──────────────────────────────────────────────

for (const [typeId, gate] of Object.entries(gating.customTypes ?? {})) {
	const active = isActive(gate);
	if (active) continue;
	const indexPath = join(ROOT, `customtypes/${typeId}/index.json`);
	if (existsSync(indexPath)) {
		rmSync(indexPath);
		const reason = gate.feature ? `feature: ${gate.feature}` : `plan: ${gate.plan}`;
		console.log(`⊘ customtypes/${typeId}/index.json removed (requires ${reason})`);
	}
}

// ── Pre-Build-Check: Existenz aller aktiven Custom-Type-Basisdateien ─────────────
for (const [typeId, gate] of Object.entries(gating.customTypes ?? {})) {
	if (!isActive(gate)) continue;
	if (!gate.feature) continue; // managedTypes (page/settings) ohne feature-Gate überspringen
	// Feature-Ordner-Pfad
	let basePath = `customtypes/_features/${gate.feature}/customtypes/${typeId}/index.json`;
	if (!existsSync(join(ROOT, basePath))) {
		console.error(`❌ FEHLER: Basisdatei für aktiven Custom Type "${typeId}" fehlt: ${basePath}`);
		process.exit(1);
	}
}
// ── Ende Pre-Build-Check ──────────────────────────────────────────────────────
