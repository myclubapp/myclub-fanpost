/**
 * Optimized SVG to Image conversion for Instagram sharing
 * Uses resvg-js (Rust-based SVG renderer) with proper font support
 */

import { normalizeFontFamilyName, AVAILABLE_FONTS, getFontConfig } from '@/config/fonts';
import { Resvg } from '@resvg/resvg-js';

const DEFAULT_FONT_FAMILY = Object.values(AVAILABLE_FONTS)[0]?.cssFamily ?? 'Bebas Neue';

/**
 * Image loading status for progress tracking
 */
export interface ImageLoadProgress {
  url: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  size?: string;
  error?: string;
}

/**
 * Conversion options
 */
export interface ConversionOptions {
  width?: number;
  height?: number;
  scale?: number;
  format?: 'png' | 'jpeg' | 'webp';
  backgroundColor?: string;
  onProgress?: (progress: number, message: string) => void;
  onImageStatusUpdate?: (statuses: ImageLoadProgress[]) => void;
}

/**
 * Fetches font as ArrayBuffer for resvg-js
 */
const fetchFontAsBuffer = async (url: string): Promise<Uint8Array> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch font: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error(`Failed to fetch font: ${url}`, error);
    throw error;
  }
};

/**
 * Converts font URL to Data URL (for SVG embedding)
 */
const fontUrlToDataUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch font: ${response.status}`);
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch (error) {
    console.error(`Failed to convert font URL to data URL: ${url}`, error);
    throw error;
  }
};

/**
 * Loads fonts as buffers for resvg-js
 */
const loadFontsAsBuffers = async (fontFamilies: string[]): Promise<Uint8Array[]> => {
  if (typeof document === 'undefined' || fontFamilies.length === 0) {
    return [];
  }

  const fontBuffers: Uint8Array[] = [];

  for (const family of fontFamilies) {
    const fontConfig = getFontConfig(family);
    if (!fontConfig) continue;

    for (const variant of fontConfig.variants) {
      try {
        const fontBuffer = await fetchFontAsBuffer(variant.url);
        fontBuffers.push(fontBuffer);
        console.log(`✅ Font loaded as buffer: ${fontConfig.cssFamily} ${variant.weight} ${variant.style}`);
      } catch (error) {
        console.warn(`Failed to load font buffer: ${fontConfig.cssFamily}`, error);
      }
    }
  }

  return fontBuffers;
};

/**
 * Ensures specific fonts are loaded and returns font-face CSS with data URLs
 */
const ensureSpecificFontsLoaded = async (fontFamilies: string[]): Promise<string> => {
  if (typeof document === 'undefined' || fontFamilies.length === 0) {
    return '';
  }

  const loadPromises: Promise<unknown>[] = [];
  const fontFaceRules: string[] = [];

  for (const family of fontFamilies) {
    const fontConfig = getFontConfig(family);
    if (!fontConfig) continue;

    for (const variant of fontConfig.variants) {
      const fontSpec = `${variant.style} ${variant.weight} 16px "${fontConfig.cssFamily}"`;

      // Load font if not already loaded
      if (document.fonts && document.fonts.check && !document.fonts.check(fontSpec)) {
        let styleEl = document.querySelector(`style[data-font="${fontConfig.cssFamily}-${variant.weight}-${variant.style}"]`);
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.setAttribute('data-font', `${fontConfig.cssFamily}-${variant.weight}-${variant.style}`);
          const format = variant.url.includes('.woff2') ? 'woff2' : 'woff';
          styleEl.textContent = `@font-face {
            font-family: '${fontConfig.cssFamily}';
            src: url('${variant.url}') format('${format}');
            font-weight: ${variant.weight};
            font-style: ${variant.style};
            font-display: swap;
          }`;
          document.head.appendChild(styleEl);
        }

        if (document.fonts.load) {
          loadPromises.push(document.fonts.load(fontSpec));
        }
      }

      // Convert font URL to data URL for embedding in SVG
      try {
        const fontDataUrl = await fontUrlToDataUrl(variant.url);
        const format = variant.url.includes('.woff2') ? 'woff2' : 'woff';
        const fontFaceRule = `@font-face {
          font-family: '${fontConfig.cssFamily}';
          src: url('${fontDataUrl}') format('${format}');
          font-weight: ${variant.weight};
          font-style: ${variant.style};
          font-display: swap;
        }`;
        fontFaceRules.push(fontFaceRule);
        console.log(`✅ Font converted to data URL: ${fontConfig.cssFamily} ${variant.weight} ${variant.style}`);
      } catch (error) {
        console.warn(`Failed to convert font to data URL, will use external URL: ${fontConfig.cssFamily}`, error);
        // Fallback to external URL
        const format = variant.url.includes('.woff2') ? 'woff2' : 'woff';
        const fontFaceRule = `@font-face {
          font-family: '${fontConfig.cssFamily}';
          src: url('${variant.url}') format('${format}');
          font-weight: ${variant.weight};
          font-style: ${variant.style};
          font-display: swap;
        }`;
        fontFaceRules.push(fontFaceRule);
      }
    }
  }

  if (loadPromises.length > 0) {
    await Promise.allSettled(loadPromises);
  }

  return fontFaceRules.join('\n');
};

/**
 * Converts a blob to data URL
 */
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Fetches an image and converts it to a data URL
 */
const fetchImageAsDataUrl = async (url: string): Promise<string> => {
  const proxyBase = `https://rgufivgtyonitgjlozog.functions.supabase.co/image-proxy?url=`;

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch (error) {
    console.warn(`Direct fetch failed for ${url}, trying proxy...`, error);

    try {
      const proxyUrl = proxyBase + encodeURIComponent(url);
      const response = await fetch(proxyUrl, { mode: 'cors' });
      if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
      const blob = await response.blob();
      return await blobToDataUrl(blob);
    } catch (proxyError) {
      console.error(`Failed to fetch image via proxy: ${url}`, proxyError);
      throw new Error(`Failed to load image: ${url}`);
    }
  }
};

/**
 * Extracts all image elements from an SVG
 */
const extractImageElements = (svgElement: SVGSVGElement): SVGImageElement[] => {
  const images = svgElement.querySelectorAll('image');
  return Array.from(images);
};

/**
 * Extracts all font families used in the SVG
 */
const extractUsedFontFamilies = (svgElement: SVGSVGElement): Set<string> => {
  const fontFamilies = new Set<string>();
  const allElements = svgElement.querySelectorAll('*');

  allElements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);
    const fontFamily = computedStyle.fontFamily;

    if (fontFamily && fontFamily !== 'inherit') {
      const normalized = normalizeFontFamilyName(fontFamily);
      if (normalized) {
        fontFamilies.add(normalized);
      }
    }

    const inlineStyle = element.getAttribute('style');
    if (inlineStyle && inlineStyle.includes('font-family')) {
      const match = inlineStyle.match(/font-family:\s*([^;]+)/);
      if (match) {
        const normalized = normalizeFontFamilyName(match[1]);
        if (normalized) {
          fontFamilies.add(normalized);
        }
      }
    }
  });

  return fontFamilies;
};

/**
 * Inlines all images in SVG as data URLs
 */
export const inlineAllImages = async (
  svgElement: SVGSVGElement,
  onImageStatusUpdate?: (statuses: ImageLoadProgress[]) => void
): Promise<void> => {
  const images = extractImageElements(svgElement);

  console.log('🖼️ Found', images.length, 'image elements to inline');

  const imageStatuses: ImageLoadProgress[] = images.map((img): ImageLoadProgress => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
    const isDataUrl = href.startsWith('data:');

    let urlPreview: string;
    let size: string | undefined;

    if (isDataUrl) {
      size = `${(href.length / 1024).toFixed(1)} KB`;
      urlPreview = `data-url (${size})`;
    } else {
      urlPreview = href.substring(0, 50) + (href.length > 50 ? '...' : '');
    }

    return {
      url: urlPreview,
      status: (href && !isDataUrl) ? 'pending' as const : 'loaded' as const,
      size,
    };
  });

  if (onImageStatusUpdate) {
    onImageStatusUpdate([...imageStatuses]);
  }

  const imagePromises = images.map(async (img, index) => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href');

    if (!href || href.startsWith('data:')) {
      return;
    }

    if (!/^https?:\/\//i.test(href)) {
      imageStatuses[index].status = 'loaded';
      if (onImageStatusUpdate) {
        onImageStatusUpdate([...imageStatuses]);
      }
      return;
    }

    try {
      imageStatuses[index].status = 'loading';
      if (onImageStatusUpdate) {
        onImageStatusUpdate([...imageStatuses]);
      }

      const dataUrl = await fetchImageAsDataUrl(href);

      img.setAttribute('href', dataUrl);
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);

      imageStatuses[index].status = 'loaded';
      imageStatuses[index].size = `${(dataUrl.length / 1024).toFixed(1)} KB`;
      if (onImageStatusUpdate) {
        onImageStatusUpdate([...imageStatuses]);
      }
    } catch (error) {
      console.error(`Failed to inline image:`, error);
      imageStatuses[index].status = 'error';
      imageStatuses[index].error = error instanceof Error ? error.message : 'Unknown error';
      if (onImageStatusUpdate) {
        onImageStatusUpdate([...imageStatuses]);
      }
    }
  });

  await Promise.all(imagePromises);

  const inlinedCount = extractImageElements(svgElement).filter(img => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
    return href.startsWith('data:');
  }).length;

  console.log(`✅ ${inlinedCount}/${images.length} images inlined as data URLs`);
};

/**
 * Converts SVG to PNG using resvg-js (Rust-based renderer with proper font support)
 */
export const svgToPngDataUrl = async (
  svgElement: SVGSVGElement,
  options: ConversionOptions = {}
): Promise<string> => {
  const {
    width = 1080,
    height = 1350,
    scale = 2,
    format = 'png',
    backgroundColor = 'white',
    onProgress,
  } = options;

  const quality = format === 'jpeg' ? 0.92 : 1;

  // Load fonts used in SVG as buffers for resvg-js
  let fontBuffers: Uint8Array[] = [];
  try {
    const usedFonts = extractUsedFontFamilies(svgElement);
    if (usedFonts.size > 0) {
      const usedFontsArray = Array.from(usedFonts);
      console.log('🔤 Loading fonts for resvg:', usedFontsArray);
      fontBuffers = await loadFontsAsBuffers(usedFontsArray);
      console.log('🔤 Font buffers loaded:', fontBuffers.length);
      
      // CRITICAL: Ensure fonts are actually loaded in the original document before html2canvas
      // Wait for fonts to be ready in the original document
      if (document.fonts && document.fonts.load) {
        const loadPromises: Promise<unknown>[] = [];
        for (const family of usedFontsArray) {
          const fontConfig = getFontConfig(family);
          if (!fontConfig) continue;
          
          // Only load variants that are actually used in the SVG
          const usedWeights = new Set<string>();
          const usedStyles = new Set<string>();
          const allTextElements = svgElement.querySelectorAll('text, tspan');
          allTextElements.forEach(el => {
            const weight = el.getAttribute('font-weight') || window.getComputedStyle(el).fontWeight || '400';
            const style = el.getAttribute('font-style') || window.getComputedStyle(el).fontStyle || 'normal';
            usedWeights.add(weight);
            usedStyles.add(style);
            console.log(`🔍 Text element font: ${fontConfig.cssFamily}, weight: ${weight}, style: ${style}`);
          });
          
          console.log(`🔍 Used weights for ${fontConfig.cssFamily}:`, Array.from(usedWeights));
          console.log(`🔍 Used styles for ${fontConfig.cssFamily}:`, Array.from(usedStyles));
          
          // Load all variants if no specific weights/styles are found, otherwise load only used ones
          const shouldLoadAll = usedWeights.size === 0 && usedStyles.size === 0;
          
          for (const variant of fontConfig.variants) {
            // Only load if this variant is actually used, or if no specific weights/styles are found
            if (shouldLoadAll || usedWeights.has(String(variant.weight)) || usedStyles.has(variant.style)) {
              const fontSpec = `${variant.style} ${variant.weight} 16px "${fontConfig.cssFamily}"`;
              loadPromises.push(document.fonts.load(fontSpec));
              console.log(`📥 Loading font variant: ${fontSpec}`);
            }
          }
        }
        
        await Promise.allSettled(loadPromises);
        console.log('✅ Fonts loaded in original document');
        
        // Verify fonts are actually loaded
        for (const family of usedFontsArray) {
          const fontConfig = getFontConfig(family);
          if (!fontConfig) continue;
          const fontSpec = `normal 400 16px "${fontConfig.cssFamily}"`;
          const isLoaded = document.fonts.check(fontSpec);
          console.log(`🔍 Font ${fontConfig.cssFamily} loaded: ${isLoaded}`);
        }
      }
    }
  } catch (error) {
    console.error('Error loading fonts:', error);
  }

  if (onProgress) onProgress(70, 'SVG wird in Bild konvertiert...');

  // CRITICAL: Create a proper deep clone and ensure all attributes are set
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;

  // Set SVG attributes for rendering
  svgClone.setAttribute('width', String(width));
  svgClone.setAttribute('height', String(height));
  svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svgClone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Mount SVG temporarily to DOM to ensure it's fully rendered
  svgClone.style.position = 'absolute';
  svgClone.style.left = '-100000px';
  svgClone.style.top = '-100000px';
  svgClone.style.opacity = '0';
  svgClone.style.pointerEvents = 'none';
  document.body.appendChild(svgClone);

  try {
    // Wait for all embedded images to load
    const allImages = extractImageElements(svgClone);
    console.log('🖼️ Waiting for', allImages.length, 'embedded images to load in SVG clone...');
    
    await Promise.all(allImages.map((img, index) => {
      return new Promise<void>((resolve) => {
        const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
        if (href && href.startsWith('data:')) {
          const tempImg = new Image();
          tempImg.onload = () => {
            console.log(`✅ Image ${index + 1}/${allImages.length} loaded`);
            resolve();
          };
          tempImg.onerror = () => {
            console.warn(`⚠️ Image ${index + 1}/${allImages.length} failed to load`);
            resolve(); // Continue even if one image fails
          };
          tempImg.src = href;
        } else {
          resolve();
        }
      });
    }));

    console.log('✅ All embedded images loaded in SVG clone');
    
    // Small delay to ensure DOM is fully updated
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get all computed styles and convert them to inline styles
    const allElements = svgClone.querySelectorAll('*');
    allElements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);

      // For text elements, ensure font properties are inline
      if (element.tagName === 'text' || element.tagName === 'tspan') {
        const currentStyle = element.getAttribute('style') || '';
        const fontFamily = element.getAttribute('font-family') || computedStyle.fontFamily;
        const fontSize = element.getAttribute('font-size') || computedStyle.fontSize;
        const fontWeight = element.getAttribute('font-weight') || computedStyle.fontWeight;
        const fontStyle = element.getAttribute('font-style') || computedStyle.fontStyle;
        const fill = element.getAttribute('fill') || computedStyle.fill;

        if (fontFamily && fontFamily !== 'inherit') {
          element.setAttribute('font-family', fontFamily);
        }
        if (fontSize && fontSize !== 'inherit') {
          element.setAttribute('font-size', fontSize);
        }
        if (fontWeight && fontWeight !== 'inherit' && fontWeight !== 'normal') {
          element.setAttribute('font-weight', fontWeight);
        }
        if (fontStyle && fontStyle !== 'inherit' && fontStyle !== 'normal') {
          element.setAttribute('font-style', fontStyle);
        }
        if (fill && fill !== 'inherit') {
          element.setAttribute('fill', fill);
        }
      }
    });

    // CRITICAL: Embed font-face definitions with data URLs directly in SVG
    // Ensure style element exists
    let styleElement = svgClone.querySelector('style') as Element | null;
    if (!styleElement) {
      styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      svgClone.insertBefore(styleElement, svgClone.firstChild);
    }

    // Remove existing @font-face rules to avoid conflicts with external URLs
    // that won't work when SVG is loaded as image
    let existingStyle = (styleElement as { textContent: string | null }).textContent || '';
    if (existingStyle) {
      // Remove all @font-face rules (they may contain external URLs that won't work)
      existingStyle = existingStyle.replace(/@font-face\s*\{[^}]*\}/g, '');
      // Clean up multiple newlines
      existingStyle = existingStyle.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
      console.log('🧹 Removed existing @font-face rules from SVG');
    }

    // Set font-face CSS with data URLs in style element
    if (fontFaceCssWithDataUrls) {
      // Combine existing styles (without font-face) with new font-face rules with data URLs
      styleElement.textContent = existingStyle + (existingStyle ? '\n\n' : '') + fontFaceCssWithDataUrls;
      console.log('📝 Embedded fonts with data URLs in SVG, CSS length:', fontFaceCssWithDataUrls.length);
      console.log('📝 Total style content length:', styleElement.textContent.length);
    } else {
      // Even if no new fonts, set the cleaned style (without external font-face rules)
      styleElement.textContent = existingStyle;
      console.warn('⚠️ No font-face CSS with data URLs available');
    }

    // Serialize SVG to string with proper encoding
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgClone);
    
    // Verify font-face rules are in the serialized string
    const fontFaceCount = (svgString.match(/@font-face/g) || []).length;
    console.log('📝 Font-face rules in serialized SVG:', fontFaceCount);

    // Ensure proper XML declaration
    if (!svgString.includes('<?xml')) {
      svgString = '<?xml version="1.0" encoding="UTF-8"?>' + svgString;
    }

    console.log('📝 SVG serialized, length:', svgString.length);

    // Debug: Check if text elements are in SVG
    const textCount = (svgString.match(/<text/g) || []).length;
    console.log('📝 Text elements in serialized SVG:', textCount);

    // Debug: Save SVG string to console for inspection
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('🔍 SVG Preview (first 2000 chars):', svgString.substring(0, 2000));
      // Make SVG downloadable for debugging
      (window as Window & { __debugSvgString?: string }).__debugSvgString = svgString;
      console.log('💾 SVG available in window.__debugSvgString - you can save it to inspect');
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d', { alpha: backgroundColor === 'transparent' });

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Fill background
    if (backgroundColor && backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Create blob URL from serialized SVG
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    console.log('📦 SVG Blob created, size:', (svgBlob.size / 1024).toFixed(2), 'KB');
    const svgUrl = URL.createObjectURL(svgBlob);
    console.log('🔗 SVG Blob URL created');

    // Load SVG as Image and draw to canvas
    const img = new Image();

    // Don't set crossOrigin for blob URLs as they're same-origin
    // img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const errorMsg = 'SVG loading timeout - image failed to load after 30 seconds';
        console.error(errorMsg);
        reject(new Error(errorMsg));
      }, 30000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          console.log('✅ SVG loaded as image, dimensions:', img.width, 'x', img.height);

          // Verify image has valid dimensions
          if (img.width === 0 || img.height === 0) {
            throw new Error('Loaded image has zero dimensions');
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          console.log('✅ SVG drawn to canvas');
          resolve();
        } catch (error) {
          console.error('Error drawing SVG to canvas:', error);
          reject(error);
        }
      };

      img.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Failed to load SVG as image:', error);
        console.error('SVG URL:', svgUrl.substring(0, 100));
        console.error('SVG string length:', svgString.length);
        reject(new Error('Failed to load SVG as image - check console for details'));
      };

      // Set source to trigger loading
      console.log('🔄 Loading SVG as image...');
      console.log('📏 Target canvas dimensions:', canvas.width, 'x', canvas.height);
      img.src = svgUrl;
    });

    // Clean up blob URL
    URL.revokeObjectURL(svgUrl);

    // Verify canvas has actual content before converting
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Check if canvas is not just background color
    let hasContent = false;
    let nonWhitePixels = 0;
    let nonTransparentPixels = 0;
    const bgColor = backgroundColor === 'white' ? [255, 255, 255] : backgroundColor === 'transparent' ? null : null;

    // Sample pixels from different areas of the canvas (not just the first few)
    const sampleSize = Math.min(10000, pixels.length / 4); // Sample up to 10000 pixels
    const step = Math.max(1, Math.floor(pixels.length / 4 / sampleSize));
    
    for (let i = 0; i < pixels.length; i += step * 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // Check if pixel is different from background
      if (bgColor) {
        if (r !== bgColor[0] || g !== bgColor[1] || b !== bgColor[2]) {
          nonWhitePixels++;
          hasContent = true;
        }
      } else if (a > 0) {
        nonTransparentPixels++;
        hasContent = true;
      }
    }

    console.log('🔍 Canvas has content:', hasContent);
    console.log('🔍 Canvas dimensions:', canvas.width, 'x', canvas.height);
    if (bgColor) {
      console.log('🔍 Non-white pixels found:', nonWhitePixels);
    } else {
      console.log('🔍 Non-transparent pixels found:', nonTransparentPixels);
    }
    
    // Also check a few specific sample areas
    const sampleAreas = [
      { x: 0, y: 0, w: 100, h: 100 },
      { x: canvas.width / 2 - 50, y: canvas.height / 2 - 50, w: 100, h: 100 },
      { x: canvas.width - 100, y: canvas.height - 100, w: 100, h: 100 },
    ];
    
    for (const area of sampleAreas) {
      const areaData = ctx.getImageData(area.x, area.y, area.w, area.h);
      const areaPixels = areaData.data;
      let areaHasContent = false;
      for (let i = 0; i < areaPixels.length; i += 4) {
        const r = areaPixels[i];
        const g = areaPixels[i + 1];
        const b = areaPixels[i + 2];
        const a = areaPixels[i + 3];
        if (bgColor) {
          if (r !== bgColor[0] || g !== bgColor[1] || b !== bgColor[2]) {
            areaHasContent = true;
            break;
          }
        } else if (a > 0) {
          areaHasContent = true;
          break;
        }
      }
      console.log(`🔍 Sample area (${area.x},${area.y}):`, areaHasContent ? 'has content' : 'empty');
    }

    // Convert canvas to data URL
    let dataUrl = '';
    if (format === 'jpeg') {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    } else if (format === 'webp') {
      dataUrl = canvas.toDataURL('image/webp', quality);
    } else {
      dataUrl = canvas.toDataURL('image/png');
    }

    if (!dataUrl || dataUrl.length < 100) {
      throw new Error('Generated data URL is invalid');
    }

    console.log(`✅ SVG converted to ${format}: ${(dataUrl.length / 1024).toFixed(1)} KB`);

    if (!hasContent) {
      console.warn('⚠️ Warning: Canvas appears to be empty or only background color');
    }

    if (onProgress) onProgress(90, 'Bild wird finalisiert...');

    return dataUrl;
  } finally {
    // Clean up
    if (svgClone.parentNode) {
      document.body.removeChild(svgClone);
    }
  }
};

/**
 * Downloads a data URL as a file
 */
export const downloadDataUrl = (dataUrl: string, fileName: string): boolean => {
  try {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
    }, 100);

    return true;
  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
};

/**
 * Share image using Web Share API
 */
export const shareImageNative = async (blob: Blob, fileName: string): Promise<boolean> => {
  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], fileName, { type: blob.type });
      const canShare = navigator.canShare({ files: [file] });

      if (canShare) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: 'Mein Kanva Bild',
        });
        return true;
      }
    } catch (error) {
      console.warn('Web Share API failed:', error);
    }
  }

  return false;
};

/**
 * Complete SVG to image conversion with progress tracking
 */
export const convertSvgToImage = async (
  svgElement: SVGSVGElement,
  options: ConversionOptions = {}
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number }> => {
  const { onProgress, onImageStatusUpdate } = options;

  if (onProgress) {
    onProgress(10, 'SVG wird vorbereitet...');
  }

  // Clone SVG to avoid modifying original
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;

  // Mount clone offscreen for getComputedStyle to work
  svgClone.style.position = 'absolute';
  svgClone.style.left = '-100000px';
  svgClone.style.top = '-100000px';
  svgClone.style.opacity = '0';
  svgClone.style.pointerEvents = 'none';
  document.body.appendChild(svgClone);

  try {
    if (onProgress) {
      onProgress(30, 'Bilder werden geladen...');
    }

    await inlineAllImages(svgClone, onImageStatusUpdate);
  } finally {
    if (svgClone.parentNode) {
      document.body.removeChild(svgClone);
    }
  }

  if (onProgress) {
    onProgress(60, 'Bilder wurden geladen...');
  }

  // Convert to PNG
  const dataUrl = await svgToPngDataUrl(svgClone, options);

  if (onProgress) {
    onProgress(95, 'Datei wird erstellt...');
  }

  // Convert to blob
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL generated');
  }

  const arr = dataUrl.split(',');
  if (arr.length !== 2) {
    throw new Error('Invalid data URL format');
  }

  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const base64Data = arr[1];

  const bstr = atob(base64Data);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });

  if (blob.size === 0) {
    throw new Error('Generated blob is empty');
  }

  console.log(`📦 Blob created: ${(blob.size / 1024).toFixed(2)} KB, type: ${mime}`);

  const width = parseInt(svgElement.getAttribute('width') || '1080');
  const height = parseInt(svgElement.getAttribute('height') || '1350');

  if (onProgress) {
    onProgress(100, 'Fertig!');
  }

  return {
    dataUrl,
    blob,
    width,
    height,
  };
};

/**
 * Toast message type
 */
interface ToastMessage {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

/**
 * Platform download options
 */
interface PlatformDownloadOptions {
  svgElement: SVGSVGElement;
  fileName: string;
  isMobile: boolean;
  onProgressUpdate?: (progress: number, message: string) => void;
  onImageStatusUpdate?: (statuses: ImageLoadProgress[]) => void;
  onSuccess?: (message: ToastMessage) => void;
  onError?: (message: ToastMessage) => void;
}

/**
 * Unified platform-specific download handler
 */
export const handlePlatformDownload = async (options: PlatformDownloadOptions): Promise<void> => {
  const {
    svgElement,
    fileName,
    isMobile,
    onProgressUpdate,
    onImageStatusUpdate,
    onSuccess,
    onError
  } = options;

  try {
    const lower = fileName.toLowerCase();
    const fmt: 'png' | 'jpeg' | 'webp' =
      lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'jpeg' :
      lower.endsWith('.webp') ? 'webp' : 'png';

    // Get original dimensions from SVG
    const originalWidth = parseInt(svgElement.getAttribute('width') || '1080');
    const originalHeight = parseInt(svgElement.getAttribute('height') || '1350');

    const result = await convertSvgToImage(svgElement, {
      width: originalWidth,
      height: originalHeight,
      scale: 2, // 2x resolution for Instagram (2160x2700)
      format: fmt,
      backgroundColor: 'white',
      onProgress: onProgressUpdate,
      onImageStatusUpdate,
    });

    if (isMobile) {
      // Try native share first
      const shareSuccess = await shareImageNative(result.blob, fileName);

      if (shareSuccess) {
        onSuccess?.({
          title: 'Erfolgreich',
          description: 'Bild geteilt'
        });
      } else {
        // Fallback: download
        downloadDataUrl(result.dataUrl, fileName);
        onSuccess?.({
          title: 'Download gestartet',
          description: 'Das Bild wird heruntergeladen'
        });
      }
    } else {
      downloadDataUrl(result.dataUrl, fileName);
      onSuccess?.({
        title: 'Download gestartet',
        description: 'Das Bild wird heruntergeladen'
      });
    }
  } catch (error) {
    console.error('Export failed:', error);
    onError?.({
      title: 'Export fehlgeschlagen',
      description: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten'
    });
  }
};
