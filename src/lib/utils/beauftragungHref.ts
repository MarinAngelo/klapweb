/**
 * If a link field targets the /beauftragung page, returns a URL with the
 * current page's UID appended as ?dienstleistung= so the checkout summary
 * can fetch the correct product price. Otherwise returns null.
 */
export function getBeauftragunHref(
	link: { uid?: string; url?: string } | null | undefined,
	currentUid: string | undefined
): string | null {
	if (!currentUid || !link) return null;
	const uid = link.uid ?? '';
	const url = link.url ?? '';
	const isBeauftragunLink =
		uid === 'beauftragung' || url === '/beauftragung' || url.endsWith('/beauftragung');
	return isBeauftragunLink
		? `/beauftragung?dienstleistung=${encodeURIComponent(currentUid)}`
		: null;
}
