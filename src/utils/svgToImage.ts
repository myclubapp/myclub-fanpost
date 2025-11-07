/**
 * Utility for converting SVG elements to downloadable images
 * Uses react-svg-to-image to preserve CSS styling and fonts
 */

import toImg from 'react-svg-to-image';

import { normalizeFontFamilyName, AVAILABLE_FONTS, ensureTemplateFontsLoaded } from '@/config/fonts';

const DEFAULT_FONT_FAMILY = Object.values(AVAILABLE_FONTS)[0]?.cssFamily ?? 'Bebas Neue';

export interface ImageLoadProgress {
  url: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  size?: string;
  error?: string;
}

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
 * Tries direct fetch first, then falls back to proxy
 */
const fetchImageAsDataUrl = async (url: string): Promise<string> => {
  const proxyBase = `https://rgufivgtyonitgjlozog.functions.supabase.co/image-proxy?url=`;

  // Try direct fetch first
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch (error) {
    console.warn(`Direct fetch failed for ${url}, trying proxy...`, error);

    // Fallback to proxy
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
const extractImageElements = (svgElement: SVGSVGElement): HTMLImageElement[] => {
  const images = svgElement.querySelectorAll('image');
  return Array.from(images) as unknown as HTMLImageElement[];
};

// Compute a tight viewBox that covers the full drawn content
const ensureTightViewBox = (
  svgElement: SVGSVGElement
): { x: number; y: number; width: number; height: number } => {
  const previousOverflow = svgElement.getAttribute('overflow');
  svgElement.setAttribute('overflow', 'visible');

  let bbox: { x: number; y: number; width: number; height: number } | null = null;

  // Robust approach: clone offscreen, wrap children, and union all getBBox() values
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  while (clone.firstChild) wrapper.appendChild(clone.firstChild);
  clone.appendChild(wrapper);
  clone.style.position = 'absolute';
  clone.style.left = '-100000px';
  clone.style.top = '-100000px';
  clone.style.opacity = '0';
  clone.setAttribute('overflow', 'visible');
  clone.removeAttribute('width');
  clone.removeAttribute('height');
  document.body.appendChild(clone);

  try {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    const all: Element[] = [wrapper, ...Array.from(wrapper.querySelectorAll('*'))];
    for (const el of all) {
      const anyEl = el as unknown as { getBBox?: () => DOMRect };
      if (typeof anyEl.getBBox === 'function') {
        try {
          const b = anyEl.getBBox();
          if (!b || !isFinite(b.width) || !isFinite(b.height)) continue;
          minX = Math.min(minX, b.x);
          minY = Math.min(minY, b.y);
          maxX = Math.max(maxX, b.x + b.width);
          maxY = Math.max(maxY, b.y + b.height);
        } catch {
          // ignore elements that cannot provide a bbox
        }
      }
    }

    if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
      const w = Math.max(1, maxX - minX);
      const h = Math.max(1, maxY - minY);
      bbox = { x: minX, y: minY, width: w, height: h };
    }
  } finally {
    document.body.removeChild(clone);
  }

  // Fallbacks
  if (!bbox || bbox.width <= 0 || bbox.height <= 0) {
    let x = 0,
      y = 0,
      w = parseFloat(svgElement.getAttribute('width') || '1080') || 1080,
      h = parseFloat(svgElement.getAttribute('height') || '1350') || 1350;
    const vb = svgElement.getAttribute('viewBox');
    if (vb) {
      const parts = vb.split(/\s+|,/).map((v) => parseFloat(v));
      if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
        x = parts[0];
        y = parts[1];
        w = parts[2] || 1080;
        h = parts[3] || 1350;
      }
    }
    w = Math.max(1, w);
    h = Math.max(1, h);
    svgElement.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
    if (previousOverflow) svgElement.setAttribute('overflow', previousOverflow);
    return { x, y, width: w, height: h };
  }

  svgElement.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
  if (previousOverflow) svgElement.setAttribute('overflow', previousOverflow);
  return bbox;
};

// Compute export size while keeping aspect ratio when only one side is provided
const computeTargetSize = (
  bboxW: number,
  bboxH: number,
  targetW?: number,
  targetH?: number
): { width: number; height: number } => {
  if (targetW && targetH) return { width: targetW, height: targetH };
  const ratio = bboxW / bboxH || 1;
  if (targetW) return { width: targetW, height: Math.round(targetW / ratio) };
  if (targetH) return { width: Math.round(targetH * ratio), height: targetH };
  return { width: bboxW, height: bboxH };
};

/**
 * Waits for all images in the SVG to load and inlines them as data URLs
 */
export const inlineAllImages = async (
  svgElement: SVGSVGElement,
  onImageStatusUpdate?: (statuses: ImageLoadProgress[]) => void
): Promise<void> => {
  const images = extractImageElements(svgElement);

  // Initialize status tracking
  const imageStatuses: ImageLoadProgress[] = images.map((img) => {
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
      status: (href && !isDataUrl) ? 'pending' : 'loaded',
      size,
    };
  });

  // Report initial status
  if (onImageStatusUpdate) {
    onImageStatusUpdate([...imageStatuses]);
  }

  // Process each image
  const promises = images.map(async (img, index) => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href');

    // Skip if no href or already a data URL
    if (!href || href.startsWith('data:')) {
      return;
    }

    // Skip if not an HTTP/HTTPS URL
    if (!/^https?:\/\//i.test(href)) {
      imageStatuses[index].status = 'loaded';
      if (onImageStatusUpdate) {
        onImageStatusUpdate([...imageStatuses]);
      }
      return;
    }

    try {
      // Update status to loading
      imageStatuses[index].status = 'loading';
      if (onImageStatusUpdate) {
        onImageStatusUpdate([...imageStatuses]);
      }

      // Fetch and convert image
      const dataUrl = await fetchImageAsDataUrl(href);

      // Update the image element
      img.setAttribute('href', dataUrl);
      img.removeAttribute('xlink:href');

      // Update status to loaded
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

  await Promise.all(promises);
};

/**
 * Converts an SVG element to a PNG data URL using react-svg-to-image
 */
export const svgToPngDataUrl = async (
  svgElement: SVGSVGElement,
  options: ConversionOptions = {}
): Promise<string> => {
  const {
    width: targetWidth,
    height: targetHeight,
    scale = 2,
    format = 'png',
    backgroundColor = 'white',
    onProgress,
  } = options;

  // Make sure fonts are loaded before rendering to canvas
  try {
    await ensureTemplateFontsLoaded();
  } catch {
    // ignore font load errors, proceed
  }

  // Establish initial size from SVG
  let width = targetWidth || 1080;
  let height = targetHeight || 1350;
  if (!targetWidth || !targetHeight) {
    if (svgElement.viewBox && svgElement.viewBox.baseVal) {
      width = svgElement.viewBox.baseVal.width;
      height = svgElement.viewBox.baseVal.height;
    } else if (svgElement.getAttribute('width') && svgElement.getAttribute('height')) {
      width = parseFloat(svgElement.getAttribute('width') || '1080');
      height = parseFloat(svgElement.getAttribute('height') || '1350');
    }
  }

  if (onProgress) onProgress(70, 'SVG wird in Bild konvertiert...');

  // Ensure a tight viewBox and compute target export size
  svgElement.setAttribute('overflow', 'visible');
  const bbox = ensureTightViewBox(svgElement);
  const size = computeTargetSize(bbox.width, bbox.height, targetWidth, targetHeight);
  width = size.width;
  height = size.height;

  // Create an offscreen clone and translate the drawn content to start at (0,0)
  const exportClone = svgElement.cloneNode(true) as SVGSVGElement;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  while (exportClone.firstChild) {
    g.appendChild(exportClone.firstChild);
  }
  exportClone.appendChild(g);
  g.setAttribute('transform', `translate(${-bbox.x}, ${-bbox.y})`);

  exportClone.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`);
  exportClone.setAttribute('width', String(width));
  exportClone.setAttribute('height', String(height));
  exportClone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  exportClone.setAttribute('overflow', 'visible');
  exportClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  exportClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  exportClone.style.width = `${width}px`;
  exportClone.style.height = `${height}px`;

  // Mount offscreen so computed styles are available
  const tempId = `__export_svg_${Date.now()}`;
  exportClone.id = tempId;
  exportClone.style.position = 'absolute';
  exportClone.style.left = '-100000px';
  exportClone.style.top = '-100000px';
  exportClone.style.opacity = '0';
  document.body.appendChild(exportClone);

  // Convert using react-svg-to-image (keeps CSS styles & fonts as rendered)
  let dataUrl = '';
  try {
    dataUrl = await toImg(`#${tempId}`, 'export', {
      scale,
      format,
      quality: 1,
      download: false,
    }) as unknown as string;
  } finally {
    if (exportClone.parentNode) document.body.removeChild(exportClone);
  }

  if (onProgress) onProgress(90, 'Bild wird finalisiert...');

  return dataUrl;
};

/**
 * Downloads a data URL as a file
 * iOS-compatible: Uses multiple approaches to ensure download works
 */
export const downloadDataUrl = (dataUrl: string, fileName: string): boolean => {
  try {
    // Standard download approach
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.style.display = 'none';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

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
 * Detects if running on iOS
 */
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Detects if the browser is Firefox
 */
const isFirefox = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('firefox') || userAgent.includes('fxios');
};

/**
 * Opens a data URL in a new window
 */
export const openDataUrlInNewWindow = (dataUrl: string, fileName?: string): boolean => {
  // iOS-specific approach: use blob URL
  if (isIOS()) {
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);

      const newWindow = window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      return newWindow !== null;
    } catch (error) {
      console.error('iOS blob URL approach failed:', error);
    }
  }

  // Standard approach
  const newWindow = window.open(dataUrl, '_blank');
  return newWindow !== null;
};

/**
 * Creates a Blob URL from an image blob and opens it in a new browser tab
 */
export const createAndOpenBlobUrl = (
  blob: Blob,
  fileName?: string,
  cleanupDelay: number = 60000
): { blobUrl: string; cleanup: () => void; success: boolean } => {
  const blobUrl = URL.createObjectURL(blob);
  
  const isIOSDevice = isIOS();
  const isFirefoxBrowser = isFirefox();
  
  let newWindow: Window | null = null;
  let success = false;
  
  if (isIOSDevice && isFirefoxBrowser) {
    // Firefox on iOS: use link click approach
    try {
      const link = document.createElement('a');
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        link.href = dataUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
        }, 100);
      };
      reader.readAsDataURL(blob);
      success = true;
    } catch (error) {
      console.error('Firefox iOS link click approach failed:', error);
      newWindow = window.open(blobUrl, '_blank');
      success = newWindow !== null;
    }
  } else {
    // Standard approach
    newWindow = window.open(blobUrl, '_blank');
    success = newWindow !== null;
    
    if (!success) {
      console.warn('Popup blocker may have prevented opening the image');
    }
  }
  
  const cleanup = () => {
    URL.revokeObjectURL(blobUrl);
  };
  
  setTimeout(() => {
    if (newWindow) {
      try {
        if (!newWindow.closed) {
          return;
        }
      } catch (e) {
        // Cross-origin or closed window, safe to cleanup
      }
    }
    cleanup();
  }, cleanupDelay);
  
  return { blobUrl, cleanup, success };
};

/**
 * Share image using Web Share API or Capacitor Share
 */
export const shareImageNative = async (blob: Blob, fileName: string): Promise<boolean> => {
  // Try Web Share API first (works on modern mobile browsers)
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

  // Fallback to Capacitor Share
  try {
    const { Share } = await import('@capacitor/share');
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    
    // Convert blob to base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get pure base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Write to temporary file
    const writeResult = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    // Share the file
    await Share.share({
      title: fileName,
      text: 'Mein Kanva Bild',
      url: writeResult.uri,
      dialogTitle: 'Bild teilen',
    });

    // Clean up temporary file
    try {
      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Cache,
      });
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

    return true;
  } catch (error) {
    console.error('Capacitor share failed:', error);
    return false;
  }
};

/**
 * Complete SVG to image conversion with progress tracking
 */
export const convertSvgToImage = async (
  svgElement: SVGSVGElement,
  options: ConversionOptions = {}
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number; blobUrl?: string }> => {
  const { onProgress, onImageStatusUpdate } = options;

  // Step 1: Prepare SVG
  if (onProgress) {
    onProgress(10, 'SVG wird vorbereitet...');
  }

  // Step 2: Inline all images
  if (onProgress) {
    onProgress(30, 'Bilder werden geladen...');
  }

  await inlineAllImages(svgElement, onImageStatusUpdate);

  if (onProgress) {
    onProgress(60, 'Bilder wurden geladen...');
  }

  // Step 3: Convert to PNG using react-svg-to-image
  const dataUrl = await svgToPngDataUrl(svgElement, options);

  // Step 4: Convert to blob
  if (onProgress) {
    onProgress(95, 'Datei wird erstellt...');
  }

  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });

  // Get dimensions
  let width = 1080;
  let height = 1350;
  
  if (svgElement.viewBox && svgElement.viewBox.baseVal) {
    width = svgElement.viewBox.baseVal.width;
    height = svgElement.viewBox.baseVal.height;
  } else if (svgElement.getAttribute('width') && svgElement.getAttribute('height')) {
    width = parseFloat(svgElement.getAttribute('width') || '1080');
    height = parseFloat(svgElement.getAttribute('height') || '1350');
  }

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
 * Unified platform-specific download handler
 */
interface ToastMessage {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

interface PlatformDownloadOptions {
  svgElement: SVGSVGElement;
  fileName: string;
  isMobile: boolean;
  onProgressUpdate?: (progress: number, message: string) => void;
  onImageStatusUpdate?: (statuses: ImageLoadProgress[]) => void;
  onSuccess?: (message: ToastMessage) => void;
  onError?: (message: ToastMessage) => void;
}

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

    const result = await convertSvgToImage(svgElement, {
      scale: 2,
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
        // Fallback: Create blob URL and open in new tab
        const { success } = createAndOpenBlobUrl(result.blob, fileName);
        
        if (success) {
          onSuccess?.({
            title: 'Erfolgreich',
            description: 'Das Bild wurde in einem neuen Tab geöffnet. Halte das Bild gedrückt, um es zu speichern.'
          });
        } else {
          // Last resort: try direct download
          downloadDataUrl(result.dataUrl, fileName);
          onSuccess?.({
            title: 'Download gestartet',
            description: 'Das Bild wird heruntergeladen'
          });
        }
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
