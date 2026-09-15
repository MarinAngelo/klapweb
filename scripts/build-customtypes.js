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

const customTypeLabelOverrides = {
	aufgabe: 'Aufgabe',
	page: 'Seiten',
	settings: 'Einstellungen'
};

function describeField(fieldConfig, label, elementType) {
	const config = fieldConfig?.config ?? {};
	if (config.description || fieldConfig?.description) {
		return config.description || fieldConfig.description;
	}

	const subject = label || 'dieses Feld';
	const options = Array.isArray(config.options) ? config.options.filter(Boolean).join(', ') : '';
	const descriptions = {
		UID: `Legt die eindeutige Kennung für ${subject} fest. Diese wird für die Zuordnung und Verlinkung verwendet.`,
		Text: `Erfasst einen kurzen Text für ${subject}.`,
		'Key Text': `Erfasst einen kurzen, eindeutig verwendbaren Textwert für ${subject}.`,
		StructuredText: `Erfasst formatierten Text für ${subject}, zum Beispiel Absätze, Überschriften oder Links.`,
		Image: `Wählt ein Bild für ${subject} aus und stellt es an der vorgesehenen Stelle dar.`,
		Boolean: `Schaltet ${subject} ein oder aus.`,
		Number: `Erfasst einen Zahlenwert für ${subject}.`,
		Select: `Legt ${subject} über eine Auswahl fest${options ? `: ${options}` : ''}.`,
		Color: `Legt die Farbe für ${subject} fest.`,
		Date: `Legt das Datum für ${subject} fest.`,
		Timestamp: `Legt Datum und Uhrzeit für ${subject} fest.`,
		Link: `Verknüpft ${subject} mit einer anderen Seite oder einem externen Ziel.`,
		ContentRelationship: `Verknüpft ${subject} mit einem anderen Inhalt im CMS.`,
		Embed: `Bindet einen externen Inhalt für ${subject} ein.`,
		Group: `Ermöglicht eine wiederholbare Liste von Einträgen für ${subject}.`,
		Slices: `Wählt die Inhaltsbausteine aus, die an dieser Stelle verwendet werden können.`,
		IntegrationFields: `Lädt zusätzliche Daten für ${subject} aus einer externen Integration.`,
		GeoPoint: `Speichert einen geografischen Ort für ${subject}.`
	};

	if (descriptions[fieldConfig?.type]) return descriptions[fieldConfig.type];
	if (config.placeholder) return `Erfasst ${subject}; Beispiel: ${config.placeholder}.`;
	return `Legt den Wert für ${subject} fest.`;
}

function collectFieldReference() {
	const fieldMap = [];
	const customTypesDir = join(ROOT, 'customtypes');
	const typeNames = !existsSync(customTypesDir)
		? []
		: readdirSync(customTypesDir, { withFileTypes: true })
				.filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
				.map((entry) => entry.name)
				.sort((a, b) => a.localeCompare(b));

	for (const typeName of typeNames) {
		const typePath = join(customTypesDir, typeName, 'index.json');
		if (!existsSync(typePath)) continue;

		const doc = read(`customtypes/${typeName}/index.json`);
		const tabs = doc?.json ?? {};
		const tabNames = Object.keys(tabs);

		for (const tabName of tabNames) {
			const tabContent = tabs[tabName];
			if (!tabContent || typeof tabContent !== 'object') continue;
			const fieldNames = Object.keys(tabContent);
			for (const fieldName of fieldNames) {
				const fieldConfig = tabContent[fieldName];
				if (!fieldConfig || typeof fieldConfig !== 'object') continue;
				fieldMap.push({
					name: customTypeLabelOverrides[typeName] || doc.label || typeName,
					elementType: typeName === 'page' || typeName === 'settings' ? 'Page Type' : 'Custom Type',
					customType: typeName,
					customTypeLabel: customTypeLabelOverrides[typeName] || doc.label || typeName,
					tab: tabName,
					field: fieldName,
					path: `${typeName}/${tabName}/${fieldName}`,
					label: fieldConfig?.config?.label || fieldName,
					description: describeField(
						fieldConfig,
						fieldConfig?.config?.label || fieldName,
						'Custom Type'
					),
					type: fieldConfig?.type || 'unknown'
				});
			}
		}
	}

	const slicesDir = join(ROOT, 'src/lib/slices');
	if (existsSync(slicesDir)) {
		for (const entry of readdirSync(slicesDir, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const modelPath = join(slicesDir, entry.name, 'model.json');
			if (!existsSync(modelPath)) continue;

			const model = JSON.parse(readFileSync(modelPath, 'utf-8'));
			for (const variation of model.variations ?? []) {
				for (const [section, fields] of [
					['Primary', variation.primary],
					['Items', variation.items]
				]) {
					for (const [fieldName, fieldConfig] of Object.entries(fields ?? {})) {
						if (!fieldConfig || typeof fieldConfig !== 'object') continue;
						fieldMap.push({
							name: model.name || entry.name,
							elementType: 'Slice',
							customType: entry.name,
							customTypeLabel: model.name || entry.name,
							tab: variation.name || variation.id,
							field: fieldName,
							path: `${entry.name}/${variation.id}/${section}/${fieldName}`,
							label: fieldConfig?.config?.label || fieldName,
							description: describeField(
								fieldConfig,
								fieldConfig?.config?.label || fieldName,
								'Slice'
							),
							type: fieldConfig?.type || 'unknown'
						});
					}
				}
			}
		}
	}

	const elementTypeOrder = new Map([
		['Page Type', 0],
		['Custom Type', 1],
		['Slice', 2]
	]);
	const tabOrder = new Map();
	for (const field of fieldMap) {
		const groupKey = `${field.elementType}:${field.name}`;
		if (!tabOrder.has(groupKey)) tabOrder.set(groupKey, new Map());
		const groupTabs = tabOrder.get(groupKey);
		if (!groupTabs.has(field.tab)) groupTabs.set(field.tab, groupTabs.size);
	}

	return fieldMap.sort((a, b) => {
		const byName = a.name.localeCompare(b.name, 'de');
		if (byName !== 0) return byName;
		const byElementType = elementTypeOrder.get(a.elementType) - elementTypeOrder.get(b.elementType);
		if (byElementType !== 0) return byElementType;
		const aTabs = tabOrder.get(`${a.elementType}:${a.name}`);
		const bTabs = tabOrder.get(`${b.elementType}:${b.name}`);
		return aTabs.get(a.tab) - bTabs.get(b.tab);
	});
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

	// Slice-Choice-Gating: Choices entfernen deren Slice-Gate inaktiv ist
	for (const tabContent of Object.values(doc.json)) {
		for (const field of Object.values(tabContent)) {
			if (field.type !== 'Slices') continue;
			const choices = field.config?.choices ?? {};
			for (const choiceId of Object.keys(choices)) {
				// snake_case → PascalCase um gating.slices-Key zu finden
				const pascal = choiceId.replace(/(^|_)([a-z])/g, (_, __, c) => c.toUpperCase());
				const sliceGate = gating.slices?.[pascal];
				if (sliceGate && !isActive(sliceGate)) {
					delete choices[choiceId];
				}
			}
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

const fieldReference = collectFieldReference();
writeIfChanged('src/lib/generated/prismic-field-reference.json', fieldReference);
console.log(`✓ src/lib/generated/prismic-field-reference.json (${fieldReference.length} fields)`);
