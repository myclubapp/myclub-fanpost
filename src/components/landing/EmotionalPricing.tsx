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
  const [isYearly, setIsYearly] = useState(true);

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
    <section id="pricing" className="container mx-auto px-4 py-16 sm:py-24 md:py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2979FF] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF4E56] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-16 md:mb-20 space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground">
              {t.pricing.title}
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/70 max-w-3xl mx-auto">
              {t.pricing.subtitle}
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 pt-3 sm:pt-4">
            <Label 
              htmlFor="billing-toggle" 
              className={`text-sm sm:text-base font-semibold transition-colors cursor-pointer ${
                !isYearly ? 'text-foreground' : 'text-foreground/50'
              }`}
            >
              {t.pricing.billingToggle.monthly}
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-[#2979FF]"
            />
            <Label 
              htmlFor="billing-toggle" 
              className={`text-sm sm:text-base font-semibold transition-colors cursor-pointer ${
                isYearly ? 'text-foreground' : 'text-foreground/50'
              }`}
            >
              {t.pricing.billingToggle.yearly}
            </Label>
            {isYearly && (
              <span className="ml-1 sm:ml-2 bg-[#FF4E56] text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                -20%
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative transition-all duration-300 ${
                plan.popular ? 'lg:-translate-y-4' : 'hover:-translate-y-2'
              }`}
            >
              <Card
                className={`relative overflow-hidden bg-background border-2 rounded-3xl transition-all duration-300 flex flex-col h-full ${
                  plan.popular
                    ? 'border-[#2979FF] shadow-2xl shadow-[#2979FF]/20'
                    : 'border-border hover:border-foreground/20'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#2979FF] via-[#FF4E56] to-[#2979FF]" />
                )}
                
                <CardContent className="p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 flex flex-col h-full">
                  {/* Plan Header */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      {plan.popular && (
                        <span className="bg-gradient-to-r from-[#2979FF] to-[#FF4E56] text-white text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full">
                          {plan.subtitle}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{plan.name}</h3>
                    {!plan.popular && (
                      <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-1.5 sm:space-y-2 py-2 sm:py-3 md:py-4">
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground font-medium">CHF</span>
                      <span className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
                        {isYearly 
                          ? parseFloat(plan.priceYearly) === 0 
                            ? '0' 
                            : (parseFloat(plan.priceYearly) / 12).toFixed(2)
                          : plan.price
                        }
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {plan.period}
                    </p>
                    {isYearly && parseFloat(plan.priceYearly) > 0 && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        ({t.pricing.billedYearly} {plan.priceYearly})
                      </p>
                    )}
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{t.pricing.vatNote}</p>
                    {plan.priceNote && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground italic">{plan.priceNote}</p>
                    )}
                  </div>

                  {/* Key Features */}
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t-2 border-border">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-foreground">{plan.teams}</p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{plan.templates}</p>
                          {plan.templateNote && (
                            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">{plan.templateNote}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-foreground">{plan.games}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Features */}
                  <div className="space-y-1.5 sm:space-y-2 flex-grow pt-1 sm:pt-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 sm:gap-3">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-foreground/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    variant={plan.ctaVariant}
                    size="default"
                    className={`w-full mt-auto font-bold rounded-xl transition-all duration-300 text-sm sm:text-base ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#2979FF] to-[#1557CC] hover:from-[#1557CC] hover:to-[#2979FF] text-white shadow-lg shadow-[#2979FF]/30'
                        : 'hover:bg-foreground/5'
                    }`}
                    onClick={() => handleCTA(plan.name)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
