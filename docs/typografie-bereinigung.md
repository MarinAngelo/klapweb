# Typografie-Bereinigung – März 2026

## Ziel

- Einheitliche, konsistente Typografie ohne Überschneidungen zwischen HTML-Tags und RichText-Labels.
- Semantik bleibt erhalten: Überschriften = h1–h6, Fließtext = p/li, Spezialfälle über eigene Labels.

## Änderungen

1. **Alle span-Labels für Überschriften (rt-h1 bis rt-h6) entfernt**
   - Überschriften werden nur noch über HTML-Tags (h1–h6) gestylt.
   - Keine parallelen Styles mehr für span-Labels.

2. **h1–h6 Labels in allen Slices entfernt**
   - In Prismic können Redakteure keine h1–h6 Labels mehr auswählen.
   - Betrifft: Titelbereich, Text, TextAndCta.

3. **Spezial-Label `.rt-title` eingeführt**
   - Für große, nicht-semantische Titel (z.B. p mit Titel-Optik).
   - Beispiel: `<p class="rt-title">Wichtiger Hinweis</p>`

4. **Alle anderen Formatierungs-Labels (Größe, Gewicht, Spacing etc.) bleiben erhalten**
   - Können weiterhin für individuelle Anpassungen genutzt werden.

## Vorteile

- Keine doppelten oder widersprüchlichen Styles mehr
- Klare Trennung von Semantik und Optik
- Einfachere Wartung und Erweiterung
- Redakteure können keine falschen Überschriften-Labels mehr setzen

---

Letzte Änderung: 25.03.2026
