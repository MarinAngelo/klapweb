export function addMarginIfLastIsHeading(richTextDiv: HTMLElement) {
	if (!richTextDiv) return;
	const headings = richTextDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
	headings.forEach((h) => (h.style.marginBottom = ''));
	if (headings.length === 0) return;
	const lastHeading = headings[headings.length - 1];
	let next = lastHeading.nextElementSibling;
	let onlyWhitespaceOrEmpty = true;
	while (next) {
		if (next.offsetParent !== null && next.textContent.trim() !== '') {
			onlyWhitespaceOrEmpty = false;
			break;
		}
		next = next.nextElementSibling;
	}
	if (onlyWhitespaceOrEmpty) {
		lastHeading.style.marginBottom = '2rem';
	}
}
