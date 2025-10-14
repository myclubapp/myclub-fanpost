import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check } from "lucide-react";
import { useState } from "react";

export const EmotionalPricing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isYearly, setIsYearly] = useState(false);

  const pricingPlans = [
    {
      ...t.pricing.free,
      ctaVariant: "outline" as const,
    },
    {
      ...t.pricing.amateur,
      ctaVariant: "outline" as const,
    },
    {
      ...t.pricing.pro,
      ctaVariant: "default" as const,
    },
    {
      ...t.pricing.premium,
      ctaVariant: "outline" as const,
    }
  ];

  const handleCTA = (plan: string) => {
    if (plan === "Free" || plan === "Amateur" || plan === "Pro") {
      navigate('/auth');
    } else {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="pricing" className="container mx-auto px-4 py-32 relative">
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-left mb-16 space-y-6">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground">
              {t.pricing.title}
            </h2>
            <p className="text-xl text-foreground/70">
              {t.pricing.subtitle}
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-start gap-4">
            <Label htmlFor="billing-toggle" className="text-base text-foreground/70">
              {t.pricing.billingToggle.monthly}
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className="text-base text-foreground/70">
              {t.pricing.billingToggle.yearly}
            </Label>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden bg-card/50 border-border transition-all duration-300 backdrop-blur-sm flex flex-col ${
                plan.popular
                  ? 'ring-2 ring-primary shadow-xl scale-105'
                  : 'hover:border-primary/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  {plan.subtitle}
                </div>
              )}
              
              <CardContent className="p-6 space-y-6 flex flex-col h-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{plan.emoji}</span>
                    <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                  </div>
                  {!plan.popular && (
                    <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">CHF</span>
                    <span className="text-4xl font-bold text-foreground">
                      {isYearly ? plan.priceYearly : plan.price}
                    </span>
                    <span className="text-muted-foreground">
                      {isYearly ? plan.periodYearly : plan.period}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.pricing.vatNote}</p>
                  {plan.priceNote && (
                    <p className="text-xs text-muted-foreground">{plan.priceNote}</p>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{plan.teams}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground">{plan.templates}</p>
                        {plan.templateNote && (
                          <p className="text-xs text-muted-foreground">{plan.templateNote}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground">{plan.games}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 flex-grow">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-foreground/70">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={plan.ctaVariant}
                  className="w-full mt-auto"
                  onClick={() => handleCTA(plan.name)}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
