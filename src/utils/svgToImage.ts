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

  // Step 1b: Embed required web fonts into the cloned SVG
  // This ensures text renders with the correct font when drawn onto a canvas
  try {
    // Extract all unique font families used in the SVG
    const fontFamilies = new Set<string>();
    const textElements = clonedSvg.querySelectorAll('text, tspan');
    
    textElements.forEach((element) => {
      const fontFamily = element.getAttribute('font-family') || 
                        window.getComputedStyle(element).fontFamily;
      if (fontFamily) {
        // Clean up font family string (remove quotes, fallbacks)
        const cleanFamily = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        if (cleanFamily && cleanFamily !== 'sans-serif' && cleanFamily !== 'serif') {
          fontFamilies.add(cleanFamily);
        }
      }
    });

    console.log('Detected font families in SVG:', Array.from(fontFamilies));

    // Map of common Google Fonts to their woff2 URLs
    const googleFontUrls: Record<string, string> = {
      'Bebas Neue': 'https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXoo9Wdhyzbi.woff2',
      'Roboto': 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
      'Open Sans': 'https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVI.woff2',
      'Lato': 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXiWtFCc.woff2',
      'Montserrat': 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2',
      'Oswald': 'https://fonts.gstatic.com/s/oswald/v53/TK3_WkUHHAIjg75cFRf3bXL8LICs1_FvsUtiZTaR.woff2',
      'Raleway': 'https://fonts.gstatic.com/s/raleway/v29/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrCFRjldz1SsbqN7PtM.woff2',
      'Poppins': 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2',
      'PT Sans': 'https://fonts.gstatic.com/s/ptsans/v17/jizaRExUiTo99u79D0KExcOPIDU.woff2',
      'Merriweather': 'https://fonts.gstatic.com/s/merriweather/v30/u-440qyriQwlOrhSvowK_l5OeyxNV-bnrw.woff2',
      'Vollkorn': 'https://fonts.gstatic.com/s/vollkorn/v22/0ybgGDoxxrvAnPhYGzMlQLzuMasz6Df2MHGeHmmS.woff2',
    };

    const embedFont = async (
      familyName: string,
      fontUrl: string,
      fontFormat: 'truetype' | 'woff' | 'woff2' = 'woff2',
      fontWeight: string = 'normal',
      fontStyle: string = 'normal'
    ) => {
      try {
        const resolvedUrl = new URL(fontUrl, document.baseURI).toString();
        const resp = await fetch(resolvedUrl);
        if (!resp.ok) throw new Error(`Font HTTP ${resp.status}`);
        const blob = await resp.blob();
        const base64 = await blobToBase64(blob);
        const dataUrl = `data:font/${fontFormat};base64,${base64}`;

        const styleEl = document.createElementNS(clonedSvg.namespaceURI, 'style');
        styleEl.setAttribute('type', 'text/css');
        styleEl.textContent = `@font-face { font-family: '${familyName}'; src: url('${dataUrl}') format('${fontFormat}'); font-weight: ${fontWeight}; font-style: ${fontStyle}; font-display: swap; }`;
        clonedSvg.insertBefore(styleEl, clonedSvg.firstChild);
        console.log(`Successfully embedded font: ${familyName}`);
      } catch (e) {
        console.warn(`Failed to embed font ${familyName}:`, e);
      }
    };

    // Embed all detected Google Fonts
    const embedPromises = Array.from(fontFamilies).map(async (fontFamily) => {
      const fontUrl = googleFontUrls[fontFamily];
      if (fontUrl) {
        await embedFont(fontFamily, fontUrl, 'woff2');
      } else {
        console.warn(`No Google Fonts URL found for: ${fontFamily}`);
      }
    });

    await Promise.all(embedPromises);
    
    // Wait for fonts to be loaded in the document
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch (e) {
    // Non-fatal: if fonts cannot be embedded, proceed with conversion
    console.warn('Font embedding skipped due to error:', e);
  }

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

/**
 * Platform detection utilities
 */

/**
 * Detects if running on iOS using Capacitor's reliable platform detection
 * This works for both native apps AND web browsers on iOS
 */
export const isIOSPlatform = (): boolean => {
  // Check if Capacitor is available
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const Capacitor = (window as any).Capacitor;
    const platform = Capacitor.getPlatform();

    // For native iOS app
    if (platform === 'ios') {
      console.log('iOS detected: Native iOS app');
      return true;
    }

    // For web (including iOS browsers like Firefox, Safari, Chrome on iOS)
    if (platform === 'web') {
      // Use multiple detection methods for iOS browsers
      const isIOSUserAgent = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIPadPro = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      const isIPad13Plus = navigator.userAgent.includes('Mac') && 'ontouchend' in document;

      const result = isIOSUserAgent || isIPadPro || isIPad13Plus;

      console.log('Platform Detection (Web):', {
        capacitorPlatform: platform,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
        isIOSUserAgent,
        isIPadPro,
        isIPad13Plus,
        finalResult: result
      });

      return result;
    }

    console.log('Platform detected:', platform);
    return false;
  }

  // Fallback if Capacitor is not available
  return isIOS();
};

/**
 * Shared download handler options
 */
export interface DownloadHandlerOptions {
  svgElement: SVGSVGElement;
  fileName: string;
  isMobile: boolean;
  onProgressUpdate: (progress: number, message: string) => void;
  onImageStatusUpdate: (statuses: ImageLoadProgress[]) => void;
  onSuccess: (message: { title: string; description: string; duration?: number }) => void;
  onError: (message: { title: string; description: string }) => void;
}

/**
 * Shared download handler with platform-specific behavior
 * Handles native platforms, mobile web, and desktop web downloads
 */
export const handlePlatformDownload = async (options: DownloadHandlerOptions): Promise<void> => {
  const {
    svgElement,
    fileName,
    isMobile,
    onProgressUpdate,
    onImageStatusUpdate,
    onSuccess,
    onError,
  } = options;

  try {
    // Convert SVG to image with progress tracking
    const { dataUrl, blob } = await convertSvgToImage(svgElement, {
      scale: 2,
      backgroundColor: 'white',
      onProgress: onProgressUpdate,
      onImageStatusUpdate,
    });

    // Check if running on native platform (iOS/Android)
    const isNative = typeof window !== 'undefined' &&
                     (window as any).Capacitor?.isNativePlatform?.() === true;

    if (isNative) {
      // Native platforms: Use Capacitor Share API
      onProgressUpdate(100, "Wird geteilt...");

      try {
        const Capacitor = (window as any).Capacitor;
        const { Share } = await import('@capacitor/share');
        const { Filesystem, Directory } = await import('@capacitor/filesystem');

        const base64Data = await blobToBase64(blob);

        // Save to filesystem
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        // Get file URI
        const fileUri = await Filesystem.getUri({
          directory: Directory.Cache,
          path: fileName,
        });

        // Share using Capacitor
        await Share.share({
          title: "Spielvorschau",
          text: "Schau dir diese Spielvorschau an!",
          url: fileUri.uri,
          dialogTitle: "Bild teilen",
        });

        onSuccess({
          title: "Erfolgreich!",
          description: "Das Bild wurde geteilt.",
        });
      } catch (error) {
        // User might have cancelled the share dialog
        if ((error as Error).name === 'AbortError') {
          onError({
            title: "Abgebrochen",
            description: "Der Share-Dialog wurde abgebrochen.",
          });
        } else {
          throw error;
        }
      }
    } else {
      // Web platforms: Platform-specific behavior
      onProgressUpdate(100, "Download wird vorbereitet...");

      const iosDevice = isIOSPlatform();
      const Capacitor = typeof window !== 'undefined' ? (window as any).Capacitor : null;
      const isAndroid = (Capacitor?.getPlatform?.() === 'android') || /Android/i.test(navigator.userAgent);
      const isMobileDevice = isMobile || iosDevice || isAndroid;

      console.log('Download Platform Detection:', {
        isMobile,
        isMobileDevice,
        isIOS: iosDevice,
        isAndroid,
        userAgent: navigator.userAgent,
        capacitorPlatform: Capacitor?.getPlatform?.()
      });

      // Mobile devices: Prefer Web Share API to share the PNG file; fallback to blob URL or fullscreen
      if (isMobileDevice) {
        const supportsShare = typeof (navigator as any).share === 'function';
        const supportsCanShare = typeof (navigator as any).canShare === 'function';
        const file = new File([blob], fileName, { type: 'image/png' });

        if (supportsShare && (!supportsCanShare || (navigator as any).canShare({ files: [file] }))) {
          try {
            onProgressUpdate(100, "Teilen wird geöffnet...");
            await (navigator as any).share({
              title: "Spielvorschau",
              text: "Schau dir diese Spielvorschau an!",
              files: [file],
            });

            onSuccess({
              title: "Erfolgreich",
              description: "Das Bild wurde geteilt.",
            });
            return;
          } catch (shareError: any) {
            if (shareError && shareError.name === 'AbortError') {
              onError({
                title: "Abgebrochen",
                description: "Der Teilen-Dialog wurde abgebrochen.",
              });
              return;
            }
            console.warn('Web Share API failed, falling back to blob URL:', shareError);
          }
        }

        console.log('Using mobile blob URL approach - opening image in new tab');
        onProgressUpdate(100, "Bild wird in neuem Tab geöffnet...");

        // Create blob URL and open in new tab
        const { blobUrl, cleanup, success } = createAndOpenBlobUrl(blob, fileName, 120000); // 2 minutes cleanup delay

        if (!success) {
          // Fallback: Use fullscreen viewer if blob URL opening failed
          console.log('Blob URL opening failed, falling back to fullscreen viewer');
          onProgressUpdate(100, "Bild bereit!");

          showImageFullscreen(dataUrl, fileName, () => {
            cleanup();
            onSuccess({
              title: "Bild geschlossen",
              description: "Du kannst das Bild jederzeit erneut herunterladen.",
            });
          });

          onSuccess({
            title: "Bild bereit zum Speichern",
            description: "Drücke lang auf das Bild, um es zu speichern.",
            duration: 5000,
          });
          return;
        }

        // Store cleanup function for later (in case tab is closed manually)
        (window as any).__kanvaBlobCleanup = cleanup;

        onSuccess({
          title: "Bild geöffnet",
          description: "Das Bild wurde in einem neuen Tab geöffnet. Du kannst es dort speichern.",
          duration: 5000,
        });
      }
      // Desktop web: Use blob URL approach (opens image in new tab as local file)
      else {
        console.log('Using desktop blob URL approach - opening image in new tab');
        onProgressUpdate(100, "Bild wird in neuem Tab geöffnet...");

        // Create blob URL and open in new tab
        const { blobUrl, cleanup, success } = createAndOpenBlobUrl(blob, fileName, 120000); // 2 minutes cleanup delay

        if (!success) {
          // Fallback: Try direct download if blob URL opening failed
          console.log('Blob URL opening failed, falling back to direct download');
          const downloadSuccess = downloadDataUrl(dataUrl, fileName);

          onSuccess({
            title: downloadSuccess ? "Download erfolgreich" : "Download vorbereitet",
            description: downloadSuccess
              ? "Das Bild wurde erfolgreich heruntergeladen."
              : "Versuche, das Bild herunterzuladen.",
            duration: 5000,
          });
          return;
        }

        // Store cleanup function for later (in case tab is closed manually)
        (window as any).__kanvaBlobCleanup = cleanup;

        onSuccess({
          title: "Bild geöffnet",
          description: "Das Bild wurde in einem neuen Tab geöffnet. Du kannst es dort speichern (Rechtsklick > 'Bild speichern unter...').",
          duration: 5000,
        });
      }
    }
  } catch (error) {
    console.error("Export failed:", error);
    // Don't show error if user cancelled
    if ((error as Error).name !== 'AbortError') {
      onError({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Bild konnte nicht erstellt werden.",
      });
    }
  }
};
