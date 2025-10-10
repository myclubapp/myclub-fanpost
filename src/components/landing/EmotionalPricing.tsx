import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, Zap, Trophy } from "lucide-react";

const pricingPlans = [
  {
    name: "Free",
    subtitle: "Starte mit drei Posts",
    description: "Kostenlos und sofort einsatzbereit",
    price: "CHF 0",
    period: "/Monat",
    icon: Sparkles,
    gradient: "from-blue-500 to-cyan-500",
    features: [
      "3 Credits pro Monat",
      "Alle Sportarten verfügbar",
      "Standard Templates",
      "Direkt herunterladen & teilen"
    ],
    cta: "Gratis starten",
    ctaVariant: "outline" as const,
    popular: false
  },
  {
    name: "Pro",
    subtitle: "Für Teams, die jede Woche posten",
    description: "Für Teams, die Begeisterung teilen wollen",
    price: "CHF 9",
    period: "/Monat",
    icon: Zap,
    gradient: "from-purple-500 to-pink-500",
    features: [
      "10 Credits pro Monat",
      "Alle Free Features",
      "Eigene Templates erstellen",
      "Template-Bibliothek verwalten",
     
    ],
    cta: "Jetzt upgraden",
    ctaVariant: "default" as const,
    popular: true
  },
  {
    name: "Premium",
    subtitle: "Für grosse Vereine",
    description: "Von den Junioren bis zur 1. Mannschaft",
    price: "Auf Anfrage",
    period: "",
    icon: Trophy,
    gradient: "from-orange-500 to-red-500",
    features: [
      "Unbegrenzte Credits",
      "Alle Pro Features",
      "Templates exportieren und teilen",
      "Eigene Bilderbibliothek",

    ],
    cta: "Kontakt aufnehmen",
    ctaVariant: "outline" as const,
    popular: false
  }
];

export const EmotionalPricing = () => {
  const navigate = useNavigate();

  const handleCTA = (plan: string) => {
    if (plan === "Free") {
      navigate('/wizard');
    } else if (plan === "Pro") {
      navigate('/auth');
    } else {
      // Enterprise - scroll to contact or open contact form
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="pricing" className="container mx-auto px-4 py-20 relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Preise, die zu deinem Team passen
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Weil jedes Team Social Media verdient – vom Hobbyteam bis zum Verein
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;
            
            return (
              <Card 
                key={plan.name}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                  plan.popular 
                    ? 'border-primary shadow-[var(--shadow-glow)] scale-105' 
                    : 'hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Beliebteste
                  </div>
                )}

                <CardHeader className="space-y-4 pb-8">
                  <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${plan.gradient} p-3 rounded-xl text-white self-start`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <div>
                    <CardTitle className="text-3xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-base font-medium">
                      {plan.subtitle}
                    </CardDescription>
                  </div>

                  <div className="pt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground text-lg">{plan.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {plan.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1 rounded-full bg-gradient-to-br ${plan.gradient}`}>
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm flex-1">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full text-lg py-6"
                    variant={plan.ctaVariant}
                    onClick={() => handleCTA(plan.name)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Alle Preise in Schweizer Franken inkl. MwSt.  Jederzeit kündbar.
          </p>
        </div>
      </div>
    </section>
  );
};