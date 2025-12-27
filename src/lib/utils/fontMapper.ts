// src/lib/utils/fontMapper.ts

// Die Keys (links) müssen EXAKT so geschrieben sein wie in den Prismic-Optionen.
// Groß/Kleinschreibung beachten!
export const fontScales: Record<string, string> = {
    'Sehr Klein': '14px',  // entspricht xs
    'Klein': '15px',       // entspricht sm
    'Mittel': '16px',      // entspricht base (Standard)
    'Gross': '18px',        // entspricht lg
    'Sehr Gross': '20px'    // entspricht xl
};

export function getFontSize(prismicValue: string | null | undefined): string {
    // 1. Wenn nichts gewählt ist -> Standard 16px
    if (!prismicValue) return '16px';

    // 2. Wir versuchen, den Wert im Object zu finden
    const size = fontScales[prismicValue];

    // 3. Wenn gefunden, zurückgeben. Sonst Fallback auf 16px.
    return size || '16px';
}