export type Language = 'de' | 'en';

export const translations = {
  de: {
    // Header Navigation
    nav: {
      studio: 'Studio',
      pricing: 'Preise',
      howItWorks: 'So funktioniert\'s',
      about: 'Über uns',
      login: 'Login',
      logout: 'Abmelden',
      myProfile: 'Mein Profil',
      templates: 'Vorlagen',
      navigation: 'Navigation',
      light: 'Hell',
      dark: 'Dunkel',
    },

    // Hero Section
    hero: {
      headline1: 'Wo Emotionen',
      headline2: '',
      headline3: 'zu Stories werden.',
      subtitle: 'Teile, was deinen Verein einzigartig macht – auf und neben dem Spielfeld.',
      description: 'Erstelle automatisch Social Media Posts aus deinen Spielen – schnell, authentisch und im Look deines Teams.',
      ctaPrimary: 'Jetzt kostenlos starten',
      ctaSecondary: 'Demo ansehen',
    },

    // Pricing Section
    pricing: {
      title: 'Preise',
      subtitle: 'Wähle den richtigen Plan für dein Team',
      billingToggle: {
        monthly: 'Monatliche Abrechnung',
        yearly: 'Jährliche Abrechnung',
      },
      vatNote: 'inkl. MwSt.',
      billedYearly: 'jährlich CHF',
      free: {
        name: 'Free',
        emoji: '🟢',
        subtitle: 'Für Einsteiger',
        price: '0',
        priceYearly: '0',
        period: '/Monat',
        periodYearly: '/Jahr',
        teams: '1 Team',
        templates: 'Vordefinierte Standard-Vorlagen',
        templateNote: '(mit KANVA-Branding)',
        games: '1 Spiel',
        features: [
          'Standard-Vorlagen',
          'Kein eigenes Branding',
          'Teamwechsel nur alle 7 Tage',
          'Manuelles Teilen auf Social Media',
        ],
        cta: 'Jetzt starten',
        popular: false,
      },
      amateur: {
        name: 'Amateur',
        emoji: '🟡',
        subtitle: 'Für einzelne Teams und kleine Vereine',
        price: '6.90',
        priceYearly: '66',
        period: '/Monat',
        periodYearly: '/Jahr',
        teams: 'bis 3 Teams',
        templates: 'bis 2 eigene Vorlagen',
        games: '2 Spiele (via API)',
        features: [
          'Alle Free-Features',
          'Eigene Vorlagen mit dem Designer von KANVA erstellen und verwalten',
        ],
        cta: 'Jetzt starten',
        popular: false,
      },
      pro: {
        name: 'Pro',
        emoji: '🟠',
        subtitle: 'Am beliebtesten',
        price: '15.00',
        priceYearly: '144',
        period: '/Monat',
        periodYearly: '/Jahr',
        teams: 'bis 6 Teams',
        templates: 'bis 5 eigene Vorlagen',
        games: 'bis zu 3 Spiele (via API)',
        features: [
          'Alle Amateur-Features',
          'Eigene Logoverwaltung für Sponsoren, Teams und Vereine',     
        ],
        cta: 'Jetzt starten',
        popular: true,
      },
      premium: {
        name: 'Premium',
        emoji: '🔵',
        subtitle: 'Für grosse Vereine, Verbände und Medienhäuser',
        price: '30.00',
        priceYearly: '288',
        period: '/Monat',
        periodYearly: '/Jahr',
        priceNote: '(oder individuell bei Ligen/Verbänden)',
        teams: 'Unbegrenzt Teams',
        templates: 'Unbegrenzt eigene Vorlagen',
        games: 'Unbegrenzt Spiele (via API)',
        features: [
          'Alle Pro-Features',
          'Priority Support',
        ],
        cta: 'Jetzt starten',
        popular: false,
      },
    },

    // How It Works Section
    howItWorks: {
      title: 'So funktioniert\'s',
      subtitle: 'In drei einfachen Schritten zum perfekten Post',
      step1: {
        title: 'Spiel auswählen',
        description: 'Wähle dein Spiel aus oder erstelle ein neues mit allen Details.',
      },
      step2: {
        title: 'Vorlage wählen',
        description: 'Wähle aus professionellen Vorlagen oder erstelle deine eigenen.',
      },
      step3: {
        title: 'Emotionen Teilen',
        description: 'Teile deinen Post direkt auf Instagram, WhatsApp und mehr.',
      },
    },

    // About Section
    about: {
      title: 'Über uns',
      description: 'KANVA macht aus Emotionen digitale Erlebnisse. Wir helfen Sportvereinen, ihre Begeisterung zu teilen – von der Halle bis in den Feed. Mit KANVA erstellst du automatisch Social Media Posts aus deinen Spielen. Professionell. Einfach. Emotional. Damit jeder Moment, jedes Tor, jede Emotion sichtbar bleibt.',
    },

    // Auth Page
    auth: {
      title: 'Willkommen bei KANVA',
      subtitle: 'Melde dich mit deiner E-Mail-Adresse an',
      emailPlaceholder: 'deine.email@beispiel.ch',
      sendButton: 'Login-Link senden',
      sendingButton: 'Wird gesendet...',
      description: 'Du erhältst eine E-Mail mit einem Login-Link',
      successTitle: 'Login-Link gesendet!',
      successDescription: 'Überprüfe dein E-Mail-Postfach für den Login-Link.',
      errorTitle: 'Fehler beim Senden',
      invalidEmail: 'Ungültige E-Mail-Adresse',
    },

    // Common Messages
    messages: {
      saved: 'Gespeichert',
      error: 'Fehler',
      loadingError: 'Fehler beim Laden',
      previewLoaded: 'Vorschau geladen',
      previewError: 'Vorschaudaten konnten nicht geladen werden',
      instagramUpdated: 'Instagram-Benutzername wurde aktualisiert.',
    },

    // Studio Page
    studio: {
      title: 'Social Media Posts für dein Team',
      subtitle: 'Erstelle professionelle Social Media Posts für deine Spiele in Sekunden',
      selectClub: 'Club auswählen',
      selectTeam: 'Team auswählen',
      selectGame: 'Spiel auswählen',
      selectSport: 'Sportart wählen',
      selectSportDescription: 'Wähle deine Sportart aus',
      selectSportPlaceholder: 'Wähle eine Sportart...',
      selectClubDescription: 'Wähle deinen Club aus',
      selectTeamDescription: 'Wähle dein Team aus',
      selectGameDescription: 'Wähle das Spiel aus und erstelle deinen Post',
      back: 'Zurück',
      backToGameSelection: 'Zurück zur Spielauswahl',
      export: 'Exportieren',
      exportAsImage: 'Als Bild exportieren',
      instagramStory: 'Instagram Story',
    },

    // Wording from Design Concept
    wording: {
      claim: 'Design your win.',
      youPlayWePost: 'Du spielst. Wir posten.',
      turnEveryMatch: 'Mach aus jedem Spiel einen Moment.',
      fansWillLove: 'Deine Fans werden deinen Feed lieben.',
      smartDesign: 'Intelligentes Design für echte Emotionen.',
    },

    // Footer Section
    footer: {
      tagline: 'Wo Emotionen zu Stories werden.',
      subtitle: 'Teilen, was euch bewegt.',
      product: 'Produkt',
      features: 'Funktionen',
      pricing: 'Preise',
      about: 'Über uns',
      socialMedia: 'Soziale Medien',
      privacy: 'Privatsphäre',
      imprint: 'Impressum',
      dataProtection: 'Datenschutz',
      terms: 'AGB',
      allRightsReserved: 'Lizenziert unter CC BY-SA 4.0.',
    },
  },

  en: {
    // Header Navigation
    nav: {
      studio: 'Studio',
      pricing: 'Pricing',
      howItWorks: 'How It Works',
      about: 'About',
      login: 'Login',
      logout: 'Sign Out',
      myProfile: 'My Profile',
      templates: 'Templates',
      navigation: 'Navigation',
      light: 'Light',
      dark: 'Dark',
    },

    // Hero Section
    hero: {
      headline1: 'Where emotions',
      headline2: '',
      headline3: 'become stories.',
      subtitle: 'Share what makes your club unique – on and off the field.',
      description: 'Automatically create social media posts from your games – fast, authentic and in your team\'s look.',
      ctaPrimary: 'Get Started Free',
      ctaSecondary: 'Watch the Demo',
    },

    // Pricing Section
    pricing: {
      title: 'Pricing',
      subtitle: 'Choose the Right Plan for Your Team',
      billingToggle: {
        monthly: 'Monthly Billing',
        yearly: 'Yearly Billing',
      },
      vatNote: 'incl. VAT',
      billedYearly: 'billed yearly CHF',
      free: {
        name: 'Free',
        emoji: '🟢',
        subtitle: 'For Beginners',
        price: '0',
        priceYearly: '0',
        period: '/month',
        periodYearly: '/year',
        teams: '1 Team',
        templates: 'Predefined Standard Templates',
        templateNote: '(with KANVA branding)',
        games: '1 Game',
        features: [
          'Standard templates',
          'No custom branding',
          'Team change only every 7 days',
          'Manual sharing on social media',
        ],
        cta: 'Get Started',
        popular: false,
      },
      amateur: {
        name: 'Amateur',
        emoji: '🟡',
        subtitle: 'For individual teams and small clubs',
        price: '6.90',
        priceYearly: '66',
        period: '/month',
        periodYearly: '/year',
        teams: 'up to 3 Teams',
        templates: 'up to 2 custom templates',
        games: '2 Games (via API)',
        features: [
          'All Free features',
          'Create and manage your own templates with the KANVA designer',
        ],
        cta: 'Get Started',
        popular: false,
      },
      pro: {
        name: 'Pro',
        emoji: '🟠',
        subtitle: 'Most Popular',
        price: '15.00',
        priceYearly: '144',
        period: '/month',
        periodYearly: '/year',
        teams: 'up to 6 Teams',
        templates: 'up to 5 custom templates',
        games: 'up to 3 Games (via API)',
        features: [
          'All Amateur features',
          'Custom logo management for sponsors, teams and clubs',
        ],
        cta: 'Get Started',
        popular: true,
      },
      premium: {
        name: 'Premium',
        emoji: '🔵',
        subtitle: 'For large clubs, associations and media houses',
        price: '30.00',
        priceYearly: '288',
        period: '/month',
        periodYearly: '/year',
        priceNote: '(or custom for leagues/associations)',
        teams: 'Unlimited Teams',
        templates: 'Unlimited custom templates',
        games: 'Unlimited Games (via API)',
        features: [
          'All Pro features',
          'Priority support',
        ],
        cta: 'Get Started',
        popular: false,
      },
    },

    // How It Works Section
    howItWorks: {
      title: 'How It Works',
      subtitle: 'Three Simple Steps to the Perfect Post',
      step1: {
        title: 'Choose Game',
        description: 'Choose your game or create a new one with all details.',
      },
      step2: {
        title: 'Choose Template',
        description: 'Choose from professional templates or create your own.',
      },
      step3: {
        title: 'Share Emotions',
        description: 'Share your post directly on Instagram, WhatsApp and more.',
      },
    },

    // About Section
    about: {
      title: 'About',
      description: 'KANVA turns every match into a story – and every team into a brand. Empower sports clubs to turn their emotions, victories, and moments into professional social media posts.',
    },

    // Auth Page
    auth: {
      title: 'Welcome to KANVA',
      subtitle: 'Sign in with your email address',
      emailPlaceholder: 'your.email@example.com',
      sendButton: 'Send Login Link',
      sendingButton: 'Sending...',
      description: 'You will receive an email with a login link',
      successTitle: 'Login Link Sent!',
      successDescription: 'Check your email inbox for the login link.',
      errorTitle: 'Error Sending',
      invalidEmail: 'Invalid email address',
    },

    // Common Messages
    messages: {
      saved: 'Saved',
      error: 'Error',
      loadingError: 'Loading Error',
      previewLoaded: 'Preview Loaded',
      previewError: 'Preview data could not be loaded',
      instagramUpdated: 'Instagram username has been updated.',
    },

    // Studio Page
    studio: {
      title: 'Social Media Posts for Your Team',
      subtitle: 'Create Professional Social Media Posts for Your Games in Seconds',
      selectClub: 'Choose Club',
      selectTeam: 'Choose Team',
      selectGame: 'Choose Game',
      selectSport: 'Choose Sport',
      selectSportDescription: 'Choose your sport',
      selectSportPlaceholder: 'Choose a sport...',
      selectClubDescription: 'Choose your club',
      selectTeamDescription: 'Choose your team',
      selectGameDescription: 'Choose the game and create your post',
      back: 'Back',
      backToGameSelection: 'Back to Game Selection',
      export: 'Export',
      exportAsImage: 'Export Image',
      instagramStory: 'Instagram Story',
    },

    // Wording from Design Concept
    wording: {
      claim: 'Design your win.',
      youPlayWePost: 'You play. We post.',
      turnEveryMatch: 'Turn every match into a moment.',
      fansWillLove: 'Your fans will love your feed.',
      smartDesign: 'Smart design for real emotion.',
    },

    // Footer Section
    footer: {
      tagline: 'Where emotions become stories.',
      subtitle: 'Share what moves you.',
      product: 'Product',
      features: 'Features',
      pricing: 'Pricing',
      about: 'About',
      socialMedia: 'Social Media',
      privacy: 'Privacy',
      imprint: 'Imprint',
      dataProtection: 'Data Protection',
      terms: 'Terms & Conditions',
      allRightsReserved: 'Licensed under CC BY-SA 4.0.',
    },
  },
};
