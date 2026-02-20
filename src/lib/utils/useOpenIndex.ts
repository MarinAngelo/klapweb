import { writable } from 'svelte/store';

export function useOpenIndex(initialIndex: number | null = null) {
	let openIndex = writable<number | null>(initialIndex);

	function toggleItem(index: number) {
		openIndex.update((current) => (current === index ? null : index));
	}

	return { openIndex, toggleItem };
}
