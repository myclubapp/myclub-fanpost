/**
 * Layered SVG to Image conversion for optimized PNG export
 *
 * This approach separates the SVG into logical layers:
 * - Background layer (static color or image)
 * - Images layer (team logos, etc.)
 * - Text layer (all text elements with embedded fonts)
 *
 * Benefits:
 * - Better performance (layers can be cached)
 * - Smaller memory footprint
 * - Easier debugging
 * - More reliable rendering
 */

import { normalizeFontFamilyName, getFontConfig, getGoogleFontsUrl } from '@/config/fonts';
import * as fontkit from 'fontkit';
import html2canvas from 'html2canvas';

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
 * Layered SVG structure
 */
export interface LayeredSVG {
  background: SVGSVGElement;
  images: SVGSVGElement;
  text: SVGSVGElement;
}

/**
 * Converts font URL to data URL for embedding
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
 * Builds font-face CSS with data URLs
 */
const buildFontFaceCssWithDataUrls = async (fontFamilies: string[]): Promise<string> => {
  if (fontFamilies.length === 0) return '';

  const fontFaceRules: string[] = [];

  for (const family of fontFamilies) {
    const fontConfig = getFontConfig(family);
    if (!fontConfig) continue;

    for (const variant of fontConfig.variants) {
      const format = variant.url.includes('.woff2') ? 'woff2' : 'woff';

      try {
        const fontDataUrl = await fontUrlToDataUrl(variant.url);
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
        console.warn(`Failed to convert font to data URL: ${fontConfig.cssFamily}`, error);
        // Fallback to URL reference
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
  return fontFaceRules.join('\n\n');
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
 * Font cache to avoid re-loading the same font
 */
const fontCache = new Map<string, fontkit.Font>();

/**
 * Load a font using fontkit
 * Can load from URL or data URL
 */
const loadFont = async (urlOrDataUrl: string): Promise<fontkit.Font> => {
  // Check cache first
  if (fontCache.has(urlOrDataUrl)) {
    return fontCache.get(urlOrDataUrl)!;
  }

  try {
    let arrayBuffer: ArrayBuffer;
    
    if (urlOrDataUrl.startsWith('data:')) {
      // Load from data URL
      const base64 = urlOrDataUrl.split(',')[1];
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else {
      // Load from URL
      const response = await fetch(urlOrDataUrl);
      if (!response.ok) throw new Error(`Failed to fetch font: ${response.status}`);
      arrayBuffer = await response.arrayBuffer();
    }

    // Convert ArrayBuffer to Uint8Array for fontkit compatibility
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // fontkit.create accepts Uint8Array or ArrayBuffer
    const font = fontkit.create(uint8Array);

    fontCache.set(urlOrDataUrl, font);
    console.log(`✅ Loaded font: ${urlOrDataUrl.substring(0, 50)}...`);

    return font;
  } catch (error) {
    console.error(`Failed to load font: ${urlOrDataUrl}`, error);
    throw error;
  }
};

/**
 * Convert text element to SVG path
 * Returns a group element containing all glyph paths
 */
const convertTextToPath = async (
  textElement: SVGTextElement,
  font: fontkit.Font
): Promise<SVGGElement | null> => {
  try {
    const text = textElement.textContent || '';
    if (!text) return null;

    // Get text properties
    const x = parseFloat(textElement.getAttribute('x') || '0');
    const y = parseFloat(textElement.getAttribute('y') || '0');
    const fontSize = parseFloat(textElement.getAttribute('font-size') || '16');
    const fill = textElement.getAttribute('fill') || '#000000';
    const stroke = textElement.getAttribute('stroke');
    const strokeWidth = textElement.getAttribute('stroke-width');
    const textAnchor = textElement.getAttribute('text-anchor') || 'start';
    const letterSpacing = parseFloat(textElement.getAttribute('letter-spacing') || '0');

    // Get font scale based on fontSize
    const scale = fontSize / font.unitsPerEm;

    // Create a glyph run
    const glyphRun = font.layout(text);

    // Create a group element to hold all paths
    const groupElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    groupElement.setAttribute('fill', fill);
    
    if (stroke) groupElement.setAttribute('stroke', stroke);
    if (strokeWidth) groupElement.setAttribute('stroke-width', strokeWidth);

    // Copy any additional attributes
    const opacity = textElement.getAttribute('opacity');
    if (opacity) groupElement.setAttribute('opacity', opacity);

    const existingTransform = textElement.getAttribute('transform');
    if (existingTransform) {
      groupElement.setAttribute('transform', existingTransform);
    }

    // Calculate text width for text-anchor alignment
    let totalWidth = 0;
    for (const position of glyphRun.glyphs) {
      totalWidth += position.xAdvance * scale;
    }
    
    // Adjust x position based on text-anchor
    let startX = x;
    if (textAnchor === 'middle') {
      startX = x - totalWidth / 2;
    } else if (textAnchor === 'end') {
      startX = x - totalWidth;
    }

    let currentX = 0;

    // Convert each glyph to a path
    for (const position of glyphRun.glyphs) {
      const glyph = position.glyph;

      if (glyph.path) {
        // Get the SVG path data from the glyph
        const glyphPathData = glyph.path.toSVG();

        if (glyphPathData) {
          // Create individual path for this glyph
          const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          pathElement.setAttribute('d', glyphPathData);

          // Transform for this specific glyph: translate to position and scale
          // Y is flipped because font coordinates are top-down
          const glyphX = startX + currentX;
          const glyphTransform = `translate(${glyphX}, ${y}) scale(${scale}, ${-scale})`;
          pathElement.setAttribute('transform', glyphTransform);

          groupElement.appendChild(pathElement);
        }
      }

      // Move to next glyph position (including letter spacing)
      currentX += position.xAdvance * scale + letterSpacing;
    }

    if (groupElement.children.length === 0) return null;

    return groupElement;
  } catch (error) {
    console.error('Failed to convert text to path:', error);
    return null;
  }
};

/**
 * Convert all text elements in SVG to paths
 */
const convertAllTextToPaths = async (svgElement: SVGSVGElement): Promise<number> => {
  const textElements = svgElement.querySelectorAll('text');
  console.log(`🔤 Found ${textElements.length} text elements to convert to paths`);

  if (textElements.length === 0) return 0;

  // Group text elements by font family
  const fontGroups = new Map<string, { elements: SVGTextElement[]; fontUrl: string }>();

  textElements.forEach((textElement) => {
    const fontFamily = textElement.getAttribute('font-family') ||
                      textElement.style.fontFamily ||
                      window.getComputedStyle(textElement).fontFamily;

    const normalized = normalizeFontFamilyName(fontFamily);
    if (!normalized) {
      console.warn(`⚠️ Could not normalize font family: "${fontFamily}"`);
      return;
    }

    const fontConfig = getFontConfig(normalized);
    if (!fontConfig) {
      console.warn(`⚠️ No font config found for: "${normalized}"`);
      return;
    }

    // Get font-weight and font-style from element
    const fontWeight = textElement.getAttribute('font-weight') || 
                     textElement.style.fontWeight || 
                     '400';
    const fontStyle = textElement.getAttribute('font-style') || 
                    textElement.style.fontStyle || 
                    'normal';

    // Find matching variant
    const variant = fontConfig.variants.find(v => 
      v.weight === fontWeight && v.style === fontStyle
    ) || fontConfig.variants[0];

    if (!variant || !variant.url) {
      console.warn(`⚠️ No font variant found for: ${normalized} ${fontWeight} ${fontStyle}`);
      return;
    }

    if (!fontGroups.has(normalized)) {
      fontGroups.set(normalized, { elements: [], fontUrl: variant.url });
    }

    fontGroups.get(normalized)!.elements.push(textElement);
  });

  console.log(`📦 Grouped into ${fontGroups.size} font families`);

  let convertedCount = 0;

  // Convert text elements for each font
  for (const [fontFamily, { elements, fontUrl }] of fontGroups) {
    try {
      console.log(`🔤 Loading font for conversion: ${fontFamily} from ${fontUrl.substring(0, 50)}...`);
      
      // First, try to convert URL to data URL for better compatibility with fontkit
      let fontSource = fontUrl;
      if (!fontUrl.startsWith('data:')) {
        try {
          const response = await fetch(fontUrl);
          if (response.ok) {
            const blob = await response.blob();
            fontSource = await blobToDataUrl(blob);
            console.log(`✅ Converted font URL to data URL`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to convert font URL to data URL, using URL directly:`, error);
        }
      }
      
      const font = await loadFont(fontSource);

      for (const textElement of elements) {
        const groupElement = await convertTextToPath(textElement, font);

        if (groupElement) {
          // Replace text element with group element containing paths
          textElement.parentNode?.replaceChild(groupElement, textElement);
          convertedCount++;
        }
      }

      console.log(`✅ Converted ${elements.length} text elements to paths for ${fontFamily}`);
    } catch (error) {
      console.error(`Failed to convert text to paths for ${fontFamily}:`, error);
    }
  }

  console.log(`✅ Total converted: ${convertedCount}/${textElements.length} text elements to paths`);
  return convertedCount;
};

/**
 * Extracts font families used in text elements
 */
const extractUsedFontFamilies = (svgElement: SVGSVGElement): Set<string> => {
  const fontFamilies = new Set<string>();
  const textElements = svgElement.querySelectorAll('text');

  textElements.forEach((element) => {
    const fontFamily = element.getAttribute('font-family') ||
                      element.style.fontFamily ||
                      window.getComputedStyle(element).fontFamily;

    if (fontFamily && fontFamily !== 'inherit') {
      const normalized = normalizeFontFamilyName(fontFamily);
      if (normalized) {
        fontFamilies.add(normalized);
      }
    }
  });

  return fontFamilies;
};

/**
 * Separates an SVG into logical layers
 */
export const separateSVGIntoLayers = (svgElement: SVGSVGElement): LayeredSVG => {
  const width = svgElement.getAttribute('width') || '1080';
  const height = svgElement.getAttribute('height') || '1350';
  const viewBox = svgElement.getAttribute('viewBox') || `0 0 ${width} ${height}`;

  // Helper to create a valid SVG layer with transparent background
  const createLayerSVG = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    return svg;
  };

  // Create layer SVGs
  const backgroundSVG = createLayerSVG();
  const imagesSVG = createLayerSVG();
  const textSVG = createLayerSVG();

  // Add transparent background to image and text layers
  const transparentBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  transparentBg.setAttribute('width', width);
  transparentBg.setAttribute('height', height);
  transparentBg.setAttribute('fill', 'none');
  imagesSVG.appendChild(transparentBg.cloneNode(true));
  textSVG.appendChild(transparentBg.cloneNode(true));

  // Extract and separate elements
  const children = Array.from(svgElement.children);

  children.forEach((child) => {
    if (child.tagName === 'style') {
      // Skip style elements - we'll add fonts to text layer later
      return;
    }

    if (child.tagName === 'rect' || child.tagName === 'image') {
      // Check if this is a background element (full-size)
      const childWidth = child.getAttribute('width');
      const childHeight = child.getAttribute('height');
      const childX = child.getAttribute('x') || '0';
      const childY = child.getAttribute('y') || '0';

      const isBackground =
        childWidth === width &&
        childHeight === height &&
        childX === '0' &&
        childY === '0';

      if (isBackground) {
        backgroundSVG.appendChild(child.cloneNode(true));
      } else if (child.tagName === 'image') {
        imagesSVG.appendChild(child.cloneNode(true));
      } else {
        backgroundSVG.appendChild(child.cloneNode(true));
      }
    } else if (child.tagName === 'text') {
      textSVG.appendChild(child.cloneNode(true));
    } else if (child.tagName === 'g') {
      // Check if group contains text or images
      const hasText = child.querySelector('text');
      const hasImage = child.querySelector('image');

      if (hasText) {
        textSVG.appendChild(child.cloneNode(true));
      } else if (hasImage) {
        imagesSVG.appendChild(child.cloneNode(true));
      } else {
        backgroundSVG.appendChild(child.cloneNode(true));
      }
    } else if (child.tagName === 'defs' || child.tagName === 'pattern') {
      // Add defs to all layers
      backgroundSVG.appendChild(child.cloneNode(true));
      imagesSVG.appendChild(child.cloneNode(true));
      textSVG.appendChild(child.cloneNode(true));
    }
  });

  console.log('📊 Layer separation complete:');
  console.log(`  - Background: ${backgroundSVG.children.length} elements`);
  console.log(`  - Images: ${imagesSVG.children.length} elements`);
  console.log(`  - Text: ${textSVG.children.length} elements`);

  // Debug: Log SVG strings and font attributes for inspection
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Background SVG:', new XMLSerializer().serializeToString(backgroundSVG).substring(0, 200) + '...');
    console.log('🔍 Images SVG:', new XMLSerializer().serializeToString(imagesSVG).substring(0, 200) + '...');
    console.log('🔍 Text SVG:', new XMLSerializer().serializeToString(textSVG).substring(0, 200) + '...');

    // Log font families used in text elements
    const textElements = textSVG.querySelectorAll('text');
    textElements.forEach((textEl, idx) => {
      const fontFamily = textEl.getAttribute('font-family');
      const content = textEl.textContent?.substring(0, 30);
      console.log(`🔤 Text[${idx}]: font="${fontFamily}" content="${content}"`);
    });
  }

  return {
    background: backgroundSVG,
    images: imagesSVG,
    text: textSVG,
  };
};

/**
 * Inlines all images in an SVG as data URLs
 */
export const inlineAllImages = async (
  svgElement: SVGSVGElement,
  onImageStatusUpdate?: (statuses: ImageLoadProgress[]) => void
): Promise<void> => {
  const images = Array.from(svgElement.querySelectorAll('image'));

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

  const inlinedCount = images.filter(img => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
    return href.startsWith('data:');
  }).length;

  console.log(`✅ ${inlinedCount}/${images.length} images inlined as data URLs`);
};

/**
 * Converts an SVG element to a Blob
 */
const svgToBlob = async (svgElement: SVGSVGElement): Promise<Blob> => {
  const svgString = new XMLSerializer().serializeToString(svgElement);
  return new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
};

/**
 * Converts SVG blob to image using Image element
 * More reliable than createImageBitmap for complex SVGs
 */
const svgBlobToImage = async (blob: Blob, waitForFonts = false): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = async () => {
      // If fonts need to be loaded, wait longer for them to fully render
      if (waitForFonts) {
        // Longer wait to ensure fonts are applied
        await new Promise(r => setTimeout(r, 500));
      }
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load SVG as image: ${error}`));
    };

    img.src = url;
  });
};

/**
 * Embeds fonts in an SVG element using multiple methods for maximum compatibility
 */
const embedFontsInSvg = async (svgElement: SVGSVGElement, fontFamilies: string[]): Promise<void> => {
  if (fontFamilies.length === 0) return;

  // Method 1: Build font CSS with data URLs
  const fontFaceCss = await buildFontFaceCssWithDataUrls(fontFamilies);
  if (!fontFaceCss) return;

  // Remove existing style elements first
  const existingStyles = svgElement.querySelectorAll('style');
  existingStyles.forEach(style => style.remove());

  // Method 2: Add Google Fonts link as comment (for reference)
  const fontConfigs = fontFamilies.map(f => getFontConfig(f)).filter(Boolean);
  const googleFontsLinks: string[] = [];
  
  for (const fontConfig of fontConfigs) {
    if (fontConfig && fontConfig.googleFontsUrl) {
      googleFontsLinks.push(fontConfig.googleFontsUrl);
    }
  }

  // Method 3: Create comprehensive style element with multiple approaches
  const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleElement.setAttribute('type', 'text/css');
  
  // Build comprehensive CSS with:
  // 1. @font-face rules with data URLs
  // 2. @import for Google Fonts (fallback)
  // 3. Explicit font-family rules for text elements
  
  let cssContent = '';
  
  // Add Google Fonts import as fallback
  if (googleFontsLinks.length > 0) {
    for (const link of googleFontsLinks) {
      cssContent += `@import url('${link}');\n`;
    }
    cssContent += '\n';
  }
  
  // Add @font-face rules with data URLs
  cssContent += fontFaceCss;
  cssContent += '\n\n';
  
  // Add explicit font-family rules for all text elements
  for (const family of fontFamilies) {
    const fontConfig = getFontConfig(family);
    if (fontConfig) {
      cssContent += `text[font-family*="${fontConfig.cssFamily}"], text[font-family*="${family}"] { font-family: "${fontConfig.cssFamily}", sans-serif !important; }\n`;
    }
  }
  
  styleElement.textContent = cssContent;

  // Insert at the very beginning of SVG
  svgElement.insertBefore(styleElement, svgElement.firstChild);

  // Method 4: Also add Google Fonts as external link (some renderers prefer this)
  if (googleFontsLinks.length > 0) {
    // Note: SVG doesn't support <link> directly, but we can add it as a comment for reference
    // Some tools might parse it
    const linkComment = document.createComment(`Google Fonts: ${googleFontsLinks.join(', ')}`);
    svgElement.insertBefore(linkComment, svgElement.firstChild);
  }

  // Method 5: Explicitly set font-family on all text elements
  const textElements = svgElement.querySelectorAll('text');
  textElements.forEach((textEl) => {
    const currentFont = textEl.getAttribute('font-family') || 
                       textEl.style.fontFamily;
    if (currentFont) {
      const normalized = normalizeFontFamilyName(currentFont);
      if (normalized) {
        const fontConfig = getFontConfig(normalized);
        if (fontConfig) {
          // Set multiple font-family values for fallback
          const fontFamilyValue = `"${fontConfig.cssFamily}", "${normalized}", sans-serif`;
          textEl.setAttribute('font-family', fontFamilyValue);
          textEl.style.fontFamily = fontFamilyValue;
          
          // Also ensure font-weight and font-style are set
          const fontWeight = textEl.getAttribute('font-weight') || textEl.style.fontWeight || '400';
          const fontStyle = textEl.getAttribute('font-style') || textEl.style.fontStyle || 'normal';
          textEl.setAttribute('font-weight', fontWeight);
          textEl.setAttribute('font-style', fontStyle);
          textEl.style.fontWeight = fontWeight;
          textEl.style.fontStyle = fontStyle;
        }
      }
    }
  });

  console.log(`✅ Embedded ${fontFaceCss.split('@font-face').length - 1} font-face rules in SVG with multiple methods`);
};

/**
 * Converts layered SVG to PNG using modern browser APIs
 */
export const convertLayeredSvgToPng = async (
  layers: LayeredSVG,
  options: ConversionOptions = {}
): Promise<{ dataUrl: string; blob: Blob }> => {
  const {
    width = 1080,
    height = 1350,
    scale = 2,
    format = 'png',
    backgroundColor = 'white',
    onProgress,
  } = options;

  const canvasWidth = width * scale;
  const canvasHeight = height * scale;

  if (onProgress) onProgress(20, 'Bilder werden vorbereitet...');

  // 1. Inline all images in the images layer
  await inlineAllImages(layers.images, options.onImageStatusUpdate);

  if (onProgress) onProgress(40, 'Schriften werden eingebettet...');

  // 2. Extract and embed fonts in text layer
  const usedFonts = extractUsedFontFamilies(layers.text);
  const usedFontsArray = Array.from(usedFonts);

  // Build font CSS with data URLs and inject into document head AND SVG
  let fontStyleElement: HTMLStyleElement | null = null;
  if (usedFontsArray.length > 0) {
    console.log('🔤 Preparing fonts for text layer:', usedFontsArray);

    // Build font CSS with data URLs
    const fontFaceCss = await buildFontFaceCssWithDataUrls(usedFontsArray);

    // CRITICAL: Embed fonts directly in the SVG so html2canvas can use them
    await embedFontsInSvg(layers.text, usedFontsArray);
    console.log('✅ Fonts embedded directly in text SVG');

    // Also inject fonts into document head for fallback
    fontStyleElement = document.createElement('style');
    fontStyleElement.setAttribute('data-layered-export-fonts', 'true');
    fontStyleElement.textContent = fontFaceCss;
    document.head.appendChild(fontStyleElement);
    console.log('✅ Font CSS injected into document head');

    // Load fonts in the document
    if (document.fonts && document.fonts.load) {
      const loadPromises: Promise<unknown>[] = [];
      for (const family of usedFontsArray) {
        const fontConfig = getFontConfig(family);
        if (!fontConfig) continue;
        for (const variant of fontConfig.variants) {
          const fontSpec = `${variant.style} ${variant.weight} 16px "${fontConfig.cssFamily}"`;
          loadPromises.push(document.fonts.load(fontSpec));
        }
      }
      await Promise.allSettled(loadPromises);
      console.log('✅ Fonts loaded in document');
      // Wait for fonts to be fully ready
      await new Promise(r => setTimeout(r, 300));
    }

    // Normalize font-family attributes on text elements - ensure exact match with CSS font names
    const textElements = layers.text.querySelectorAll('text');
    textElements.forEach((textEl) => {
      const currentFont = textEl.getAttribute('font-family') ||
                         textEl.style.fontFamily ||
                         window.getComputedStyle(textEl).fontFamily;
      if (currentFont) {
        const cleanFont = normalizeFontFamilyName(currentFont);
        if (cleanFont) {
          // Set font-family with quotes to match CSS exactly
          const fontWithQuotes = `"${cleanFont}"`;
          textEl.setAttribute('font-family', fontWithQuotes);
          textEl.style.fontFamily = fontWithQuotes;
          
          // Also ensure font-weight and font-style are set if not already
          const fontWeight = textEl.getAttribute('font-weight') || textEl.style.fontWeight || '400';
          const fontStyle = textEl.getAttribute('font-style') || textEl.style.fontStyle || 'normal';
          textEl.setAttribute('font-weight', fontWeight);
          textEl.setAttribute('font-style', fontStyle);
          textEl.style.fontWeight = fontWeight;
          textEl.style.fontStyle = fontStyle;
        }
      }
    });
    console.log(`✅ Normalized font-family for ${textElements.length} text elements`);
  }

  if (onProgress) onProgress(60, 'Ebenen werden gerendert...');

  // 3. Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { alpha: backgroundColor === 'transparent' });

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // 4. Draw background color if specified
  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  if (onProgress) onProgress(70, 'Hintergrund wird gerendert...');

  // 5. Convert background layer to image and draw
  try {
    const backgroundBlob = await svgToBlob(layers.background);
    const backgroundImg = await svgBlobToImage(backgroundBlob);
    ctx.drawImage(backgroundImg, 0, 0, canvasWidth, canvasHeight);
    console.log('✅ Background layer rendered');
  } catch (error) {
    console.warn('⚠️ Failed to render background layer:', error);
    // Continue without background layer
  }

  if (onProgress) onProgress(80, 'Bilder werden gerendert...');

  // 6. Convert images layer to image and draw
  try {
    const imagesBlob = await svgToBlob(layers.images);
    const imagesImg = await svgBlobToImage(imagesBlob);
    ctx.drawImage(imagesImg, 0, 0, canvasWidth, canvasHeight);
    console.log('✅ Images layer rendered');
  } catch (error) {
    console.warn('⚠️ Failed to render images layer:', error);
    // Continue without images layer
  }

  if (onProgress) onProgress(85, 'Text wird auf Canvas gerendert...');

  // 7. Render text directly to canvas (most reliable method)
  // This bypasses html2canvas font issues by rendering text directly
  try {
    const textCanvas = document.createElement('canvas');
    textCanvas.width = canvasWidth;
    textCanvas.height = canvasHeight;
    const textCtx = textCanvas.getContext('2d');
    
    if (!textCtx) {
      throw new Error('Could not get text canvas context');
    }

    // Set background to transparent
    textCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Load fonts first - ensure they're ready before rendering
    if (usedFontsArray.length > 0) {
      // First, ensure fonts are in document head
      const fontFaceCss = await buildFontFaceCssWithDataUrls(usedFontsArray);
      if (fontFaceCss) {
        // Inject fonts into document if not already there
        const existingFontStyle = document.querySelector('style[data-layered-export-fonts]');
        if (!existingFontStyle) {
          const fontStyle = document.createElement('style');
          fontStyle.setAttribute('data-layered-export-fonts', 'true');
          fontStyle.textContent = fontFaceCss;
          document.head.appendChild(fontStyle);
        }
      }
      
      // Load fonts using Font Loading API
      if (document.fonts && document.fonts.load) {
        const loadPromises: Promise<unknown>[] = [];
        for (const family of usedFontsArray) {
          const fontConfig = getFontConfig(family);
          if (!fontConfig) continue;
          for (const variant of fontConfig.variants) {
            const fontSpec = `${variant.style} ${variant.weight} 16px "${fontConfig.cssFamily}"`;
            loadPromises.push(document.fonts.load(fontSpec));
          }
        }
        await Promise.allSettled(loadPromises);
        console.log('✅ Fonts loaded for canvas rendering');
        
        // Wait and verify fonts are ready
        await new Promise(r => setTimeout(r, 300));
        
        // Verify fonts are actually loaded
        for (const family of usedFontsArray) {
          const fontConfig = getFontConfig(family);
          if (fontConfig && document.fonts.check) {
            const isLoaded = document.fonts.check(`16px "${fontConfig.cssFamily}"`);
            console.log(`🔍 Font "${fontConfig.cssFamily}" loaded: ${isLoaded}`);
            if (!isLoaded) {
              console.warn(`⚠️ Font "${fontConfig.cssFamily}" not loaded, waiting longer...`);
              await new Promise(r => setTimeout(r, 500));
            }
          }
        }
      }
    }

    // Render each text element directly to canvas
    const textElements = layers.text.querySelectorAll('text');
    console.log(`🎨 Rendering ${textElements.length} text elements directly to canvas`);
    
    for (const textEl of textElements) {
      const text = textEl.textContent || '';
      if (!text) continue;

      const x = parseFloat(textEl.getAttribute('x') || '0') * scale;
      const y = parseFloat(textEl.getAttribute('y') || '0') * scale;
      const fontSize = parseFloat(textEl.getAttribute('font-size') || '16') * scale;
      const fill = textEl.getAttribute('fill') || '#000000';
      const stroke = textEl.getAttribute('stroke');
      const strokeWidth = parseFloat(textEl.getAttribute('stroke-width') || '0') * scale;
      const textAnchor = textEl.getAttribute('text-anchor') || 'start';
      const fontWeight = textEl.getAttribute('font-weight') || '400';
      const fontStyle = textEl.getAttribute('font-style') || 'normal';
      const opacity = parseFloat(textEl.getAttribute('opacity') || '1');
      const letterSpacing = parseFloat(textEl.getAttribute('letter-spacing') || '0') * scale;

      // Get font family
      const fontFamily = textEl.getAttribute('font-family') || 
                        textEl.style.fontFamily ||
                        window.getComputedStyle(textEl).fontFamily;
      const normalizedFont = normalizeFontFamilyName(fontFamily) || usedFontsArray[0] || 'Arial';
      const fontConfig = getFontConfig(normalizedFont);
      const finalFontFamily = fontConfig ? fontConfig.cssFamily : normalizedFont;

      // Set font
      textCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${finalFontFamily}", sans-serif`;
      textCtx.textAlign = textAnchor === 'middle' ? 'center' : textAnchor === 'end' ? 'right' : 'left';
      // SVG and Canvas both use 'alphabetic' baseline by default
      // SVG y attribute represents the baseline position
      textCtx.textBaseline = 'alphabetic';
      textCtx.fillStyle = fill;
      textCtx.globalAlpha = opacity;
      
      if (stroke && strokeWidth > 0) {
        textCtx.strokeStyle = stroke;
        textCtx.lineWidth = strokeWidth;
      }

      // Handle letter spacing
      // Note: Canvas doesn't support letter-spacing natively, so we need to render each character
      if (letterSpacing !== 0 && Math.abs(letterSpacing) > 0.1) {
        // Manual letter spacing rendering - render each character individually
        // First, calculate total width for text-anchor alignment
        let totalWidth = 0;
        for (let i = 0; i < text.length; i++) {
          const charWidth = textCtx.measureText(text[i]).width;
          totalWidth += charWidth;
          if (i < text.length - 1) {
            totalWidth += letterSpacing;
          }
        }
        
        // Calculate starting X position based on text-anchor
        let currentX = x;
        if (textAnchor === 'middle') {
          currentX = x - totalWidth / 2;
        } else if (textAnchor === 'end') {
          currentX = x - totalWidth;
        }

        // Render each character with letter spacing
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const charWidth = textCtx.measureText(char).width;
          
          if (stroke && strokeWidth > 0) {
            textCtx.strokeText(char, currentX, y);
          }
          textCtx.fillText(char, currentX, y);
          
          // Move to next character position (character width + letter spacing)
          currentX += charWidth + letterSpacing;
        }
      } else {
        // Normal rendering without letter spacing - render entire text at once
        // This is more accurate and faster
        if (stroke && strokeWidth > 0) {
          textCtx.strokeText(text, x, y);
        }
        textCtx.fillText(text, x, y);
      }

      textCtx.globalAlpha = 1;
    }

    console.log('✅ Text rendered directly to canvas');
    
    // Draw text canvas onto main canvas
    ctx.drawImage(textCanvas, 0, 0);
    console.log('✅ Text canvas drawn onto main canvas');
    
    if (onProgress) onProgress(100, 'Fertig!');
  } catch (canvasError) {
    console.error('⚠️ Failed to render text directly to canvas:', canvasError);
    console.log('⚠️ Falling back to html2canvas rendering');
    
    // Fallback to html2canvas
    if (onProgress) onProgress(90, 'Text wird gerendert (Fallback)...');

    // 8. Convert text layer to canvas using html2canvas (fallback)
    try {
      const textSvgClone = layers.text.cloneNode(true) as SVGSVGElement;

      // Set SVG size
      textSvgClone.setAttribute('width', String(canvasWidth));
      textSvgClone.setAttribute('height', String(canvasHeight));

      // Create container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '0px';
      container.style.top = '0px';
      container.style.width = `${canvasWidth}px`;
      container.style.height = `${canvasHeight}px`;
      container.style.overflow = 'visible';
      container.style.zIndex = '999999';
      container.style.pointerEvents = 'none';
      container.style.opacity = '1';
      container.style.visibility = 'visible';

      textSvgClone.style.width = `${canvasWidth}px`;
      textSvgClone.style.height = `${canvasHeight}px`;
      textSvgClone.style.display = 'block';
      textSvgClone.style.opacity = '1';
      textSvgClone.style.visibility = 'visible';

      // Inject font CSS directly into container for html2canvas
      if (usedFontsArray.length > 0) {
        const fontFaceCss = await buildFontFaceCssWithDataUrls(usedFontsArray);
        if (fontFaceCss) {
          const containerStyle = document.createElement('style');
          containerStyle.setAttribute('data-container-fonts', 'true');
          containerStyle.textContent = fontFaceCss;
          container.appendChild(containerStyle);
          console.log('📝 Injected font CSS directly into container');
        }
        
        // Also ensure all text elements in the clone have the correct font-family
        const textElementsInClone = textSvgClone.querySelectorAll('text');
        console.log(`🔍 Found ${textElementsInClone.length} text elements in SVG clone before mounting`);
        textElementsInClone.forEach((textEl, index) => {
          const currentFont = textEl.getAttribute('font-family') || textEl.style.fontFamily;
          const cleanFont = normalizeFontFamilyName(currentFont) || usedFontsArray[0];
          if (cleanFont) {
            const fontWithQuotes = `"${cleanFont}"`;
            textEl.setAttribute('font-family', fontWithQuotes);
            textEl.style.fontFamily = fontWithQuotes;
            // Also set it in the computed style by forcing a reflow
            textEl.style.setProperty('font-family', fontWithQuotes, 'important');
            console.log(`✅ Set font-family "${fontWithQuotes}" on text[${index}] before mounting`);
          }
        });
      }

      container.appendChild(textSvgClone);
      document.body.appendChild(container);

      // Wait for fonts and rendering
      await new Promise(r => setTimeout(r, 500));

      console.log('🔍 Rendering text layer with html2canvas (using embedded SVG fonts)');

      // Render with html2canvas - text is already converted to paths, so no fonts needed
      const textCanvas = await html2canvas(container, {
        width: canvasWidth,
        height: canvasHeight,
        scale: 1,
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        logging: false,
        removeContainer: false,
        foreignObjectRendering: false, // Text is already paths, no fonts needed
        onclone: async (clonedDoc) => {
          // Ensure fonts are available in the cloned document
          if (usedFontsArray.length > 0) {
            const fontFaceCss = await buildFontFaceCssWithDataUrls(usedFontsArray);
            if (fontFaceCss) {
              // Remove any existing font links from cloned document
              const existingLinks = clonedDoc.querySelectorAll('link[rel="stylesheet"], link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]');
              existingLinks.forEach(link => link.remove());
              
              // Method 1: Add Google Fonts link (some renderers prefer this)
              const googleFontsUrl = getGoogleFontsUrl(usedFontsArray);
              if (googleFontsUrl) {
                const link = clonedDoc.createElement('link');
                link.rel = 'stylesheet';
                link.href = googleFontsUrl;
                link.setAttribute('data-google-fonts', 'true');
                clonedDoc.head.insertBefore(link, clonedDoc.head.firstChild);
                console.log('📝 Added Google Fonts link to cloned document head');
              }
              
              // Method 2: Inject fonts into cloned document head (MUST be first)
              const style = clonedDoc.createElement('style');
              style.setAttribute('data-export-fonts', 'true');
              
              // Build comprehensive CSS with @import and @font-face
              let comprehensiveCss = '';
              if (googleFontsUrl) {
                comprehensiveCss += `@import url('${googleFontsUrl}');\n\n`;
              }
              comprehensiveCss += fontFaceCss;
              
              style.textContent = comprehensiveCss;
              clonedDoc.head.insertBefore(style, clonedDoc.head.firstChild);
              console.log('📝 Injected font-face CSS into cloned document head');
              
              // Also inject fonts into the cloned container if it exists
              const clonedContainer = clonedDoc.querySelector('div');
              if (clonedContainer) {
                const containerStyle = clonedDoc.createElement('style');
                containerStyle.setAttribute('data-container-fonts', 'true');
                containerStyle.textContent = fontFaceCss;
                clonedContainer.insertBefore(containerStyle, clonedContainer.firstChild);
                console.log('📝 Injected font-face CSS into cloned container');
              }
              
              // Also ensure SVG has fonts embedded
              const clonedSvg = clonedDoc.querySelector('svg');
              if (clonedSvg) {
                let svgStyleElement = clonedSvg.querySelector('style') as Element | null;
                if (!svgStyleElement) {
                  svgStyleElement = clonedDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
                  clonedSvg.insertBefore(svgStyleElement, clonedSvg.firstChild);
                }
                const existingSvgStyle = (svgStyleElement as { textContent: string | null }).textContent || '';
                // Remove existing @font-face rules
                const cleanedSvgStyle = existingSvgStyle.replace(/@font-face\s*\{[^}]*\}/g, '').trim();
                (svgStyleElement as { textContent: string }).textContent = cleanedSvgStyle + (cleanedSvgStyle ? '\n\n' : '') + fontFaceCss;
                console.log('📝 Injected font-face CSS into cloned SVG');
                
                // Try to find text elements - they might be in the SVG directly or in a foreignObject
                let clonedTextElements = clonedSvg.querySelectorAll('text');
                if (clonedTextElements.length === 0) {
                  // Try finding in foreignObject (html2canvas might wrap SVG in foreignObject)
                  const foreignObject = clonedDoc.querySelector('foreignObject');
                  if (foreignObject) {
                    clonedTextElements = foreignObject.querySelectorAll('text');
                    console.log(`🔍 Found ${clonedTextElements.length} text elements in foreignObject`);
                  }
                }
                
                // Also try finding all text elements in the entire document
                if (clonedTextElements.length === 0) {
                  clonedTextElements = clonedDoc.querySelectorAll('text');
                  console.log(`🔍 Found ${clonedTextElements.length} text elements in entire cloned document`);
                }
                
                console.log(`🔍 Total found ${clonedTextElements.length} text elements in cloned SVG/document`);
                
                clonedTextElements.forEach((textEl, index) => {
                  const currentFont = textEl.getAttribute('font-family') || 
                                     textEl.style.fontFamily;
                  console.log(`🔤 Text[${index}]: currentFont="${currentFont}", content="${textEl.textContent?.substring(0, 30)}"`);
                  
                  if (currentFont) {
                    const cleanFont = normalizeFontFamilyName(currentFont);
                    if (cleanFont) {
                      const fontWithQuotes = `"${cleanFont}"`;
                      textEl.setAttribute('font-family', fontWithQuotes);
                      textEl.style.fontFamily = fontWithQuotes;
                      console.log(`✅ Set font-family to "${fontWithQuotes}" for text[${index}]`);
                    } else {
                      console.warn(`⚠️ Could not normalize font: "${currentFont}"`);
                    }
                  } else {
                    // If no font found, set it explicitly
                    const defaultFont = usedFontsArray[0];
                    if (defaultFont) {
                      const fontWithQuotes = `"${defaultFont}"`;
                      textEl.setAttribute('font-family', fontWithQuotes);
                      textEl.style.fontFamily = fontWithQuotes;
                      console.log(`✅ Set default font-family "${fontWithQuotes}" for text[${index}]`);
                    }
                  }
                });
                console.log(`✅ Normalized font-family for ${clonedTextElements.length} text elements in cloned SVG`);
              }
              
              // Also try to apply fonts via CSS to all text elements in the cloned document
              if (usedFontsArray.length > 0) {
                const defaultFont = usedFontsArray[0];
                const fontWithQuotes = `"${defaultFont}"`;
                const textStyleRule = `text { font-family: ${fontWithQuotes} !important; }`;
                const textStyle = clonedDoc.createElement('style');
                textStyle.setAttribute('data-text-fonts', 'true');
                textStyle.textContent = textStyleRule;
                clonedDoc.head.appendChild(textStyle);
                console.log(`📝 Added CSS rule to force font-family on all text elements: ${textStyleRule}`);
              }
              
              // Load fonts in cloned document - wait longer for fonts to be ready
              if (clonedDoc.fonts && clonedDoc.fonts.load) {
                const loadPromises: Promise<unknown>[] = [];
                for (const family of usedFontsArray) {
                  const fontConfig = getFontConfig(family);
                  if (!fontConfig) continue;
                  for (const variant of fontConfig.variants) {
                    const fontSpec = `${variant.style} ${variant.weight} 16px "${fontConfig.cssFamily}"`;
                    loadPromises.push(clonedDoc.fonts.load(fontSpec));
                  }
                }
                await Promise.allSettled(loadPromises);
                console.log('✅ Fonts loaded in cloned document');
                // Wait longer for fonts to be fully applied
                await new Promise(r => setTimeout(r, 500));
              }
            }
          }
        },
      });

      // Draw text canvas onto main canvas
      ctx.drawImage(textCanvas, 0, 0);

      // Clean up
      document.body.removeChild(container);

      console.log('✅ Text layer rendered with html2canvas');
    } catch (html2canvasError) {
      console.warn('⚠️ Failed to render text layer with html2canvas:', html2canvasError);
      // Continue without text layer
    }
  } finally {
    // Clean up font style element
    if (fontStyleElement && fontStyleElement.parentNode) {
      document.head.removeChild(fontStyleElement);
      console.log('🧹 Cleaned up font CSS from document head');
    }
  }

    if (onProgress) onProgress(95, 'Bild wird finalisiert...');

    // 8. Convert canvas to blob
    const quality = format === 'jpeg' ? 0.92 : 1;
    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';

    const resultBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        mimeType,
        quality
      );
    });

    // 9. Convert blob to data URL
    const dataUrl = await blobToDataUrl(resultBlob);

    console.log(`✅ Layered SVG converted to ${format}: ${(resultBlob.size / 1024).toFixed(1)} KB`);

    if (onProgress) onProgress(100, 'Fertig!');

    return { dataUrl, blob: resultBlob };
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
 * Unified platform-specific download handler using layered approach
 */
export const handlePlatformDownloadLayered = async (options: PlatformDownloadOptions): Promise<void> => {
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
    if (onProgressUpdate) {
      onProgressUpdate(5, 'SVG wird in Ebenen aufgeteilt...');
    }

    // Get original dimensions from SVG
    const originalWidth = parseInt(svgElement.getAttribute('width') || '1080');
    const originalHeight = parseInt(svgElement.getAttribute('height') || '1350');

    if (onProgressUpdate) {
      onProgressUpdate(10, 'Ebenen werden erstellt...');
    }

    // Separate SVG into layers
    const layers = separateSVGIntoLayers(svgElement);

    // Determine format
    const lower = fileName.toLowerCase();
    const fmt: 'png' | 'jpeg' | 'webp' =
      lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'jpeg' :
      lower.endsWith('.webp') ? 'webp' : 'png';

    // Convert to image
    const result = await convertLayeredSvgToPng(layers, {
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
