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

export default defineConfig({
	plugins: [servePagefindIndex(), sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 5173,
		strictPort: true,
		fs: {
			allow: ['..']
		}
	}
});
