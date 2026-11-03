/**
 * In-page search (Schaltfläche variation «Suche»): searches the text of the current page
 * (main content, including collapsed accordion entries) and jumps to the match.
 * Runs on the rendered DOM → works everywhere (dev, preview, live), no index needed.
 */

export type PageHit = {
	element: HTMLElement;
	/** Nearest heading / accordion title above the match */
	title: string;
	/** Escaped text with <mark> around the search words */
	excerpt: string;
};

/** Text blocks that can be a hit (smallest meaningful units) */
const BLOCKS = 'p, li, h1, h2, h3, h4, h5, h6, td, th, dt, dd, blockquote, figcaption, button';
const HEADINGS = 'h1, h2, h3, h4, h5, h6, .accordion-title, .acc-item-text';
const EXCERPT_CHARS = 140;

/** Case- and accent-insensitive comparison («Grösse» = «grosse», «é» = «e») */
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const escapeHtml = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const words = (query: string) => fold(query).split(/\s+/).filter(Boolean);

/** Excerpt around the first match, search words marked (NFD folding keeps the length for Latin text) */
function excerptOf(text: string, terms: string[]): string {
	const folded = fold(text);
	const first = Math.min(...terms.map((t) => folded.indexOf(t)).filter((i) => i >= 0));
	const start = Math.max(0, first - 40);
	const end = Math.min(text.length, start + EXCERPT_CHARS);
	const part = text.slice(start, end);
	const foldedPart = folded.slice(start, end);

	// Mark ranges of all terms in the excerpt
	const ranges: [number, number][] = [];
	for (const term of terms) {
		for (let i = foldedPart.indexOf(term); i >= 0; i = foldedPart.indexOf(term, i + term.length)) {
			ranges.push([i, i + term.length]);
		}
	}
	ranges.sort((a, b) => a[0] - b[0]);
	let html = '';
	let pos = 0;
	for (const [from, to] of ranges) {
		if (from < pos) continue;
		html += escapeHtml(part.slice(pos, from)) + `<mark>${escapeHtml(part.slice(from, to))}</mark>`;
		pos = to;
	}
	html += escapeHtml(part.slice(pos));
	return (start > 0 ? '… ' : '') + html + (end < text.length ? ' …' : '');
}

/** Nearest heading before the element in document order */
function headingFor(element: HTMLElement, headings: HTMLElement[]): string {
	let title = '';
	for (const heading of headings) {
		if (heading === element || heading.contains(element)) break;
		if (heading.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) {
			title = heading.textContent?.trim() ?? '';
		} else break;
	}
	return title;
}

/** All blocks of `root` containing every search word */
export function searchPage(root: HTMLElement, query: string, max = 20): PageHit[] {
	const terms = words(query);
	if (!terms.length) return [];
	const headings = [...root.querySelectorAll<HTMLElement>(HEADINGS)];
	const hits: PageHit[] = [];
	for (const element of root.querySelectorAll<HTMLElement>(BLOCKS)) {
		if (element.closest('[data-page-search-ignore]')) continue;
		// Only the innermost block (a <li> containing a <p> → the <p> is the hit)
		if (element.querySelector(BLOCKS)) continue;
		const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
		if (!text) continue;
		const folded = fold(text);
		if (!terms.every((t) => folded.includes(t))) continue;
		const isHeading = element.matches(HEADINGS) || !!element.closest(HEADINGS);
		hits.push({
			element,
			title: isHeading ? text : headingFor(element, headings) || text.slice(0, 60),
			excerpt: excerptOf(text, terms)
		});
		if (hits.length >= max) break;
	}
	return hits;
}

/**
 * Makes the hit visible: opens a collapsed accordion entry / <details>, scrolls to it and
 * highlights it briefly.
 */
export async function revealHit(element: HTMLElement): Promise<void> {
	const details = element.closest('details');
	if (details && !details.open) details.open = true;

	// Accordion (Akkordeon slice): closed body → click the entry's button
	const body = element.closest('.collapse-body');
	if (body && !body.classList.contains('is-open')) {
		const toggle = body
			.closest('.acc-row')
			?.querySelector<HTMLButtonElement>('button[aria-expanded]');
		toggle?.click();
		// Wait for the opening transition
		await new Promise((resolve) => setTimeout(resolve, 350));
	}

	element.scrollIntoView({ behavior: 'smooth', block: 'center' });
	element.classList.remove('page-search-hit');
	// Restart the animation when the same hit is chosen twice
	void element.offsetWidth;
	element.classList.add('page-search-hit');
	setTimeout(() => element.classList.remove('page-search-hit'), 2600);
}
