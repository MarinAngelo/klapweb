import { writable } from 'svelte/store';

export function useOpenIndex() {
	let openIndex = writable<number | null>(null);

	function toggleItem(index: number) {
		openIndex.update((current) => (current === index ? null : index));
	}

	return { openIndex, toggleItem };
}
