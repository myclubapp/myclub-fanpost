/**
 * Optimized SVG to Image conversion for Instagram sharing
 * Uses html2canvas for reliable rendering of text and images
 */

import { normalizeFontFamilyName, AVAILABLE_FONTS, getFontConfig } from '@/config/fonts';
import * as fontkit from 'fontkit';
import html2canvas from 'html2canvas';

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
 * Converts font URL to data URL for embedding in SVG
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
 * Builds font-face CSS with data URLs (doesn't modify SVG)
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
 * Embeds fonts directly in SVG as @font-face rules with data URLs
 */
const embedFontsInSvg = async (svgElement: SVGSVGElement, fontFamilies: string[]): Promise<string> => {
  if (fontFamilies.length === 0) return '';

  const fontFaceCss = await buildFontFaceCssWithDataUrls(fontFamilies);
  if (!fontFaceCss) return '';

  let styleElement = svgElement.querySelector('style') as Element | null;
  if (!styleElement) {
    styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    svgElement.insertBefore(styleElement, svgElement.firstChild);
  }

  let existingStyle = (styleElement as { textContent: string | null }).textContent || '';
  if (existingStyle) {
    existingStyle = existingStyle.replace(/@font-face\s*\{[^}]*\}/g, '');
    existingStyle = existingStyle.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
    console.log('🧹 Removed existing @font-face rules from SVG');
  }

  (styleElement as { textContent: string }).textContent = existingStyle + (existingStyle ? '\n\n' : '') + fontFaceCss;
  console.log(`✅ Embedded ${fontFaceCss.split('@font-face').length - 1} font-face rules in SVG`);
  return fontFaceCss;
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
 * Font cache to avoid re-loading the same font
 */
const fontCache = new Map<string, fontkit.Font>();

/**
 * Load a font using fontkit
 */
const loadFont = async (url: string): Promise<fontkit.Font> => {
  // Check cache first
  if (fontCache.has(url)) {
    return fontCache.get(url)!;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch font: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    // fontkit.create accepts ArrayBuffer directly in the browser
    const font = fontkit.create(arrayBuffer as ArrayBuffer);

    fontCache.set(url, font);
    console.log(`✅ Loaded font: ${url}`);

    return font;
  } catch (error) {
    console.error(`Failed to load font: ${url}`, error);
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

    // Get font scale based on fontSize
    const scale = fontSize / font.unitsPerEm;

    // Create a glyph run
    const glyphRun = font.layout(text);

    // Create a group element to hold all paths
    const groupElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    groupElement.setAttribute('fill', fill);

    // Copy any additional attributes
    const opacity = textElement.getAttribute('opacity');
    if (opacity) groupElement.setAttribute('opacity', opacity);

    const existingTransform = textElement.getAttribute('transform');
    if (existingTransform) {
      groupElement.setAttribute('transform', existingTransform);
    }

    let currentX = 0; // Start at 0, will be offset by group transform

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
          const glyphX = x + currentX;
          const glyphTransform = `translate(${glyphX}, ${y}) scale(${scale}, ${-scale})`;
          pathElement.setAttribute('transform', glyphTransform);

          groupElement.appendChild(pathElement);
        }
      }

      // Move to next glyph position
      currentX += position.xAdvance * scale;
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
      window.getComputedStyle(textElement).fontFamily;

    const normalized = normalizeFontFamilyName(fontFamily);
    if (!normalized) return;

    const fontConfig = getFontConfig(normalized);
    if (!fontConfig) return;

    // For now, use the first variant (we can improve this to match font-weight/style)
    const fontUrl = fontConfig.variants[0]?.url;
    if (!fontUrl) return;

    if (!fontGroups.has(normalized)) {
      fontGroups.set(normalized, { elements: [], fontUrl });
    }

    fontGroups.get(normalized)!.elements.push(textElement);
  });

  console.log(`📦 Grouped into ${fontGroups.size} font families`);

  let convertedCount = 0;

  // Convert text elements for each font
  for (const [fontFamily, { elements, fontUrl }] of fontGroups) {
    try {
      console.log(`🔤 Loading font for conversion: ${fontFamily}`);
      const font = await loadFont(fontUrl);

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
 * Converts SVG to PNG using html2canvas
 * Works with text and inlined images
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

  if (onProgress) onProgress(70, 'SVG wird in Bild konvertiert...');

  const usedFonts = extractUsedFontFamilies(svgElement);
  const usedFontsArray = usedFonts.size > 0 ? Array.from(usedFonts) : [];
  
  if (usedFontsArray.length > 0) {
    console.log('🔤 Loading fonts:', usedFontsArray);
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
    }
  }

  // Embed fonts in original SVG before cloning
  if (usedFontsArray.length > 0) {
    console.log('🔤 Embedding fonts in original SVG...');
    await embedFontsInSvg(svgElement, usedFontsArray);
  }

  // Create a clone and mount it for html2canvas
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Set SVG attributes
  svgClone.setAttribute('width', String(width * scale));
  svgClone.setAttribute('height', String(height * scale));
  svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = `${width * scale}px`;
  container.style.height = `${height * scale}px`;
  container.style.overflow = 'visible';
  container.style.zIndex = '999999';
  container.style.pointerEvents = 'none';
  container.style.opacity = '1';
  container.style.visibility = 'visible';
  
  svgClone.style.width = `${width * scale}px`;
  svgClone.style.height = `${height * scale}px`;
  svgClone.style.display = 'block';
  svgClone.style.opacity = '1';
  svgClone.style.visibility = 'visible';
  
  container.appendChild(svgClone);
  document.body.appendChild(container);

  const allImages = extractImageElements(svgClone);
  console.log('🖼️ Waiting for', allImages.length, 'embedded images to load in SVG clone...');
  
  allImages.forEach((img, index) => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
    if (href) {
      img.setAttribute('href', href);
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
      console.log(`🖼️ Image ${index + 1} in container:`, href.substring(0, 50) + (href.length > 50 ? '...' : ''));
    }
  });
  
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
          resolve();
        };
        tempImg.src = href;
      } else {
        resolve();
      }
    });
  }));

  console.log('✅ All embedded images loaded in SVG clone');
  await new Promise(resolve => setTimeout(resolve, 300));

  const originalFontLinks = document.querySelectorAll('link[data-template-fonts="true"], link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]');
  const removedLinks: HTMLLinkElement[] = [];
  
  originalFontLinks.forEach(link => {
    const linkEl = link as HTMLLinkElement;
    const originalHref = linkEl.href;
    const originalRel = linkEl.rel;
    linkEl.removeAttribute('href');
    linkEl.removeAttribute('rel');
    linkEl.setAttribute('data-original-href', originalHref);
    linkEl.setAttribute('data-original-rel', originalRel);
    removedLinks.push(linkEl);
    link.remove();
  });
  
  console.log(`🧹 Temporarily removed ${removedLinks.length} external font links`);

  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const capturedCanvas = await html2canvas(container, {
      width: width * scale,
      height: height * scale,
      scale: 1,
      backgroundColor: null, // Transparent background so images show through
      useCORS: true,
      allowTaint: false,
      logging: false,
      proxy: undefined,
      imageTimeout: 15000,
      removeContainer: false,
      foreignObjectRendering: true,
      onclone: async (clonedDoc) => {
        const allExternalLinks = clonedDoc.querySelectorAll('link[rel="stylesheet"], link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]');
        allExternalLinks.forEach(link => {
          const linkEl = link as HTMLLinkElement;
          linkEl.removeAttribute('href');
          linkEl.removeAttribute('rel');
          link.remove();
        });
        console.log(`🧹 Removed ${allExternalLinks.length} external links from cloned document`);
        
        const clonedContainer = clonedDoc.querySelector('div');
        const clonedSvg = clonedContainer?.querySelector('svg') || clonedDoc.querySelector('svg');
        
        if (usedFontsArray.length > 0) {
          console.log('🔤 Injecting fonts into cloned document...');
          const fontFaceCss = await buildFontFaceCssWithDataUrls(usedFontsArray);
          
          if (fontFaceCss) {
            const style = clonedDoc.createElement('style');
            style.textContent = fontFaceCss;
            clonedDoc.head.insertBefore(style, clonedDoc.head.firstChild);
            console.log('📝 Injected font-face CSS into cloned document');
            
            if (clonedSvg) {
              let svgStyleElement = clonedSvg.querySelector('style') as Element | null;
              if (!svgStyleElement) {
                svgStyleElement = clonedDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
                clonedSvg.insertBefore(svgStyleElement, clonedSvg.firstChild);
              }
              const existingSvgStyle = (svgStyleElement as { textContent: string | null }).textContent || '';
              (svgStyleElement as { textContent: string }).textContent = existingSvgStyle + (existingSvgStyle ? '\n\n' : '') + fontFaceCss;
              console.log('📝 Injected font-face CSS into cloned SVG');
            }
            
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
            }
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      },
    });

    console.log('✅ SVG captured with html2canvas');

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width * scale;
    finalCanvas.height = height * scale;
    const finalCtx = finalCanvas.getContext('2d', { alpha: backgroundColor === 'transparent' });

    if (!finalCtx) {
      throw new Error('Could not get final canvas context');
    }

    if (backgroundColor !== 'transparent') {
      finalCtx.fillStyle = backgroundColor;
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    }

    // Draw images first (background layer), then html2canvas result (with text) on top
    const originalSvg = container.querySelector('svg');
    const originalImages = originalSvg ? Array.from(originalSvg.querySelectorAll('image')) : [];
    
    console.log(`🖼️ Drawing ${originalImages.length} images directly onto canvas (background layer)...`);
    
    // Draw images first as background
    await Promise.all(originalImages.map(async (img, index) => {
      const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
      if (href && href.startsWith('data:')) {
        try {
          const image = new Image();
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = reject;
            image.src = href;
          });

          const x = parseFloat(img.getAttribute('x') || '0') * scale;
          const y = parseFloat(img.getAttribute('y') || '0') * scale;
          const imgWidth = parseFloat(img.getAttribute('width') || String(width)) * scale;
          const imgHeight = parseFloat(img.getAttribute('height') || String(height)) * scale;
          
          finalCtx.drawImage(image, x, y, imgWidth, imgHeight);
          console.log(`✅ Drew image ${index + 1} directly onto canvas at (${x}, ${y}) size ${imgWidth}x${imgHeight}`);
        } catch (error) {
          console.warn(`⚠️ Failed to draw image ${index + 1} directly onto canvas:`, error);
        }
      }
    }));

    // Then draw html2canvas result on top (with text)
    finalCtx.globalCompositeOperation = 'source-over';
    finalCtx.drawImage(capturedCanvas, 0, 0);
    console.log('✅ Drew html2canvas result (with text) on top of images');

    let dataUrl = '';
    if (format === 'jpeg') {
      dataUrl = finalCanvas.toDataURL('image/jpeg', quality);
    } else if (format === 'webp') {
      dataUrl = finalCanvas.toDataURL('image/webp', quality);
    } else {
      dataUrl = finalCanvas.toDataURL('image/png');
    }

    if (!dataUrl || dataUrl.length < 100) {
      throw new Error('Generated data URL is invalid');
    }

    console.log(`✅ SVG converted to ${format}: ${(dataUrl.length / 1024).toFixed(1)} KB`);

    if (onProgress) onProgress(90, 'Bild wird finalisiert...');

    return dataUrl;
  } finally {
    removedLinks.forEach(link => {
      const originalHref = link.getAttribute('data-original-href');
      const originalRel = link.getAttribute('data-original-rel');
      if (originalHref) {
        link.setAttribute('href', originalHref);
        link.removeAttribute('data-original-href');
      }
      if (originalRel) {
        link.setAttribute('rel', originalRel);
        link.removeAttribute('data-original-rel');
      }
      if (link.parentNode === null) {
        document.head.appendChild(link);
      }
    });
    console.log(`✅ Restored ${removedLinks.length} external font links`);
    
    if (container.parentNode) {
      document.body.removeChild(container);
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
      onProgress(20, 'Bilder werden geladen...');
    }

    // Skip text-to-path conversion - html2canvas can render text directly
    // await convertAllTextToPaths(svgClone);

    await inlineAllImages(svgClone, onImageStatusUpdate);
  } finally {
    if (svgClone.parentNode) {
      document.body.removeChild(svgClone);
    }
  }

  if (onProgress) {
    onProgress(60, 'Bilder wurden geladen...');
  }

  // Convert to PNG using native Canvas API
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
