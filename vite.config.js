import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';

const PAGEFIND_DIR = join(process.cwd(), 'build', 'pagefind');
const MIME = {
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.wasm': 'application/wasm'
};

/**
 * Website search locally: `npm run dev` and `vite preview` serve the Pagefind index of the last
 * `npm run build` (build/pagefind/) under /pagefind/. On Netlify the files are static anyway.
 */
function servePagefindIndex() {
	const middleware = (req, res, next) => {
		const url = (req.url ?? '').split('?')[0];
		if (!url.startsWith('/pagefind/')) return next();
		const file = normalize(join(PAGEFIND_DIR, decodeURIComponent(url.slice('/pagefind/'.length))));
		if (!file.startsWith(PAGEFIND_DIR + sep) || !existsSync(file) || !statSync(file).isFile()) {
			return next();
		}
		res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.end(readFileSync(file));
	};
	return {
		name: 'serve-pagefind-index',
		configureServer: (server) => void server.middlewares.use(middleware),
		configurePreviewServer: (server) => void server.middlewares.use(middleware)
	};
}

const PRISMIC_POLL_MS = 5000;

/**
 * Dev only: reload the browser when something is published in Prismic. Polls the repository's
 * master ref (changes with every publish); a webhook could not reach localhost. Drafts that are
 * only saved do not change it — for those use the Prismic preview on localhost.
 */
function reloadOnPrismicPublish() {
	return {
		name: 'reload-on-prismic-publish',
		apply: 'serve',
		configureServer(server) {
			let lastRef = null;
			let lastRepo = null;
			const poll = async () => {
				try {
					// Read every time: the branch (and with it the repository) may change while running
					const repo = JSON.parse(readFileSync('slicemachine.config.json', 'utf8')).repositoryName;
					const res = await fetch(`https://${repo}.cdn.prismic.io/api/v2`);
					if (!res.ok) return;
					const ref = (await res.json()).refs?.find((r) => r.isMasterRef)?.ref;
					if (ref && repo === lastRepo && lastRef && ref !== lastRef) {
						server.config.logger.info(
							`Prismic: neue Veröffentlichung in «${repo}» → Seite neu laden`,
							{
								timestamp: true
							}
						);
						server.ws.send({ type: 'full-reload' });
					}
					lastRef = ref ?? lastRef;
					lastRepo = repo;
				} catch {
					// offline / VPN: try again with the next poll
				}
			};
			poll();
			const timer = setInterval(poll, PRISMIC_POLL_MS);
			server.httpServer?.on('close', () => clearInterval(timer));
		}
	};
}

export default defineConfig({
	plugins: [servePagefindIndex(), reloadOnPrismicPublish(), sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 5173,
		strictPort: true,
		fs: {
			allow: ['..']
		}
	}
});
