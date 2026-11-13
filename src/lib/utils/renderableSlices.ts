/**
 * Slices Prismic delivers without content (no `primary`/`variation`): happens when the slice's
 * variation was removed from the model in Prismic (e.g. pushed from a branch whose plan does not
 * include it). Rendering them would crash the page — and the whole prerender/build.
 * They are skipped (warning in the log); «Inhalte prüfen» lists them.
 */
export function renderableSlices<T>(slices: T[] | null | undefined): T[] {
	return (slices ?? []).filter((slice) => {
		const s = slice as { primary?: unknown; variation?: unknown; slice_type?: string; id?: string };
		const ok = !!s?.primary && !!s?.variation;
		if (!ok) {
			console.warn(
				`[slices] Inhalts-Element ohne Inhalt übersprungen: ${s?.slice_type ?? '?'} (${s?.id ?? '?'}) — Variante fehlt im Prismic-Modell`
			);
		}
		return ok;
	});
}
