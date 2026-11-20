import { writable } from 'svelte/store';

export interface AddonRowFormatted {
	label: string;
	price: string;
	billingType: string | null;
}

export const addonRows = writable<AddonRowFormatted[]>([]);
