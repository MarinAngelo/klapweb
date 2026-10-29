/**
 * gating.overrides.json — local feature switches of the agency editor (gitignored).
 *
 * Stored per Prismic repository, NOT per working directory: the file stays when switching
 * branches, so flat switches made on one branch would apply to another branch's repository
 * (e.g. features disabled for campelli → main deletes custom types on push).
 *
 * Format: { "repos": { "<repositoryName>": { enabled, disabled, admin_sections_disabled } } }
 * The old flat format { enabled, disabled, … } is ignored (with a warning) until saved again.
 *
 * Plain JS: used by scripts/build-customtypes.js (Node) and by server routes.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** @typedef {{ enabled: string[]; disabled: string[]; admin_sections_disabled: string[] }} GatingOverrides */

const FILE = 'gating.overrides.json';
const EMPTY = () => ({ enabled: [], disabled: [], admin_sections_disabled: [] });

/** @param {string} root */
function readFile(root) {
	const path = join(root, FILE);
	if (!existsSync(path)) return {};
	try {
		return JSON.parse(readFileSync(path, 'utf-8'));
	} catch {
		return {};
	}
}

/** @param {string} root */
function repositoryName(root) {
	return JSON.parse(readFileSync(join(root, 'slicemachine.config.json'), 'utf-8')).repositoryName;
}

/**
 * Overrides of the repository in slicemachine.config.json
 * @param {string} [root]
 * @returns {GatingOverrides}
 */
export function readOverrides(root = process.cwd()) {
	const file = readFile(root);
	if (!file.repos && (file.enabled?.length || file.disabled?.length)) {
		console.warn(
			`⚠ ${FILE}: altes Format ohne Repository wird ignoriert — Feature-Schalter im Agency-Editor neu speichern.`
		);
	}
	return { ...EMPTY(), ...(file.repos?.[repositoryName(root)] ?? {}) };
}

/**
 * Saves the overrides of the current repository; other repositories stay unchanged.
 * @param {GatingOverrides} overrides
 * @param {string} [root]
 */
export function writeOverrides(overrides, root = process.cwd()) {
	const file = readFile(root);
	const repos = { ...(file.repos ?? {}), [repositoryName(root)]: overrides };
	writeFileSync(join(root, FILE), JSON.stringify({ repos }, null, '\t') + '\n');
}
