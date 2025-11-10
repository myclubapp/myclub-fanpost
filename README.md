## KANVA – Wo Emotionen zu Stories werden

Erstelle automatisch Social Media Posts aus deinen Spielen – schnell, authentisch und im Look deines Teams.

![KANVA logo](./src/assets/logo.png)

---

### Features

- **Sportarten**: Unihockey, Volleyball & Handball
- **Geführter Flow**: Sportart → Club → Team → Spielauswahl
- **Mehrfachauswahl**: Mehrere Spiele gleichzeitig auswählen
- **Saubere URLs**: Teilbare Deep-Links inkl. Mehrfach-Spiel-IDs
- **E-Mail-Benachrichtigungen**: Automatische Spieltag-Erinnerungen und Post-Ankündigungen
- **Team-Slots**: Verwalte mehrere Teams gleichzeitig und erhalte personalisierte E-Mails
- **Bilder-Verwaltung**: Upload und Verwaltung von Team-, Club- und Sponsor-Logos (Pro/Premium)
- **Sponsoren-Integration**: Eigene Sponsoren-Logos in Templates einbinden
---

### Datenquellen

- Club-/Team-/Spieldaten für Unihockey werden über eine Cloud-Function als GraphQL-ähnliche Abfrage geladen. Die URLs sind im Code hinterlegt (siehe `Index.tsx`). 

Hinweis: Netzwerkfehler werden geloggt, die UI bleibt bedienbar.

---

### Nutzung (Kurz)

1. Sportart wählen
2. Club suchen und wählen
3. Team wählen
4. Spiel(e) wählen – Mehrfachauswahl möglich
5. Vorschau ansehen und Bild exportieren/teilen

Deep-Linking: Die aktuelle Auswahl spiegelt sich in der URL wider und kann geteilt werden.

---


## SVG to PNG Export – Technische Dokumentation

### Überblick

Die Anwendung konvertiert SVG-Templates in hochauflösende PNG-Bilder für Social Media (insbesondere Instagram). Der Export-Prozess stellt sicher, dass alle Texte mit den korrekten Schriftarten und alle Bilder korrekt gerendert werden.

### Verwendete Pakete

#### 1. **html2canvas** (v1.4.1)
- **Zweck**: Hauptbibliothek für das Rendering von DOM-Elementen (einschliesslich SVG) auf Canvas
- **Verwendung**: Konvertiert das gemountete SVG-Element in ein Canvas-Element
- **Package.json**: `"html2canvas": "^1.4.1"`

#### 2. **fontkit** (v2.0.4)
- **Zweck**: Font-Parser für das Laden und Verarbeiten von Schriftarten
- **Verwendung**:
  - Parst WOFF2-Schriftdateien
  - Extrahiert Glyph-Informationen
  - Ermöglicht Text-zu-Pfad-Konvertierung (falls notwendig)
- **Package.json**: `"fontkit": "^2.0.4"`

#### 3. **canvg** (v4.0.3)
- **Zweck**: SVG-zu-Canvas Rendering Library
- **Verwendung**: Wird als Fallback-Option bereitgestellt (aktuell nicht aktiv genutzt)
- **Package.json**: `"canvg": "^4.0.3"`

#### 4. **save-svg-as-png** (v1.4.17)
- **Zweck**: Utility für SVG-zu-PNG-Konvertierung
- **Verwendung**: Wird als Fallback-Option bereitgestellt (aktuell nicht aktiv genutzt)
- **Package.json**: `"save-svg-as-png": "^1.4.17"`

#### 5. **opentype.js** (v1.3.4)
- **Zweck**: OpenType/TrueType Font-Parser
- **Verwendung**: Alternative Font-Parsing-Lösung
- **Package.json**: `"opentype.js": "^1.3.4"`

---

### Export-Prozess (src/utils/svgToImage.ts)

Die Hauptfunktion `convertSvgToImage()` durchläuft folgende Schritte:

#### Phase 1: SVG-Vorbereitung (10-20%)
1. **SVG klonen**: Original-SVG wird geklont, um Modifikationen zu vermeiden
2. **Offscreen-Mounting**: SVG wird temporär ausserhalb des Viewports gemountet
   ```typescript
   svgClone.style.position = 'absolute';
   svgClone.style.left = '-100000px';
   ```

#### Phase 2: Bild-Inlining (20-60%)
**Funktion**: `inlineAllImages()`

1. **Bildquellen identifizieren**: Alle `<image>`-Elemente im SVG werden extrahiert
2. **HTTP-URLs zu Data-URLs konvertieren**:
   ```typescript
   // Direkte Fetch mit CORS
   const response = await fetch(url, { mode: 'cors' });
   const blob = await response.blob();
   const dataUrl = await blobToDataUrl(blob);
   ```
3. **Proxy-Fallback**: Bei CORS-Fehlern wird ein Supabase-Proxy verwendet:
   ```typescript
   const proxyUrl = 'https://rgufivgtyonitgjlozog.functions.supabase.co/image-proxy?url=' + encodeURIComponent(url);
   ```
4. **Data-URLs einbetten**: Konvertierte Bilder werden direkt im SVG als `data:image/...` eingebettet

#### Phase 3: Font-Management (60-70%)
**Funktion**: `embedFontsInSvg()` und `buildFontFaceCssWithDataUrls()`

##### 3.1 Font-Konfiguration (src/config/fonts.ts)
Alle Schriftarten sind zentral definiert:
```typescript
export const AVAILABLE_FONTS: Record<string, FontConfig> = {
  'bebas-neue': {
    displayName: 'Bebas Neue',
    cssFamily: 'Bebas Neue',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=block',
    variants: [
      {
        weight: '400',
        style: 'normal',
        url: 'https://fonts.gstatic.com/s/bebasneue/v16/JTUSjIg69CK48gW7PXoo9WdhyyTh89ZNpQ.woff2'
      }
    ]
  },
  // ... weitere Schriftarten (Roboto, Open Sans, Lato, Montserrat)
}
```

##### 3.2 Verwendete Schriftarten extrahieren
```typescript
const extractUsedFontFamilies = (svgElement: SVGSVGElement): Set<string> => {
  const fontFamilies = new Set<string>();

  // Alle Elemente durchsuchen
  svgElement.querySelectorAll('*').forEach((element) => {
    const computedStyle = window.getComputedStyle(element);
    const fontFamily = computedStyle.fontFamily;

    // Font-Namen normalisieren und hinzufügen
    const normalized = normalizeFontFamilyName(fontFamily);
    if (normalized) fontFamilies.add(normalized);
  });

  return fontFamilies;
}
```

##### 3.3 Font-URLs zu Data-URLs konvertieren
```typescript
const fontUrlToDataUrl = async (url: string): Promise<string> => {
  // WOFF2-Font von Google Fonts laden
  const response = await fetch(url);
  const blob = await response.blob();

  // Als Base64-Data-URL kodieren
  return await blobToDataUrl(blob);
}
```

##### 3.4 @font-face CSS-Regeln erstellen
```typescript
const fontFaceRule = `@font-face {
  font-family: '${fontConfig.cssFamily}';
  src: url('${fontDataUrl}') format('woff2');
  font-weight: ${variant.weight};
  font-style: ${variant.style};
  font-display: swap;
}`;
```

##### 3.5 Fonts im SVG einbetten
Die @font-face-Regeln werden in ein `<style>`-Element im SVG eingefügt:
```typescript
let styleElement = svgElement.querySelector('style');
if (!styleElement) {
  styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  svgElement.insertBefore(styleElement, svgElement.firstChild);
}
styleElement.textContent = fontFaceCss;
```

#### Phase 4: Canvas-Rendering (70-90%)
**Funktion**: `svgToPngDataUrl()`

1. **SVG-Klon für Rendering erstellen**:
   ```typescript
   const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
   svgClone.setAttribute('width', String(width * scale));
   svgClone.setAttribute('height', String(height * scale));
   ```

2. **Container erstellen und mounten**:
   ```typescript
   const container = document.createElement('div');
   container.style.position = 'fixed';
   container.style.width = `${width * scale}px`;
   container.style.height = `${height * scale}px`;
   container.appendChild(svgClone);
   document.body.appendChild(container);
   ```

3. **Font-Links temporär entfernen** (verhindert externe Font-Ladevorgänge):
   ```typescript
   const originalFontLinks = document.querySelectorAll(
     'link[data-template-fonts="true"], link[href*="fonts.googleapis.com"]'
   );
   originalFontLinks.forEach(link => link.remove());
   ```

4. **html2canvas ausführen**:
   ```typescript
   const capturedCanvas = await html2canvas(container, {
     width: width * scale,
     height: height * scale,
     scale: 1,
     backgroundColor: null,
     useCORS: true,
     allowTaint: false,
     foreignObjectRendering: true,
     onclone: async (clonedDoc) => {
       // Fonts im geklonten Dokument einbetten
       const fontFaceCss = await buildFontFaceCssWithDataUrls(usedFontsArray);
       const style = clonedDoc.createElement('style');
       style.textContent = fontFaceCss;
       clonedDoc.head.insertBefore(style, clonedDoc.head.firstChild);

       // Fonts laden
       await Promise.allSettled(loadPromises);
       await new Promise(r => setTimeout(r, 500));
     }
   });
   ```

5. **Finales Canvas mit Compositing erstellen**:
   ```typescript
   const finalCanvas = document.createElement('canvas');
   const finalCtx = finalCanvas.getContext('2d');

   // Hintergrund zeichnen
   finalCtx.fillStyle = backgroundColor;
   finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

   // Bilder direkt zeichnen (Background Layer)
   originalImages.forEach(async (img) => {
     const image = new Image();
     image.src = img.getAttribute('href');
     finalCtx.drawImage(image, x, y, imgWidth, imgHeight);
   });

   // html2canvas-Ergebnis darüber zeichnen (mit Text)
   finalCtx.drawImage(capturedCanvas, 0, 0);
   ```

#### Phase 5: Finalisierung (90-100%)

1. **Canvas zu Data-URL**:
   ```typescript
   const dataUrl = finalCanvas.toDataURL('image/png');
   ```

2. **Data-URL zu Blob**:
   ```typescript
   const arr = dataUrl.split(',');
   const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
   const bstr = atob(arr[1]);
   const u8arr = new Uint8Array(bstr.length);
   for (let i = 0; i < bstr.length; i++) {
     u8arr[i] = bstr.charCodeAt(i);
   }
   const blob = new Blob([u8arr], { type: mime });
   ```

3. **Cleanup**:
   ```typescript
   document.body.removeChild(container);
   // Font-Links wiederherstellen
   ```

---

### Export-Optionen

```typescript
interface ConversionOptions {
  width?: number;           // Standard: 1080
  height?: number;          // Standard: 1350
  scale?: number;           // Standard: 2 (für 2160x2700px Instagram)
  format?: 'png' | 'jpeg' | 'webp';  // Standard: 'png'
  backgroundColor?: string; // Standard: 'white'
  onProgress?: (progress: number, message: string) => void;
  onImageStatusUpdate?: (statuses: ImageLoadProgress[]) => void;
}
```

---

### Schriftarten-Rendering: Wie es funktioniert

#### 1. Font-Discovery
```typescript
// Text-Elemente durchsuchen
svgElement.querySelectorAll('text').forEach(textEl => {
  const fontFamily = textEl.getAttribute('font-family');
  // Font-Config finden
  const fontConfig = getFontConfig(normalizeFontFamilyName(fontFamily));
});
```

#### 2. Font-Loading
```typescript
// Fonts im Dokument laden (Font Loading API)
if (document.fonts && document.fonts.load) {
  for (const variant of fontConfig.variants) {
    const fontSpec = `${variant.style} ${variant.weight} 16px "${fontConfig.cssFamily}"`;
    await document.fonts.load(fontSpec);
  }
}
```

#### 3. Font-Embedding (3 Methoden für maximale Kompatibilität)

**Methode 1: @font-face im SVG**
```typescript
<svg>
  <style>
    @font-face {
      font-family: 'Bebas Neue';
      src: url('data:font/woff2;base64,...') format('woff2');
      font-weight: 400;
      font-style: normal;
    }
  </style>
  <text font-family="Bebas Neue">Text</text>
</svg>
```

**Methode 2: @font-face im Document Head**
```typescript
const style = document.createElement('style');
style.textContent = fontFaceCss;
document.head.appendChild(style);
```

**Methode 3: @font-face im geklonten Dokument (html2canvas)**
```typescript
onclone: async (clonedDoc) => {
  const style = clonedDoc.createElement('style');
  style.textContent = fontFaceCss;
  clonedDoc.head.insertBefore(style, clonedDoc.head.firstChild);
}
```

---

### Platform-spezifische Exports

```typescript
export const handlePlatformDownload = async (options: PlatformDownloadOptions) => {
  const result = await convertSvgToImage(svgElement, {
    width: 1080,
    height: 1350,
    scale: 2,  // 2x für Instagram: 2160x2700px
    format: 'png',
    backgroundColor: 'white'
  });

  if (isMobile) {
    // Native Share API verwenden
    const shareSuccess = await shareImageNative(result.blob, fileName);
    if (!shareSuccess) {
      // Fallback: Download
      downloadDataUrl(result.dataUrl, fileName);
    }
  } else {
    // Desktop: Direkter Download
    downloadDataUrl(result.dataUrl, fileName);
  }
}
```

---

### Troubleshooting

#### Problem: Schriftarten werden nicht korrekt gerendert
**Lösung**:
1. Font-Namen in `src/config/fonts.ts` überprüfen
2. Sicherstellen, dass `cssFamily` exakt mit dem Font-Namen im SVG übereinstimmt
3. Font-Varianten (weight/style) prüfen

#### Problem: Bilder erscheinen nicht im Export
**Lösung**:
1. CORS-Header der Bildquelle prüfen
2. Image-Proxy-URL in `fetchImageAsDataUrl()` überprüfen
3. Sicherstellen, dass Bilder vor dem Rendering vollständig geladen sind

#### Problem: Export ist langsam
**Lösung**:
1. `scale`-Parameter reduzieren (von 2 auf 1.5 oder 1)
2. Font-Caching nutzen (bereits implementiert in `fontCache`)
3. Weniger Font-Varianten laden

