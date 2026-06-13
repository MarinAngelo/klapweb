#!/usr/bin/env node
import { execSync } from 'child_process';

const ports = [5173, 9999];
const pids = new Set();

try {
	const output = execSync('lsof -i -P -n 2>/dev/null || true').toString();
	const lines = output.split('\n');

	lines.forEach(line => {
		ports.forEach(port => {
			if (line.includes(`:${port} (LISTEN)`)) {
				const pid = line.split(/\s+/)[1];
				if (pid && !isNaN(pid)) pids.add(pid);
			}
		});
	});

	if (pids.size > 0) {
		console.log(`🧹 Killing ${pids.size} old process(es): ${Array.from(pids).join(', ')}`);
		Array.from(pids).forEach(pid => {
			try {
				process.kill(-pid, 'SIGKILL');
			} catch (e) {
				// Process may already be gone
			}
		});
		// Wait for ports to be released
		setTimeout(() => process.exit(0), 1000);
	} else {
		console.log('✓ Ports 5173 & 9999 sind frei');
		process.exit(0);
	}
} catch (error) {
	// If lsof fails, just continue — some systems don't have it
	console.log('ℹ️  Port-Check übersprungen');
	process.exit(0);
}
