/**
 * Optimized SVG to Image conversion for Instagram sharing
 * Uses html2canvas with proper font and image handling
 */

import { normalizeFontFamilyName, AVAILABLE_FONTS, getFontConfig } from '@/config/fonts';
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
        // Convert font URL to data URL
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
        // Fallback: use external URL (may not work when SVG is loaded as image)
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

  // Find or create style element in SVG
  let styleElement = svgElement.querySelector('style') as Element | null;
  if (!styleElement) {
    styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    svgElement.insertBefore(styleElement, svgElement.firstChild);
  }

  // Remove existing @font-face rules to avoid conflicts
  let existingStyle = (styleElement as { textContent: string | null }).textContent || '';
  if (existingStyle) {
    existingStyle = existingStyle.replace(/@font-face\s*\{[^}]*\}/g, '');
    existingStyle = existingStyle.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
    console.log('🧹 Removed existing @font-face rules from SVG');
  }

  // Add new font-face rules with data URLs
  (styleElement as { textContent: string }).textContent = existingStyle + (existingStyle ? '\n\n' : '') + fontFaceCss;
  
  console.log(`✅ Embedded ${fontFaceCss.split('@font-face').length - 1} font-face rules in SVG`);
  
  return fontFaceCss;
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
 * Ensures fonts are loaded and images are inlined before capture
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

  // Get fonts used in SVG
  const usedFonts = extractUsedFontFamilies(svgElement);
  const usedFontsArray = usedFonts.size > 0 ? Array.from(usedFonts) : [];
  
  // Ensure fonts are loaded in the document
  if (usedFontsArray.length > 0) {
    console.log('🔤 Loading fonts:', usedFontsArray);
    
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
  
  // Create container for html2canvas
  const container = document.createElement('div');
  container.style.position = 'fixed'; // Use fixed instead of absolute for better visibility
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = `${width * scale}px`;
  container.style.height = `${height * scale}px`;
  container.style.overflow = 'visible';
  container.style.zIndex = '999999';
  container.style.pointerEvents = 'none';
  container.style.opacity = '1'; // Ensure it's visible
  container.style.visibility = 'visible';
  
  svgClone.style.width = `${width * scale}px`;
  svgClone.style.height = `${height * scale}px`;
  svgClone.style.display = 'block';
  svgClone.style.opacity = '1';
  svgClone.style.visibility = 'visible';
  
  container.appendChild(svgClone);
  document.body.appendChild(container);

  // Wait for all embedded images to load in the SVG clone
  const allImages = extractImageElements(svgClone);
  console.log('🖼️ Waiting for', allImages.length, 'embedded images to load in SVG clone...');
  
  // Ensure all images have both href and xlink:href attributes for html2canvas
  allImages.forEach((img, index) => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
    if (href) {
      // Set both attributes to ensure html2canvas can find them
      img.setAttribute('href', href);
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
      console.log(`🖼️ Image ${index + 1} in container:`, href.substring(0, 50) + (href.length > 50 ? '...' : ''));
    }
  });
  
  // Verify images are in the container before html2canvas
  const imagesInContainer = extractImageElements(svgClone);
  console.log(`🔍 Verified ${imagesInContainer.length} images in container before html2canvas`);
  
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
  
  // Additional wait to ensure images are fully rendered
  await new Promise(resolve => setTimeout(resolve, 300));

  // Remove external font links before html2canvas
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
    // Wait for fonts to be ready
    await new Promise(resolve => setTimeout(resolve, 300));

    // Use html2canvas to capture
    console.log('🔄 Capturing SVG using html2canvas...');
    
    const capturedCanvas = await html2canvas(container, {
      width: width * scale,
      height: height * scale,
      scale: 1,
      backgroundColor: null, // Transparent background so images show through
      useCORS: true, // Allow CORS for data URLs
      allowTaint: false, // Don't allow tainted canvas since we're using data URLs
      logging: false,
      proxy: undefined,
      imageTimeout: 15000, // Wait up to 15 seconds for images to load
      removeContainer: false,
      foreignObjectRendering: true, // Enable foreignObject rendering for better SVG support
      onclone: async (clonedDoc) => {
        // Remove all external font links from cloned document
        const allExternalLinks = clonedDoc.querySelectorAll('link[rel="stylesheet"], link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]');
        allExternalLinks.forEach(link => {
          const linkEl = link as HTMLLinkElement;
          linkEl.removeAttribute('href');
          linkEl.removeAttribute('rel');
          link.remove();
        });
        console.log(`🧹 Removed ${allExternalLinks.length} external links from cloned document`);
        
        // Get cloned container and SVG first
        const clonedContainer = clonedDoc.querySelector('div');
        const clonedSvg = clonedContainer?.querySelector('svg') || clonedDoc.querySelector('svg');
        
        // Inject fonts with data URLs into cloned document
        if (usedFontsArray.length > 0) {
          console.log('🔤 Injecting fonts into cloned document...');
          const fontFaceCss = await buildFontFaceCssWithDataUrls(usedFontsArray);
          
          if (fontFaceCss) {
            // Create style element with font-face rules
            const style = clonedDoc.createElement('style');
            style.textContent = fontFaceCss;
            clonedDoc.head.insertBefore(style, clonedDoc.head.firstChild);
            console.log('📝 Injected font-face CSS into cloned document');
            
            // Also inject into SVG if it exists
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
            
            // Load fonts in cloned document
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
              
              // Verify fonts are loaded
              for (const family of usedFontsArray) {
                const fontConfig = getFontConfig(family);
                if (!fontConfig) continue;
                const fontSpec = `normal 400 16px "${fontConfig.cssFamily}"`;
                const isLoaded = clonedDoc.fonts.check(fontSpec);
                console.log(`🔍 Font ${fontConfig.cssFamily} loaded in cloned doc: ${isLoaded}`);
              }
            }
            
            // Additional wait for fonts to be applied
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Ensure images in cloned SVG are visible and properly loaded
        
        if (clonedSvg && clonedContainer) {
          // Get images from original container to restore them if missing
          const originalSvg = container.querySelector('svg');
          const originalImages = originalSvg ? Array.from(originalSvg.querySelectorAll('image')) : [];
          
          const clonedImages = clonedSvg.querySelectorAll('image');
          console.log(`🖼️ Found ${clonedImages.length} images in cloned SVG (original had ${originalImages.length})`);
          
          // If images are missing in clone, restore them from original
          if (clonedImages.length === 0 && originalImages.length > 0) {
            console.log('⚠️ Images missing in clone, restoring from original...');
            
            // First, try to restore in SVG
            originalImages.forEach((originalImg, index) => {
              const href = originalImg.getAttribute('href') || originalImg.getAttribute('xlink:href') || '';
              if (href) {
                // Copy all attributes from original
                const clonedImg = clonedDoc.createElementNS('http://www.w3.org/2000/svg', 'image');
                
                // Copy all attributes
                Array.from(originalImg.attributes).forEach(attr => {
                  if (attr.name === 'href' || attr.name === 'xlink:href') {
                    clonedImg.setAttribute('href', attr.value);
                    clonedImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', attr.value);
                  } else {
                    clonedImg.setAttribute(attr.name, attr.value);
                  }
                });
                
                // Ensure both href attributes are set
                clonedImg.setAttribute('href', href);
                clonedImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
                
                // Copy style if present
                if (originalImg.getAttribute('style')) {
                  clonedImg.setAttribute('style', originalImg.getAttribute('style') || '');
                }
                
                // Insert at the beginning of SVG (before other elements) to ensure proper rendering
                const firstChild = clonedSvg.firstChild;
                if (firstChild) {
                  clonedSvg.insertBefore(clonedImg, firstChild);
                } else {
                  clonedSvg.appendChild(clonedImg);
                }
                
                console.log(`✅ Restored image ${index + 1} in cloned SVG`);
              }
            });
            
            // Also create img elements as fallback for html2canvas
            // html2canvas sometimes has issues with SVG image elements
            const fallbackLoadPromises: Promise<void>[] = [];
            
            for (let index = 0; index < originalImages.length; index++) {
              const originalImg = originalImages[index];
              const href = originalImg.getAttribute('href') || originalImg.getAttribute('xlink:href') || '';
              if (href && href.startsWith('data:')) {
                const img = clonedDoc.createElement('img');
                img.src = href;
                img.style.position = 'absolute';
                
                // Parse position and size from SVG attributes
                const x = originalImg.getAttribute('x') || '0';
                const y = originalImg.getAttribute('y') || '0';
                const width = originalImg.getAttribute('width') || '100%';
                const height = originalImg.getAttribute('height') || '100%';
                const preserveAspectRatio = originalImg.getAttribute('preserveAspectRatio') || 'xMidYMid slice';
                
                // Convert to pixels if needed
                const xPx = x.includes('%') ? x : `${parseFloat(x) || 0}px`;
                const yPx = y.includes('%') ? y : `${parseFloat(y) || 0}px`;
                const widthPx = width.includes('%') ? width : `${parseFloat(width) || 100}px`;
                const heightPx = height.includes('%') ? height : `${parseFloat(height) || 100}px`;
                
                img.style.left = xPx;
                img.style.top = yPx;
                img.style.width = widthPx;
                img.style.height = heightPx;
                img.style.objectFit = preserveAspectRatio.includes('slice') ? 'cover' : 'contain';
                img.style.pointerEvents = 'none';
                img.style.zIndex = '0'; // Behind SVG content (text should be on top)
                img.style.opacity = '1';
                img.style.visibility = 'visible';
                img.style.display = 'block';
                img.style.margin = '0';
                img.style.padding = '0';
                img.style.border = 'none';
                
                // Ensure image loads before html2canvas captures
                const loadPromise = new Promise<void>((resolve) => {
                  img.onload = () => {
                    console.log(`✅ Fallback img ${index + 1} loaded`);
                    resolve();
                  };
                  img.onerror = () => {
                    console.warn(`⚠️ Fallback img ${index + 1} failed to load`);
                    resolve();
                  };
                });
                
                // Insert image into container - check if SVG is a child first
                if (clonedSvg && clonedSvg.parentNode === clonedContainer) {
                  clonedContainer.insertBefore(img, clonedSvg); // Insert before SVG so it's behind
                } else {
                  clonedContainer.appendChild(img); // Just append if SVG structure is different
                }
                console.log(`✅ Created fallback img element ${index + 1} for html2canvas at (${xPx}, ${yPx}) size ${widthPx}x${heightPx}`);
                
                fallbackLoadPromises.push(loadPromise);
              }
            }
            
            // Wait for all fallback images to load
            await Promise.allSettled(fallbackLoadPromises);
            
            // Verify fallback images are in the cloned container
            const fallbackImgs = clonedContainer.querySelectorAll('img');
            console.log(`🔍 Verified ${fallbackImgs.length} fallback img elements in cloned container`);
          }
          
          // Ensure all images have both href and xlink:href
          const finalImages = clonedSvg.querySelectorAll('image');
          finalImages.forEach((img, index) => {
            const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
            if (href) {
              // Set both attributes
              img.setAttribute('href', href);
              img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
              console.log(`🖼️ Cloned image ${index + 1} href:`, href.substring(0, 50) + (href.length > 50 ? '...' : ''));
              
              // Ensure image is visible
              img.style.opacity = '1';
              img.style.visibility = 'visible';
              
              // Force image to load by creating a temporary image element
              if (href.startsWith('data:')) {
                const tempImg = new Image();
                tempImg.src = href;
                // Don't wait, just trigger the load
              }
            }
          });
        } else {
          console.warn('⚠️ No SVG or container found in cloned document');
        }
        
        // Wait a bit for images to be ready in the cloned document
        await new Promise(resolve => setTimeout(resolve, 300));
      },
    });

    console.log('✅ SVG captured with html2canvas');

    // Draw images directly onto the canvas if html2canvas didn't capture them
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width * scale;
    finalCanvas.height = height * scale;
    const finalCtx = finalCanvas.getContext('2d', { alpha: backgroundColor === 'transparent' });

    if (!finalCtx) {
      throw new Error('Could not get final canvas context');
    }

    // Set background
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
    // Use composite mode to preserve images where html2canvas is transparent
    finalCtx.globalCompositeOperation = 'source-over';
    finalCtx.drawImage(capturedCanvas, 0, 0);
    console.log('✅ Drew html2canvas result (with text) on top of images');

    // Convert canvas to data URL
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
    // Restore font links
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
    
    // Remove container
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

  // Convert to PNG using resvg-js
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
