import { execFileSync } from 'node:child_process';

const allowedFiles = new Set([
	'src/lib/components/InputField.svelte',
	'src/lib/components/Checkbox.svelte',
	'src/lib/components/FileField.svelte'
]);
const controlPattern = /<\s*(input|select|textarea)\b/i;
const technicalPattern = /type\s*=\s*["'](?:hidden|color)["']/i;

let diff;
try {
	diff = execFileSync('git', ['diff', '--cached', '--unified=0', '--', '*.svelte'], {
		encoding: 'utf8'
	});
} catch (error) {
	console.error('Formularfeld-Check konnte git diff nicht lesen.');
	process.exit(error.status || 1);
}

let currentFile = '';
const violations = [];
for (const line of diff.split('\n')) {
	const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
	if (fileMatch) {
		currentFile = fileMatch[1];
		continue;
	}
	if (!line.startsWith('+') || line.startsWith('+++') || !controlPattern.test(line)) continue;
	if (allowedFiles.has(currentFile) || technicalPattern.test(line)) continue;
	violations.push(`${currentFile}: ${line.slice(1).trim()}`);
}

if (violations.length > 0) {
	console.error('Direkte benutzereingaberelevante HTML-Felder sind nicht erlaubt:');
	console.error(violations.join('\n'));
	console.error(
		'Bitte InputField.svelte verwenden oder einen dokumentierten technischen Sonderfall schaffen.'
	);
	process.exit(1);
}

console.log('Formularfeld-Check erfolgreich.');
