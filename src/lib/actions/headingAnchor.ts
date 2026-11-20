export function headingAnchor(node: HTMLElement) {
	const text = node.textContent?.trim() || '';
	if (text) node.id = text;
}
