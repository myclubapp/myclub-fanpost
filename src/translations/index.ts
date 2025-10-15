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
      headline1: 'Vom Spiel',
      headline2: 'zum Post',
      headline3: 'in Sekunden.',
      subtitle: 'Erstelle beeindruckende Social Media Posts für dein Team - automatisch.',
      description: 'KANVA verwandelt deine Spieldaten in fertige Posts für Instagram, WhatsApp & mehr.',
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
        subtitle: 'Für kleine Vereine',
        price: '6.90',
        priceYearly: '66',
        period: '/Monat',
        periodYearly: '/Jahr',
        teams: 'bis 3 Teams',
        templates: 'bis 2 eigene Vorlagen',
        games: '2 Spiele (via API)',
        features: [
          'Alle Free-Features',
          'Eigene Vorlagen mit dem Designer von KANVA',
         
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
          'Eigene Logoverwaltung',     
        ],
        cta: 'Jetzt starten',
        popular: true,
      },
      premium: {
        name: 'Premium',
        emoji: '🔵',
        subtitle: 'Für Verbände',
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
        cta: 'Kontakt aufnehmen',
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
      description: 'KANVA macht aus jedem Spiel eine Story – und aus jedem Team eine Marke. Sportvereine befähigen, ihre Emotionen, Erfolge und Momente in professionelle Social Media Posts zu verwandeln.',
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
      youPlayWePost: 'Ihr spielt. Wir posten.',
      turnEveryMatch: 'Macht aus jedem Spiel einen Moment.',
      fansWillLove: 'Eure Fans werden euren Feed lieben.',
      smartDesign: 'Intelligentes Design für echte Emotionen.',
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
      headline1: 'From match',
      headline2: 'to post',
      headline3: 'in seconds.',
      subtitle: 'Create stunning social media posts for your team - automatically.',
      description: 'KANVA turns your game data into ready-to-share posts for Instagram, WhatsApp & more.',
      ctaPrimary: 'Get Started Free',
      ctaSecondary: 'Watch Demo',
    },

    // Pricing Section
    pricing: {
      title: 'Pricing',
      subtitle: 'Choose the right plan for your team',
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
          'Automatic posts (2 per game: announcement + result)',
          'No custom branding',
          'No template upload',
          'Team change only every 24h',
          'Manual sharing on social media',
        ],
        cta: 'Get Started',
        popular: false,
      },
      amateur: {
        name: 'Amateur',
        emoji: '🟡',
        subtitle: 'For Small Clubs',
        price: '6.90',
        priceYearly: '66',
        period: '/month',
        periodYearly: '/year',
        teams: 'up to 3 Teams',
        templates: 'up to 3 custom templates',
        games: '1 Game (via API)',
        features: [
          'All Free features',
          'Custom colors & logo customization',
          'Access to league data (schedules)',
          'Standard branding (small "Made with KANVA")',
          'Manual or automatic posting (social export)',
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
        templates: 'up to 6 custom templates',
        games: 'up to 2 Games (via API)',
        features: [
          'All Amateur features',
          'Custom templates & colors',
          'Club branding (without KANVA logo)',
          'Automatic social export (Instagram, Facebook, WhatsApp)',
          'Access to premium designs (Matchday, Scoreboard, Highlight)',
          'Statistics & Insights',
        ],
        cta: 'Get Started',
        popular: true,
      },
      premium: {
        name: 'Premium',
        emoji: '🔵',
        subtitle: 'For Leagues',
        price: '30.00',
        priceYearly: '288',
        period: '/month',
        periodYearly: '/year',
        priceNote: '(or custom for leagues/associations)',
        teams: 'Unlimited Teams',
        templates: 'Unlimited custom templates',
        games: 'up to 3 Games (via API)',
        features: [
          'All Pro features',
          'White label (no KANVA branding)',
          'Multi-admin access',
          'API integration for leagues',
          'Automatic upload & scheduling',
          'Priority support',
          'Custom template creation by KANVA team possible',
        ],
        cta: 'Contact Us',
        popular: false,
      },
    },

    // How It Works Section
    howItWorks: {
      title: 'How It Works',
      subtitle: 'Three simple steps to the perfect post',
      step1: {
        title: 'Select Game',
        description: 'Choose your game or create a new one with all details.',
      },
      step2: {
        title: 'Choose Template',
        description: 'Select from professional templates or create your own.',
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

    // Studio Page
    studio: {
      title: 'Social Media Posts for your Team',
      subtitle: 'Create professional social media posts for your games in seconds',
      selectClub: 'Select Club',
      selectTeam: 'Select Team',
      selectGame: 'Select Game',
      selectSport: 'Select Sport',
      selectSportDescription: 'Choose your sport',
      selectSportPlaceholder: 'Choose a sport...',
      selectClubDescription: 'Choose your club',
      selectTeamDescription: 'Choose your team',
      selectGameDescription: 'Select the game and create your post',
      back: 'Back',
      backToGameSelection: 'Back to game selection',
      export: 'Export',
      exportAsImage: 'Export as Image',
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
  },
};
