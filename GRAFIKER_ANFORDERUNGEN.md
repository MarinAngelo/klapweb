# Anforderungen für Grafiker — Logos, Favicons & Social Images

## 1. LOGOS

### Formate & Lieferumfang
- **SVG** (Hauptformat) — MUSS sein!
  - Vector-basiert, skalierbar
  - ViewBox exakt um das Logo (KEIN Padding/Ränder)
  - Pfade optimiert, keine eingebetteten Raster-Bilder
  - Größe unter 50KB
  
- **PNG** (Fallback)
  - Mindestens 2000x2000px
  - Transparent (keine weißen Ränder!)
  - Crop-to-Content vor Export
  
- **PDF** (für Print)
  - CMYK-Farbraum
  - Alle Schriften in Kurven konvertiert

### Varianten
- Logo mit Tagline/Text
- Logo ohne Text
- Monochrom (schwarz/weiß)
- Negative Version (für dunkle Hintergründe)
- Favicon-Version (auch vereinfacht, wenn nötig)

### Farbangaben
- RGB-Farben (für Web)
- CMYK-Farben (für Print)
- Hex-Codes (#RRGGBB)

---

## 2. FAVICONS

### Format & Größen
- **SVG** (modernes Standard-Format)
  - ViewBox: "0 0 64 64" oder "0 0 32 32"
  - Einfach, keine feinen Details
  
- **ICO** (Legacy-Support)
  - 16x16, 32x32, 48x48 px (alle in einer Datei)
  - Transparent Background
  
- **PNG** (Backup)
  - 32x32, 64x64, 128x128, 256x256 px (einzelne Dateien)
  - Transparent

### Anforderungen
- Einfaches, erkennbares Design
- Funktioniert auch sehr klein (16x16)
- Einzelne Farbe oder max. 2-3 Farben
- Keine feinen Linien oder Text

---

## 3. SOCIAL MEDIA IMAGES

### Instagram
- **Quadratisch:** 1080x1080 px
- **Stories:** 1080x1920 px
- **Reels/Video:** 1080x1920 px (9:16)
- Format: PNG oder JPG

### Facebook
- **Page Cover:** 820x312 px
- **Post:** 1200x628 px
- **Story:** 1080x1920 px
- Format: JPG (Web-optimiert)

### LinkedIn
- **Post:** 1200x627 px
- **Banner:** 1500x500 px
- Format: JPG

### Twitter/X
- **Post:** 1024x512 px (2:1)
- **Header:** 1500x500 px
- Format: JPG

### Allgemein (alle Plattformen)
- **PNG für Grafiken** (mit Transparenz)
- **JPG für Fotos** (komprimiert)
- **Max. Dateigröße:** 5 MB (Web)
- **Color Space:** sRGB
- **DPI:** 72 DPI (Web), 300 DPI (Print-Derivate)

---

## 4. DATEIORGANISATION & ÜBERGABE

### Ordnerstruktur
```
Grafikpaket/
├── Logos/
│   ├── Logo_mit_Tagline.svg
│   ├── Logo_mit_Tagline.png
│   ├── Logo_ohne_Tagline.svg
│   ├── Logo_ohne_Tagline.png
│   ├── Logo_Monochrom.svg
│   └── Logo_Negativ.svg
├── Favicons/
│   ├── favicon.svg
│   ├── favicon.ico
│   └── favicon-192.png (etc.)
├── SocialMedia/
│   ├── Instagram_1080x1080.png
│   ├── Instagram_Stories_1080x1920.png
│   ├── Facebook_Cover_820x312.png
│   ├── LinkedIn_1200x627.png
│   └── Twitter_1024x512.png
└── Quellformat/
    ├── Logo.ai (Adobe Illustrator)
    ├── Logo.psd (Photoshop)
    └── Fonts_Used.txt
```

### Dokumentation
- **Fonts_Used.txt:** Welche Schriften wurden verwendet?
- **Color_Specs.txt:** RGB, CMYK, Hex-Codes
- **Notes.txt:** Design-Richtlinien, Mindest-Größen, etc.

---

## 5. EXPORT-CHECKLISTE FÜR SVG

- [ ] ViewBox ist **exakt um den Inhalt** (kein unnötiges Padding)
- [ ] Keine eingebetteten Raster-Bilder
- [ ] Alle Schriften als Pfade konvertiert (oder Fonts angeben)
- [ ] Dateigröße unter 50KB
- [ ] Kommentare/Metadaten entfernt
- [ ] `enable-background` Attribute überprüft
- [ ] Getestet in Chrome, Firefox, Safari

---

## 6. EXPORT-CHECKLISTE FÜR PNG

- [ ] Transparenter Hintergrund (Alpha-Channel)
- [ ] **Crop-to-Content:** Kein unnötiger Rand um die Grafik
- [ ] Größe: Mind. 2000x2000 px für Logos
- [ ] Optimiert mit TinyPNG/ImageOptim (max 1-2 MB)
- [ ] In mehreren Größen (1x, 2x Retina)

---

## 7. EXPORT-EINSTELLUNGEN (Adobe Illustrator)

### Für SVG
1. File → Export As → Format: SVG
2. SVG Options:
   - ✅ Responsive
   - ✅ Remove Unused Attributes
   - ✅ Transform to Shapes
   - ❌ Embed Raster Images (immer NEIN)
   - Decimal Places: 2-3

### Für PNG
1. File → Export As → Format: PNG
2. PNG Options:
   - Resolution: 72 DPI
   - ✅ Transparent Background
   - ✅ Interlaced (optional)
3. VOR Export: Select All → Object → Artboard to Selection (um Crop zu machen)

---

## 8. QUALITÄTSPRÜFUNG

**Vor Übergabe überprüfen:**
- [ ] Alle Dateien vorhanden?
- [ ] Keine weißen/transparenten Ränder?
- [ ] SVG in mehreren Browsern getestet?
- [ ] Logos in verschiedenen Größen lesbar?
- [ ] Favicons auch 16x16 noch erkennbar?
- [ ] Social Media Images richtige Proportionen?
- [ ] Alle Fonts embedded oder konvertiert?
- [ ] Keine fehlerhaften Referenzen oder Links?

---

**Hinweis:** Diese Anforderungen müssen **VOR Beauftragung** dem Grafiker übergeben werden.
