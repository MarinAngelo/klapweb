/**
 * Cart transport format, shared by browser and server.
 *
 * The cart only ever sends references ("leistung:chat-bot,page:deine-website-basis").
 * Labels and prices are always resolved again on the server — never trusted from the browser.
 */

export type CartItemType = 'leistung' | 'page';
export type CartItemRef = { type: CartItemType; uid: string };

export const MAX_CART_ITEMS = 20;

const UID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,99}$/i;

export function serializeCart(items: CartItemRef[]): string {
	return items.map((item) => `${item.type}:${item.uid}`).join(',');
}

/** Parses and validates a cart spec; unknown types, invalid UIDs and duplicates are dropped */
export function parseCartSpec(spec: string | null | undefined): CartItemRef[] {
	const seen = new Set<string>();
	const items: CartItemRef[] = [];
	for (const part of (spec ?? '').split(',')) {
		const [type, uid] = part.trim().split(':');
		if ((type !== 'leistung' && type !== 'page') || !uid || !UID_PATTERN.test(uid)) continue;
		const key = `${type}:${uid}`;
		if (seen.has(key)) continue;
		seen.add(key);
		items.push({ type, uid });
		if (items.length >= MAX_CART_ITEMS) break;
	}
	return items;
}
