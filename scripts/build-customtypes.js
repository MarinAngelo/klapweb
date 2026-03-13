/**
 * build-customtypes.js
 * Generates customtypes/*\/index.json and src/lib/slices/*\/model.json
 * from base.json + enabled feature definitions.
 *
 * Plan resolution (slicemachine.config.json):
 *   "plan": "professional"   → looks up features in plans.json
 *   "features": ["ecommerce"] → used directly (overrides plan)
 *
 * Feature files in customtypes/_features/<feature>/:
 *   page.json / settings.json:
 *     {
 *       "_meta": {
 *         "insertBefore": "<tab-name>" | null,  // null = append at end
 *         "sliceChoices": ["preisvergleich", ...]  // slice IDs to add to Slice Zone
 *       },
 *       "<Tab Name>": { ...fields }
 *     }
 *   slices.json:
 *     { "<SliceName>": ["variationId", ...] }  // variations to add to slice model
 *   customtypes/<typeName>/index.json:
 *     Full custom type definition — copied to customtypes/<typeName>/index.json (gitignored)
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

// Resolve features: direct "features" array takes precedence, otherwise resolve from "plan"
let features = [];
if (Array.isArray(config.features)) {
	features = config.features;
} else if (config.plan) {
	const plansPath = join(ROOT, 'plans.json');
	if (!existsSync(plansPath)) {
		console.error('✗ plans.json not found but "plan" is set in slicemachine.config.json');
		process.exit(1);
	}
	const plans = JSON.parse(readFileSync(plansPath, 'utf-8'));
	function resolveFeatures(planKey) {
		const plan = plans[planKey];
		if (!plan) {
			console.error(`✗ Plan "${planKey}" not found in plans.json`);
			process.exit(1);
		}
		const inherited = plan.extends ? resolveFeatures(plan.extends) : [];
		const own = plan.features ?? [];
		return [...inherited, ...own.filter((f) => !inherited.includes(f))];
	}

	features = resolveFeatures(config.plan);
	console.log(`Plan: ${config.plan} (${plans[config.plan].label}) → features: [${features.join(', ') || 'none'}]`);
}

// ── 1. Custom Types ────────────────────────────────────────────────────────────

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

		const featureFile = read(featurePath);
		const meta = featureFile._meta ?? {};
		const insertBefore = meta.insertBefore ?? null;
		const sliceChoices = meta.sliceChoices ?? [];

		// Add feature tabs
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

		// Add slice choices to Slice Zone fields
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

// ── 2. Slice Models ────────────────────────────────────────────────────────────

// Collect all variation IDs to add per slice from enabled features
const sliceVariationsToAdd = {}; // { SliceName: Set<variationId> }

for (const feature of features) {
	const slicesPath = `customtypes/_features/${feature}/slices.json`;
	if (!existsSync(join(ROOT, slicesPath))) continue;

	const slicesDef = read(slicesPath);
	for (const [sliceName, variationIds] of Object.entries(slicesDef)) {
		if (!sliceVariationsToAdd[sliceName]) sliceVariationsToAdd[sliceName] = new Set();
		for (const id of variationIds) sliceVariationsToAdd[sliceName].add(id);
	}
}

// Find all slices that have a base.json (managed slices)
const slicesDir = join(ROOT, 'src/lib/slices');
const allSlices = readdirSync(slicesDir, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => d.name);

for (const sliceName of allSlices) {
	const basePath = `src/lib/slices/${sliceName}/base.json`;
	if (!existsSync(join(ROOT, basePath))) continue; // not managed, skip

	const base = read(basePath);
	const fullModelPath = `src/lib/slices/${sliceName}/model.json`;

	const additionalVariationIds = sliceVariationsToAdd[sliceName] ?? new Set();

	if (additionalVariationIds.size === 0) {
		// No features add variations → use base as-is
		write(fullModelPath, base);
		console.log(`✓ slices/${sliceName}/model.json (base only)`);
		continue;
	}

	// Read the full model to get the variation definitions
	// We stored the full model as model.json before; now we need the variation objects.
	// They're stored in the feature's slices.json? No — the variation objects are complex.
	// We kept them in the original model.json before gitignoring it.
	// Solution: read from a "full.json" that we create once.
	const fullPath = `src/lib/slices/${sliceName}/full.json`;
	if (!existsSync(join(ROOT, fullPath))) {
		console.warn(`⚠ ${sliceName}/full.json missing — run npm run build-customtypes:init first`);
		continue;
	}

	const full = read(fullPath);
	const variationsToAdd = full.variations.filter((v) => additionalVariationIds.has(v.id));

	const model = {
		...base,
		variations: [...base.variations, ...variationsToAdd]
	};

	write(fullModelPath, model);
	console.log(
		`✓ slices/${sliceName}/model.json (+${[...additionalVariationIds].join(', ')})`
	);
}

// ── 3. Feature-only Custom Types ───────────────────────────────────────────────

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
