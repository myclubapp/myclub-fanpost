/**
 * Central font configuration for the entire application
 * This ensures consistency between UI, templates, and PNG export
 */

export interface FontVariant {
  weight: string;
  style: 'normal' | 'italic';
  url: string;
}

export interface FontConfig {
  displayName: string;
  cssFamily: string;
  googleFontsUrl: string;
  variants: FontVariant[];
}

/**
 * All available fonts with their Google Fonts URLs
 * Each font includes all available weight/style variants
 */
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
  'roboto': {
    displayName: 'Roboto',
    cssFamily: 'Roboto',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=block',
    variants: [
      { weight: '100', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBHMdazQ.woff2' },
      { weight: '100', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkBnkaSTbQWg.woff2' },
      { weight: '300', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBHMdazQ.woff2' },
      { weight: '300', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkBnkaSTbQWg.woff2' },
      { weight: '400', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBHMdazQ.woff2' },
      { weight: '400', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkBnkaSTbQWg.woff2' },
      { weight: '500', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBHMdazQ.woff2' },
      { weight: '500', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkBnkaSTbQWg.woff2' },
      { weight: '700', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBHMdazQ.woff2' },
      { weight: '700', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkBnkaSTbQWg.woff2' },
      { weight: '900', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBHMdazQ.woff2' },
      { weight: '900', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v49/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkBnkaSTbQWg.woff2' }
    ]
  },
  'open-sans': {
    displayName: 'Open Sans',
    cssFamily: 'Open Sans',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=block',
    variants: [
      { weight: '300', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v44/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2' },
      { weight: '300', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v44/memtYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWuU6FxZCJgg.woff2' },
      { weight: '400', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v44/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2' },
      { weight: '400', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v44/memtYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWuU6FxZCJgg.woff2' },
      { weight: '500', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v44/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2' },
      { weight: '500', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v44/memtYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWuU6FxZCJgg.woff2' },
      { weight: '600', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v44/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2' },
      { weight: '600', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v44/memtYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWuU6FxZCJgg.woff2' },
      { weight: '700', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v44/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2' },
      { weight: '700', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v44/memtYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWuU6FxZCJgg.woff2' },
      { weight: '800', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v44/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2' },
      { weight: '800', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v44/memtYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWuU6FxZCJgg.woff2' }
    ]
  },
  'lato': {
    displayName: 'Lato',
    cssFamily: 'Lato',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=block',
    variants: [
      { weight: '100', style: 'normal', url: 'https://fonts.gstatic.com/s/lato/v25/S6u8w4BMUTPHh30AXC-qNiXg7Q.woff2' },
      { weight: '100', style: 'italic', url: 'https://fonts.gstatic.com/s/lato/v25/S6u-w4BMUTPHjxsIPx-oPCLC79U1.woff2' },
      { weight: '300', style: 'normal', url: 'https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh7USSwiPGQ3q5d0.woff2' },
      { weight: '300', style: 'italic', url: 'https://fonts.gstatic.com/s/lato/v25/S6u_w4BMUTPHjxsI9w2_Gwftx9897g.woff2' },
      { weight: '400', style: 'normal', url: 'https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjx4wXiWtFCc.woff2' },
      { weight: '400', style: 'italic', url: 'https://fonts.gstatic.com/s/lato/v25/S6u8w4BMUTPHjxsAXC-qNiXg7Q.woff2' },
      { weight: '700', style: 'normal', url: 'https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2' },
      { weight: '700', style: 'italic', url: 'https://fonts.gstatic.com/s/lato/v25/S6u_w4BMUTPHjxsI5wq_Gwftx9897g.woff2' },
      { weight: '900', style: 'normal', url: 'https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh50XSwiPGQ3q5d0.woff2' },
      { weight: '900', style: 'italic', url: 'https://fonts.gstatic.com/s/lato/v25/S6u_w4BMUTPHjxsI3wi_Gwftx9897g.woff2' }
    ]
  },
  'montserrat': {
    displayName: 'Montserrat',
    cssFamily: 'Montserrat',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=block',
    variants: [
      { weight: '100', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2' },
      { weight: '100', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUQjIg1_i6t8kCHKm459WxRyS7m0dR9pA.woff2' },
      { weight: '200', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2' },
      { weight: '200', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUQjIg1_i6t8kCHKm459WxRyS7m0dR9pA.woff2' },
      { weight: '300', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2' },
      { weight: '300', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUQjIg1_i6t8kCHKm459WxRyS7m0dR9pA.woff2' },
      { weight: '400', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2' },
      { weight: '400', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUQjIg1_i6t8kCHKm459WxRyS7m0dR9pA.woff2' },
      { weight: '500', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2' },
      { weight: '500', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUQjIg1_i6t8kCHKm459WxRyS7m0dR9pA.woff2' },
      { weight: '600', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2' },
      { weight: '600', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUQjIg1_i6t8kCHKm459WxRyS7m0dR9pA.woff2' },
      { weight: '700', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2' },
      { weight: '700', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUQjIg1_i6t8kCHKm459WxRyS7m0dR9pA.woff2' },
      { weight: '800', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2' },
      { weight: '800', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUQjIg1_i6t8kCHKm459WxRyS7m0dR9pA.woff2' },
      { weight: '900', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2' },
      { weight: '900', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUQjIg1_i6t8kCHKm459WxRyS7m0dR9pA.woff2' }
    ]
  }
};

/**
 * Get Google Fonts URL for loading specific fonts
 * @param fontFamilies - Optional array of font family names to load. If not provided, loads all fonts.
 */
export const getGoogleFontsUrl = (fontFamilies?: string[]): string => {
  const fontsToLoad = fontFamilies 
    ? Object.values(AVAILABLE_FONTS).filter(font => fontFamilies.includes(font.cssFamily))
    : Object.values(AVAILABLE_FONTS);
    
  const fontQueries = fontsToLoad
    .filter(font => font.googleFontsUrl.includes('googleapis.com'))
    .map(font => {
      const fontName = font.cssFamily.replace(/ /g, '+');
      const weights = [...new Set(font.variants.map(v => v.weight))].sort();
      const hasItalic = font.variants.some(v => v.style === 'italic');

      if (hasItalic) {
        // Format: Family:ital,wght@0,400;0,700;1,400;1,700
        const combinations = weights.flatMap(w => [`0,${w}`, `1,${w}`]);
        return `family=${fontName}:ital,wght@${combinations.join(';')}`;
      } else {
        // Format: Family:wght@400;700
        return `family=${fontName}:wght@${weights.join(';')}`;
      }
    });

  if (fontQueries.length === 0) {
    return '';
  }

  return `https://fonts.googleapis.com/css2?${fontQueries.join('&')}&display=block`;
};

const GENERIC_FONT_FAMILIES = new Set(['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);

const normalizeCandidate = (value: string): string => value.toLowerCase().replace(/[-_\s]/g, '');

export const normalizeFontFamilyName = (fontFamily?: string | null): string | undefined => {
  if (!fontFamily) {
    return undefined;
  }

  const primary = fontFamily.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
  if (!primary) {
    return undefined;
  }

  if (GENERIC_FONT_FAMILIES.has(primary.toLowerCase())) {
    return undefined;
  }

  const normalizedPrimary = normalizeCandidate(primary);

  const match = Object.values(AVAILABLE_FONTS).find((font) => {
    const cssFamilyNormalized = normalizeCandidate(font.cssFamily);
    const displayNameNormalized = normalizeCandidate(font.displayName);
    return (
      font.cssFamily.toLowerCase() === primary.toLowerCase() ||
      cssFamilyNormalized === normalizedPrimary ||
      displayNameNormalized === normalizedPrimary
    );
  });

  return match?.cssFamily;
};

const loadedFontFamilies = new Set<string>();

export const ensureTemplateFontsLoaded = (fontFamilies?: string[]): Promise<void> => {
  if (typeof document === 'undefined') {
    return Promise.resolve();
  }

  // If specific fonts are requested, load only those
  // Otherwise, load all fonts (for backward compatibility)
  const fontsToLoad = fontFamilies || Object.values(AVAILABLE_FONTS).map(f => f.cssFamily);
  
  // Check if all requested fonts are already loaded
  const unloadedFonts = fontsToLoad.filter(f => !loadedFontFamilies.has(f));
  if (unloadedFonts.length === 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const fontUrl = getGoogleFontsUrl(fontsToLoad);
    if (!fontUrl) {
      // Mark fonts as loaded even if URL is empty
      fontsToLoad.forEach(f => loadedFontFamilies.add(f));
      resolve();
      return;
    }

    let linkEl = document.querySelector('link[data-template-fonts="true"]') as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.setAttribute('data-template-fonts', 'true');
      document.head.appendChild(linkEl);
    }

    // Only update href if it's different
    if (linkEl.href !== fontUrl) {
      linkEl.href = fontUrl;
    }

    if (document.fonts && document.fonts.load) {
      const loadPromises: Promise<unknown>[] = [];
      const fontsToLoadConfigs = fontsToLoad
        .map(family => Object.values(AVAILABLE_FONTS).find(f => f.cssFamily === family))
        .filter((f): f is FontConfig => f !== undefined);
        
      for (const fontConfig of fontsToLoadConfigs) {
        for (const variant of fontConfig.variants) {
          const fontSpec = `${variant.style} ${variant.weight} 16px "${fontConfig.cssFamily}"`;
          loadPromises.push(document.fonts.load(fontSpec));
        }
      }

      Promise.allSettled(loadPromises).then(() => {
        fontsToLoad.forEach(f => loadedFontFamilies.add(f));
        resolve();
      }).catch(() => {
        fontsToLoad.forEach(f => loadedFontFamilies.add(f));
        resolve();
      });
    } else {
      fontsToLoad.forEach(f => loadedFontFamilies.add(f));
      resolve();
    }
  });
};

/**
 * Get font config by CSS family name
 */
export const getFontConfig = (cssFamily: string): FontConfig | undefined => {
  return Object.values(AVAILABLE_FONTS).find(f => f.cssFamily === cssFamily);
};

const detectFontFormat = (url: string): 'woff2' | 'woff' | 'opentype' | 'truetype' => {
  if (url.includes('.woff2')) return 'woff2';
  if (url.includes('.woff')) return 'woff';
  if (url.includes('.otf') || url.toLowerCase().includes('opentype')) return 'opentype';
  if (url.includes('.ttf') || url.toLowerCase().includes('truetype')) return 'truetype';
  return 'woff2';
};

export const buildFontFaceCss = (families?: string[]): string => {
  const fonts = families
    ? Object.values(AVAILABLE_FONTS).filter(font => families.includes(font.cssFamily))
    : Object.values(AVAILABLE_FONTS);

  return fonts
    .map((font) =>
      font.variants
        .map((variant) => {
          const format = detectFontFormat(variant.url);
          return `@font-face { font-family: '${font.cssFamily}'; src: url('${variant.url}') format('${format}'); font-weight: ${variant.weight}; font-style: ${variant.style}; font-display: swap; }`;
        })
        .join('\n')
    )
    .join('\n');
};

/**
 * Get all available font families for dropdown
 */
export const getAvailableFontFamilies = (): Array<{ value: string; label: string }> => {
  return Object.values(AVAILABLE_FONTS).map(font => ({
    value: `${font.cssFamily}`,
    label: font.displayName
  }));
};

/**
 * Get available font weights for a specific font family
 */
export const getAvailableFontWeights = (cssFamily: string): string[] => {
  const fontConfig = getFontConfig(cssFamily);
  if (!fontConfig) return ['400'];

  const weights = [...new Set(fontConfig.variants.map(v => v.weight))];
  return weights.sort((a, b) => parseInt(a) - parseInt(b));
};

/**
 * Get available font styles for a specific font family and weight
 */
export const getAvailableFontStyles = (cssFamily: string, weight: string): Array<'normal' | 'italic'> => {
  const fontConfig = getFontConfig(cssFamily);
  if (!fontConfig) return ['normal'];

  const styles = fontConfig.variants
    .filter(v => v.weight === weight)
    .map(v => v.style);

  return [...new Set(styles)];
};

/**
 * Check if a font variant exists
 */
export const fontVariantExists = (cssFamily: string, weight: string, style: 'normal' | 'italic'): boolean => {
  const fontConfig = getFontConfig(cssFamily);
  if (!fontConfig) return false;

  return fontConfig.variants.some(v => v.weight === weight && v.style === style);
};
