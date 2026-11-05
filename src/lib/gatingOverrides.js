/**
 * Agency feature switches of a customer branch — committed in its slicemachine.config.json
 * (branch-specific, protected on merges via .gitattributes `merge=ours`), so they apply in
 * production too:
 *
 *   "plan": "professional",
 *   "features": ["stundenabrechnung"],        // add-ons beyond the plan
 *   "featuresDisabled": ["newsletter"],       // plan features switched off
 *   "adminSectionsDisabled": ["kunden"]       // admin areas hidden
 *
 * Written by the agency editor (/agency/gating, local dev server only) and read by
 * scripts/build-customtypes.js and src/lib/server/features.ts (static import → build-time).
 *
 * The former gitignored gating.overrides.json only worked locally; entries still found there
 * are reported so they can be moved here.
 *
 * Plain JS: used by Node scripts and server routes.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

/** @typedef {{ enabled: string[]; disabled: string[]; admin_sections_disabled: string[] }} GatingOverrides */

const CONFIG = 'slicemachine.config.json';
const LEGACY_FILE = 'gating.overrides.json';

const list = (/** @type {unknown} */ value) =>
	Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];

/**
 * Switches from a slicemachine.config.json object (also used with a static import)
 * @param {any} config
 * @returns {GatingOverrides}
 */
export function overridesFromConfig(config) {
	return {
		enabled: list(config?.features),
		disabled: list(config?.featuresDisabled),
		admin_sections_disabled: list(config?.adminSectionsDisabled)
	};
}

/** @param {string} root */
const readConfig = (root) => JSON.parse(readFileSync(join(root, CONFIG), 'utf-8'));

/**
 * Switches of this branch (slicemachine.config.json)
 * @param {string} [root]
 * @returns {GatingOverrides}
 */
export function readOverrides(root = process.cwd()) {
	const config = readConfig(root);
	warnLegacy(root, config);
	return overridesFromConfig(config);
}

/**
 * Saves the switches into slicemachine.config.json (empty lists are omitted)
 * @param {GatingOverrides} overrides
 * @param {string} [root]
 */
export function writeOverrides(overrides, root = process.cwd()) {
	const config = readConfig(root);
	delete config.features;
	delete config.featuresDisabled;
	delete config.adminSectionsDisabled;
	if (overrides.enabled.length) config.features = [...overrides.enabled].sort();
	if (overrides.disabled.length) config.featuresDisabled = [...overrides.disabled].sort();
	if (overrides.admin_sections_disabled.length) {
		config.adminSectionsDisabled = [...overrides.admin_sections_disabled].sort();
	}
	writeFileSync(join(root, CONFIG), JSON.stringify(config, null, '\t') + '\n');
}

/**
 * Switches of this repository still only in the old local file (not in slicemachine.config.json)
 * @param {string} [root]
 * @returns {string[]} e.g. ["+stundenabrechnung", "-newsletter"]
 */
export function legacyOverridesMissing(root = process.cwd()) {
	if (!existsSync(join(root, LEGACY_FILE))) return [];
	try {
		const config = readConfig(root);
		const legacy = JSON.parse(readFileSync(join(root, LEGACY_FILE), 'utf-8'))?.repos?.[
			config.repositoryName
		];
		const current = overridesFromConfig(config);
		return [
			...list(legacy?.enabled)
				.filter((f) => !current.enabled.includes(f))
				.map((f) => `+${f}`),
			...list(legacy?.disabled)
				.filter((f) => !current.disabled.includes(f))
				.map((f) => `-${f}`)
		];
	} catch {
		return [];
	}
}

/**
 * slicemachine.config.json has changes that are not committed (local git) → they do not apply
 * in production yet. false if git is not available (e.g. Netlify build).
 * @param {string} [root]
 */
export function configUncommitted(root = process.cwd()) {
	try {
		return (
			execSync(`git status --porcelain -- ${CONFIG}`, {
				cwd: root,
				stdio: ['ignore', 'pipe', 'ignore']
			})
				.toString()
				.trim() !== ''
		);
	} catch {
		return false;
	}
}

let warned = false;
/** Entries of this repository still in the old local file → hint to move them */
function warnLegacy(/** @type {string} */ root, /** @type {any} */ config) {
	if (warned) return;
	warned = true;
	const missing = legacyOverridesMissing(root);
	if (missing.length) {
		console.warn(
			`⚠ ${LEGACY_FILE} (nur lokal, wirkt nicht in Production) enthält für ${config.repositoryName}: ${missing.join(', ')} — im Agency-Editor (/agency/gating) neu speichern oder in ${CONFIG} unter "features"/"featuresDisabled" eintragen.`
		);
	}
}
