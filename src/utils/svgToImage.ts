/**
 * Utility for converting SVG elements to downloadable images
 * Handles all image inlining and conversion in a unified way
 */

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
 * Converts a blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
 * Extracts all image elements from an SVG and tracks their loading status
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
 * Converts an SVG element to a PNG data URL
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

  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Convert SVG to string
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    // Load SVG as image
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG as image'));
      img.src = url;
    });

    // Draw image on canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (onProgress) {
      onProgress(90, 'Bild wird finalisiert...');
    }

    // Convert canvas to data URL
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Downloads a data URL as a file
 * iOS-compatible: Uses multiple approaches to ensure download works
 */
export const downloadDataUrl = (dataUrl: string, fileName: string): boolean => {
  try {
    // Approach 1: Standard download attribute (works on most platforms)
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.style.display = 'none';

    // iOS Safari/Firefox workaround: Set target to force download
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    document.body.appendChild(link);

    // Trigger click
    link.click();

    // Cleanup
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
 * Detects if the browser is Firefox (works on all platforms including iOS)
 */
const isFirefox = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('firefox') || userAgent.includes('fxios');
};

/**
 * Opens a data URL in a new window (useful for mobile devices)
 * iOS-specific: Creates a temporary download link with better compatibility
 */
export const openDataUrlInNewWindow = (dataUrl: string, fileName?: string): boolean => {
  // iOS-specific approach: use blob URL instead of data URL
  if (isIOS()) {
    try {
      // Convert data URL to blob
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

      // Try to open in new window
      const newWindow = window.open(blobUrl, '_blank');

      // Cleanup after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      return newWindow !== null;
    } catch (error) {
      console.error('iOS blob URL approach failed:', error);
      // Fallback to standard approach
    }
  }

  // Standard approach for other platforms
  const newWindow = window.open(dataUrl, '_blank');
  return newWindow !== null;
};

/**
 * Creates a Blob URL from an image blob and opens it in a new browser tab
 * This creates a "local file" in the browser's memory that can be opened as a URL
 * The blob URL can be used like a regular file URL and works on all browsers
 * 
 * @param blob - The image blob to create a URL for
 * @param fileName - Optional file name (for reference)
 * @param cleanupDelay - Delay in milliseconds before revoking the blob URL (default: 60000 = 1 minute)
 * @returns The blob URL string, cleanup function, and success status
 */
export const createAndOpenBlobUrl = (
  blob: Blob,
  fileName?: string,
  cleanupDelay: number = 60000
): { blobUrl: string; cleanup: () => void; success: boolean } => {
  // Create a blob URL - this acts like a "local file" in the browser
  const blobUrl = URL.createObjectURL(blob);
  
  // Special handling for Firefox on iOS - use link click instead of window.open
  const isIOSDevice = isIOS();
  const isFirefoxBrowser = isFirefox();
  
  let newWindow: Window | null = null;
  let success = false;
  
  if (isIOSDevice && isFirefoxBrowser) {
    // Firefox on iOS: window.open() often doesn't work, use link click approach
    try {
      const link = document.createElement('a');
      // Convert blob to data URL (PNG) for better compatibility on iOS Firefox
      // Some versions of iOS Firefox do not handle blob: URLs opened in a new tab reliably
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
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      success = true;
      console.log('Firefox iOS: Using link click approach for blob URL');
    } catch (error) {
      console.error('Firefox iOS link click approach failed:', error);
      // Fallback to window.open
      newWindow = window.open(blobUrl, '_blank');
      success = newWindow !== null;
    }
  } else {
    // Standard approach: Open the blob URL in a new tab
    newWindow = window.open(blobUrl, '_blank');
    success = newWindow !== null;
    
    if (!success) {
      console.warn('Popup blocker may have prevented opening the image in a new window');
    }
  }
  
  // Cleanup function to revoke the blob URL and free memory
  const cleanup = () => {
    URL.revokeObjectURL(blobUrl);
  };
  
  // Auto-cleanup after delay (to prevent memory leaks if user doesn't close the tab)
  // Note: We use a longer delay because the user might want to save the image from the tab
  setTimeout(() => {
    // Only cleanup if the window was closed or is not accessible
    if (newWindow) {
      try {
        if (!newWindow.closed) {
          // Window still open, don't cleanup yet
          // The browser will handle cleanup when the window is closed
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
 * iOS-specific: Show image in a modal-like experience
 * Creates a full-screen image viewer that allows long-press to save
 * NOTE: The image passed here is already a converted PNG (data URL), not SVG!
 */
export const showImageFullscreen = (dataUrl: string, fileName: string, onClose: () => void): void => {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow: auto;
  `;

  // Create instructions
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    color: white;
    text-align: center;
    margin-bottom: 20px;
    font-size: 14px;
    padding: 0 20px;
    flex-shrink: 0;
  `;
  instructions.innerHTML = `
    <p style="margin-bottom: 10px; font-weight: bold;">📱 So speicherst du das Bild:</p>
    <p style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">1. Drücke <strong>lang</strong> auf das Bild unten</p>
    <p style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">2. Wähle "<strong>Bild sichern</strong>" oder "<strong>Zu Fotos hinzufügen</strong>"</p>
    <p style="font-size: 11px; opacity: 0.7; margin-top: 12px;">Das Bild ist bereits als PNG konvertiert und bereit zum Speichern</p>
  `;

  // Create image container for better control
  const imgContainer = document.createElement('div');
  imgContainer.style.cssText = `
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    overflow: auto;
  `;

  // Create image (this is the converted PNG!)
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = fileName;
  img.style.cssText = `
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    cursor: pointer;
  `;

  // Add visual feedback on touch
  img.addEventListener('touchstart', () => {
    img.style.opacity = '0.8';
  });
  img.addEventListener('touchend', () => {
    img.style.opacity = '1';
  });

  imgContainer.appendChild(img);

  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ Schließen';
  closeBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    backdrop-filter: blur(10px);
    z-index: 10000;
  `;

  closeBtn.onclick = () => {
    if (overlay.parentNode) {
      document.body.removeChild(overlay);
    }
    onClose();
  };

  // Assemble overlay
  overlay.appendChild(closeBtn);
  overlay.appendChild(instructions);
  overlay.appendChild(imgContainer);

  // Add to document
  document.body.appendChild(overlay);

  // Close on background click (but not on image or instructions)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === imgContainer) {
      if (overlay.parentNode) {
        document.body.removeChild(overlay);
      }
      onClose();
    }
  });

  // Prevent body scroll when overlay is open
  document.body.style.overflow = 'hidden';

  // Cleanup function
  const cleanup = () => {
    document.body.style.overflow = '';
  };

  // Store cleanup for later
  (overlay as any)._cleanup = cleanup;
};

/**
 * Complete SVG to image conversion with progress tracking
 */
export const convertSvgToImage = async (
  svgElement: SVGSVGElement,
  options: ConversionOptions = {}
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number; blobUrl?: string }> => {
  const { onProgress, onImageStatusUpdate } = options;

  // Step 1: Clone SVG to avoid modifying the original
  if (onProgress) {
    onProgress(10, 'SVG wird vorbereitet...');
  }

  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

  // Step 2: Wait for all external images to load
  if (onProgress) {
    onProgress(20, 'Bilder werden geladen...');
  }

  await inlineAllImages(clonedSvg, onImageStatusUpdate);

  if (onProgress) {
    onProgress(60, 'Alle Bilder geladen...');
  }

  // Step 3: Convert to PNG
  const dataUrl = await svgToPngDataUrl(clonedSvg, options);

  if (onProgress) {
    onProgress(95, 'Bild erstellt...');
  }

  // Step 4: Convert to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Get dimensions
  let width = options.width || 1080;
  let height = options.height || 1350;

  if (!options.width || !options.height) {
    if (clonedSvg.viewBox && clonedSvg.viewBox.baseVal) {
      width = clonedSvg.viewBox.baseVal.width;
      height = clonedSvg.viewBox.baseVal.height;
    } else if (clonedSvg.getAttribute('width') && clonedSvg.getAttribute('height')) {
      width = parseFloat(clonedSvg.getAttribute('width') || '1080');
      height = parseFloat(clonedSvg.getAttribute('height') || '1350');
    }
  }

  if (onProgress) {
    onProgress(100, 'Fertig!');
  }

  // Optionally create blob URL for direct browser access
  const blobUrl = URL.createObjectURL(blob);

  return { dataUrl, blob, width, height, blobUrl };
};
