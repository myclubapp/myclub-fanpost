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
      free: {
        name: 'Free',
        subtitle: 'Für Einsteiger',
        price: 'CHF 0',
        period: '/Monat',
        features: [
          '3 Credits pro Monat',
          'Basis Post-Erstellung',
        ],
        cta: 'Jetzt starten',
      },
      pro: {
        name: 'Pro',
        subtitle: 'Für aktive Teams',
        price: 'CHF 9',
        period: '/Monat',
        features: [
          '10 Credits pro Monat',
          'Alle Free Features',
          'Eigene Vorlagen erstellen',
        ],
        cta: 'Jetzt starten',
      },
      enterprise: {
        name: 'Enterprise',
        subtitle: 'Für Vereine',
        price: 'Individuell',
        period: '',
        features: [
          'Unbegrenzte Credits',
          'Alle Pro Features',
          'Priority Support',
        ],
        cta: 'Kontakt aufnehmen',
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
        title: 'Template wählen',
        description: 'Wähle aus professionellen Vorlagen oder erstelle deine eigenen.',
      },
      step3: {
        title: 'Teilen & Feiern',
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
      free: {
        name: 'Free',
        subtitle: 'For beginners',
        price: 'CHF 0',
        period: '/month',
        features: [
          '3 Credits per month',
          'Basic post creation',
        ],
        cta: 'Get Started',
      },
      pro: {
        name: 'Pro',
        subtitle: 'For active teams',
        price: 'CHF 9',
        period: '/month',
        features: [
          '10 Credits per month',
          'All Free Features',
          'Create custom templates',
        ],
        cta: 'Get Started',
      },
      enterprise: {
        name: 'Enterprise',
        subtitle: 'For clubs',
        price: 'Custom',
        period: '',
        features: [
          'Unlimited credits',
          'All Pro Features',
          'Priority support',
        ],
        cta: 'Contact Us',
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
        title: 'Share & Celebrate',
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
