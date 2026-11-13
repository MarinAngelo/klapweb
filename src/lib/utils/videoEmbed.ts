/**
 * Turns a pasted video embed code (<iframe src="…">) or video URL into a player URL.
 * Only the src is used — the pasted HTML itself is never rendered.
 */
export function videoPlayerSrc(code: string | null | undefined): string {
	const value = (code ?? '').trim();
	if (!value) return '';

	const iframeSrc = value.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
	const raw = (iframeSrc ?? value).replace(/&amp;/g, '&');

	let url: URL;
	try {
		url = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
	} catch {
		return '';
	}
	if (url.protocol !== 'https:') return '';

	// Page URLs → player URLs (in case a normal link is pasted into the code field)
	const host = url.hostname.replace(/^www\./, '');
	if (host === 'vimeo.com') {
		const [id, hash] = url.pathname.split('/').filter(Boolean);
		if (/^\d+$/.test(id ?? '')) {
			return `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ''}`;
		}
	}
	if (host === 'youtube.com' && url.pathname === '/watch' && url.searchParams.get('v')) {
		return `https://www.youtube-nocookie.com/embed/${url.searchParams.get('v')}`;
	}
	if (host === 'youtu.be') {
		return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
	}
	return url.toString();
}
