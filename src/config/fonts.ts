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
        url: 'https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXoo9WdhyzbiDCsg.woff2'
      }
    ]
  },
  'roboto': {
    displayName: 'Roboto',
    cssFamily: 'Roboto',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=block',
    variants: [
      { weight: '100', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1MmgVxIIzIXKMny.woff2' },
      { weight: '100', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOiCnqEu92Fr1Mu51QrEzAdLwnYlgDj.woff2' },
      { weight: '300', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmSU5fBBc4AMP6lQ.woff2' },
      { weight: '300', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOjCnqEu92Fr1Mu51TjASc6CsTYl4BOQ3o.woff2' },
      { weight: '400', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2' },
      { weight: '400', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu51xIIzIXKMnyrYk.woff2' },
      { weight: '500', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2' },
      { weight: '500', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOjCnqEu92Fr1Mu51S7ACc6CsTYl4BOQ3o.woff2' },
      { weight: '700', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2' },
      { weight: '700', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOjCnqEu92Fr1Mu51TzBic6CsTYl4BOQ3o.woff2' },
      { weight: '900', style: 'normal', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmYUtfBBc4AMP6lQ.woff2' },
      { weight: '900', style: 'italic', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOjCnqEu92Fr1Mu51TLBCc6CsTYl4BOQ3o.woff2' }
    ]
  },
  'open-sans': {
    displayName: 'Open Sans',
    cssFamily: 'Open Sans',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=block',
    variants: [
      { weight: '300', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4taVQUwaEQbjB_mQ.woff2' },
      { weight: '300', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v40/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWtU6F15CJg8qoUw.woff2' },
      { weight: '400', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.woff2' },
      { weight: '400', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v40/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWuU6F15CJg8qoUw.woff2' },
      { weight: '500', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4iaVc.woff2' },
      { weight: '500', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v40/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWuU6F15CJg8qoUw.woff2' },
      { weight: '600', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B6taVQUwaEQbjB_mQ.woff2' },
      { weight: '600', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v40/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWtU6F15CJg8qoUw.woff2' },
      { weight: '700', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B6kaVQUwaEQbjB_mQ.woff2' },
      { weight: '700', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v40/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWtU6F15CJg8qoUw.woff2' },
      { weight: '800', style: 'normal', url: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B7jaVQUwaEQbjB_mQ.woff2' },
      { weight: '800', style: 'italic', url: 'https://fonts.gstatic.com/s/opensans/v40/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWtU6F15CJg8qoUw.woff2' }
    ]
  },
  'lato': {
    displayName: 'Lato',
    cssFamily: 'Lato',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=block',
    variants: [
      { weight: '100', style: 'normal', url: 'https://fonts.gstatic.com/s/lato/v24/S6u8w4BMUTPHh30AUC-q.woff2' },
      { weight: '100', style: 'italic', url: 'https://fonts.gstatic.com/s/lato/v24/S6u-w4BMUTPHjxsIPx-oNiXg7Q.woff2' },
      { weight: '300', style: 'normal', url: 'https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh7USSwaPGQ3q5d0N7w.woff2' },
      { weight: '300', style: 'italic', url: 'https://fonts.gstatic.com/s/lato/v24/S6u_w4BMUTPHjxsI9w2_Gwftx9897sxZ.woff2' },
      { weight: '400', style: 'normal', url: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.woff2' },
      { weight: '400', style: 'italic', url: 'https://fonts.gstatic.com/s/lato/v24/S6u8w4BMUTPHjxsAXC-qNiXg7Q.woff2' },
      { weight: '700', style: 'normal', url: 'https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwaPGQ3q5d0N7w.woff2' },
      { weight: '700', style: 'italic', url: 'https://fonts.gstatic.com/s/lato/v24/S6u_w4BMUTPHjxsI5wq_Gwftx9897sxZ.woff2' },
      { weight: '900', style: 'normal', url: 'https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh50XSwaPGQ3q5d0N7w.woff2' },
      { weight: '900', style: 'italic', url: 'https://fonts.gstatic.com/s/lato/v24/S6u_w4BMUTPHjxsI3wi_Gwftx9897sxZ.woff2' }
    ]
  },
  'montserrat': {
    displayName: 'Montserrat',
    cssFamily: 'Montserrat',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=block',
    variants: [
      { weight: '100', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-Y3tcoqK5.woff2' },
      { weight: '100', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R8aX9-p7K5ILg.woff2' },
      { weight: '200', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew9YXtcoqK5.woff2' },
      { weight: '200', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R9aH9-p7K5ILg.woff2' },
      { weight: '300', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew5YXtcoqK5.woff2' },
      { weight: '300', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R8aH9-p7K5ILg.woff2' },
      { weight: '400', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-YXtcoqK5.woff2' },
      { weight: '400', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R8aX9-p7K5ILg.woff2' },
      { weight: '500', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew2YXtcoqK5.woff2' },
      { weight: '500', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R8TX9-p7K5ILg.woff2' },
      { weight: '600', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6EkFYntcoqK5.woff2' },
      { weight: '600', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R8an5-p7K5ILg.woff2' },
      { weight: '700', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6EkOYntcoqK5.woff2' },
      { weight: '700', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R8Q35-p7K5ILg.woff2' },
      { weight: '800', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6EkBYntcoqK5.woff2' },
      { weight: '800', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R8aH5-p7K5ILg.woff2' },
      { weight: '900', style: 'normal', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6EkYYntcoqK5.woff2' },
      { weight: '900', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R8Rn5-p7K5ILg.woff2' }
    ]
  }
};

// REMOVED FONTS - Add back to AVAILABLE_FONTS if needed
const REMOVED_FONTS = {
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
 * Get Google Fonts URL for loading all fonts at once
 */
export const getGoogleFontsUrl = (): string => {
  const fontQueries = Object.values(AVAILABLE_FONTS)
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

  return `https://fonts.googleapis.com/css2?${fontQueries.join('&')}&display=block`;
};

/**
 * Get font config by CSS family name
 */
export const getFontConfig = (cssFamily: string): FontConfig | undefined => {
  return Object.values(AVAILABLE_FONTS).find(f => f.cssFamily === cssFamily);
};

/**
 * Get all available font families for dropdown
 */
export const getAvailableFontFamilies = (): Array<{ value: string; label: string }> => {
  return Object.values(AVAILABLE_FONTS).map(font => ({
    value: `${font.cssFamily}, sans-serif`,
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
