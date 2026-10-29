import { derived, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { MAX_CART_ITEMS, type CartItemType } from '$lib/utils/cartSpec';

/**
 * Shopping cart (Leistungen + package pages), kept in the visitor's browser.
 * Label and price are a snapshot for display only; checkout resolves them again on the server.
 * Registered as functional service "cart" in consent/services.ts.
 */

export type CartItem = {
	type: CartItemType;
	uid: string;
	label: string;
	/** Display price in the base currency at the time of adding (null = on request) */
	price: number | null;
	billingType: string | null;
};

const STORAGE_KEY = 'klap_cart';

function load(): CartItem[] {
	if (!browser) return [];
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
		return Array.isArray(stored) ? stored.filter((i) => i?.type && i?.uid) : [];
	} catch {
		return [];
	}
}

export const cart = writable<CartItem[]>(load());

cart.subscribe((items) => {
	if (!browser) return;
	try {
		if (items.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
		else localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Storage blocked → cart lasts for this page view only
	}
});

// Keep several open tabs in sync
if (browser) {
	window.addEventListener('storage', (event) => {
		if (event.key === STORAGE_KEY) cart.set(load());
	});
}

export const cartCount = derived(cart, ($cart) => $cart.length);

export function addToCart(item: CartItem) {
	cart.update((items) =>
		items.some((i) => i.type === item.type && i.uid === item.uid) || items.length >= MAX_CART_ITEMS
			? items
			: [...items, item]
	);
}

export function removeFromCart(type: CartItemType, uid: string) {
	cart.update((items) => items.filter((i) => !(i.type === type && i.uid === uid)));
}

export function clearCart() {
	cart.set([]);
}
