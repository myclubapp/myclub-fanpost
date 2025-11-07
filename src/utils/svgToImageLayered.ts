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

import { normalizeFontFamilyName, getFontConfig } from '@/config/fonts';
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
 * Extracts font families used in text elements
 */
const extractUsedFontFamilies = (svgElement: SVGSVGElement): Set<string> => {
  const fontFamilies = new Set<string>();
  const textElements = svgElement.querySelectorAll('text');

  textElements.forEach((element) => {
    const fontFamily = element.getAttribute('font-family') ||
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
 * Embeds fonts in an SVG element
 */
const embedFontsInSvg = async (svgElement: SVGSVGElement, fontFamilies: string[]): Promise<void> => {
  if (fontFamilies.length === 0) return;

  const fontFaceCss = await buildFontFaceCssWithDataUrls(fontFamilies);
  if (!fontFaceCss) return;

  // Remove existing style elements first
  const existingStyles = svgElement.querySelectorAll('style');
  existingStyles.forEach(style => style.remove());

  // Create new style element
  const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleElement.setAttribute('type', 'text/css');

  // Just set the CSS directly (browser will handle encoding)
  styleElement.textContent = fontFaceCss;

  // Insert at the very beginning of SVG
  svgElement.insertBefore(styleElement, svgElement.firstChild);

  console.log(`✅ Embedded ${fontFaceCss.split('@font-face').length - 1} font-face rules in SVG`);
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

  // Build font CSS with data URLs and inject into document head
  let fontStyleElement: HTMLStyleElement | null = null;
  if (usedFontsArray.length > 0) {
    console.log('🔤 Preparing fonts for text layer:', usedFontsArray);

    // Build font CSS with data URLs
    const fontFaceCss = await buildFontFaceCssWithDataUrls(usedFontsArray);

    // Inject fonts into document head so html2canvas can use them
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

    // Normalize font-family attributes on text elements
    const textElements = layers.text.querySelectorAll('text');
    textElements.forEach((textEl) => {
      const currentFont = textEl.getAttribute('font-family') ||
                         textEl.style.fontFamily;
      if (currentFont) {
        const cleanFont = normalizeFontFamilyName(currentFont);
        if (cleanFont) {
          textEl.setAttribute('font-family', cleanFont);
          textEl.style.fontFamily = cleanFont;
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

  if (onProgress) onProgress(90, 'Text wird gerendert...');

  // 7. Convert text layer to canvas using html2canvas
  // Use the same approach as the old working code
  try {
    // Clone text SVG
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

    container.appendChild(textSvgClone);
    document.body.appendChild(container);

    // Wait for fonts and rendering
    await new Promise(r => setTimeout(r, 300));

    console.log('🔍 Rendering text layer with html2canvas (using document fonts)');

    // Render with html2canvas (it will use fonts from document)
    const textCanvas = await html2canvas(container, {
      width: canvasWidth,
      height: canvasHeight,
      scale: 1,
      backgroundColor: null,
      useCORS: true,
      allowTaint: false,
      logging: false,
      removeContainer: false,
      foreignObjectRendering: false,
    });

    // Draw text canvas onto main canvas
    ctx.drawImage(textCanvas, 0, 0);

    // Clean up
    document.body.removeChild(container);

    console.log('✅ Text layer rendered with html2canvas');
  } catch (error) {
    console.warn('⚠️ Failed to render text layer:', error);
    // Continue without text layer
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
