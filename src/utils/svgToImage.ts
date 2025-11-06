/**
 * Utility for converting SVG elements to downloadable images
 * Uses react-svg-to-image to preserve CSS styling and fonts
 */

import toImg from 'react-svg-to-image';
import { normalizeFontFamilyName, AVAILABLE_FONTS } from '@/config/fonts';

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
    backgroundColor = 'white',
    onProgress,
  } = options;

  // Get SVG dimensions
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

  if (onProgress) {
    onProgress(70, 'SVG wird in Bild konvertiert...');
  }

  // Ensure SVG has a unique ID for selection
  const svgId = svgElement.id || `svg-export-${Date.now()}`;
  svgElement.id = svgId;

  // Set explicit width and height for proper scaling
  svgElement.setAttribute('width', String(width));
  svgElement.setAttribute('height', String(height));

  // Use react-svg-to-image to convert with proper CSS styling support
  const fileData = await toImg(`#${svgId}`, `export-${Date.now()}`, {
    scale,
    format: 'png',
    quality: 1,
    download: false,
  });

  const dataUrl = fileData as string;

  if (onProgress) {
    onProgress(90, 'Bild wird finalisiert...');
  }

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
 * Share image using native share sheet (Capacitor Share API)
 */
export const shareImageNative = async (blob: Blob, fileName: string): Promise<boolean> => {
  try {
    // Check if Capacitor Share is available
    const { Share } = await import('@capacitor/share');
    
    // Convert blob to base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Share using native share sheet
    await Share.share({
      title: fileName,
      text: 'Mein Kanva Bild',
      url: base64Data,
      dialogTitle: 'Bild teilen',
    });

    return true;
  } catch (error) {
    console.error('Native share failed:', error);
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
    const result = await convertSvgToImage(svgElement, {
      scale: 2,
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
        // Fallback to opening in new window
        const success = openDataUrlInNewWindow(result.dataUrl, fileName);
        if (!success) {
          downloadDataUrl(result.dataUrl, fileName);
        }
        onSuccess?.({
          title: 'Erfolgreich',
          description: 'Das Bild wurde in einem neuen Tab geöffnet'
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
