import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const EmotionalPricing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const pricingPlans = [
    {
      name: t.pricing.free.name,
      subtitle: t.pricing.free.subtitle,
      price: t.pricing.free.price,
      period: t.pricing.free.period,
      features: t.pricing.free.features,
      cta: t.pricing.free.cta,
      ctaVariant: "outline" as const,
    },
    {
      name: t.pricing.pro.name,
      subtitle: t.pricing.pro.subtitle,
      price: t.pricing.pro.price,
      period: t.pricing.pro.period,
      features: t.pricing.pro.features,
      cta: t.pricing.pro.cta,
      ctaVariant: "default" as const,
    },
    {
      name: t.pricing.enterprise.name,
      subtitle: t.pricing.enterprise.subtitle,
      price: t.pricing.enterprise.price,
      period: t.pricing.enterprise.period,
      features: t.pricing.enterprise.features,
      cta: t.pricing.enterprise.cta,
      ctaVariant: "outline" as const,
    }
  ];

  const handleCTA = (plan: string) => {
    if (plan === "Free" || plan === "Pro") {
      navigate('/auth');
    } else {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="pricing" className="container mx-auto px-4 py-32 relative">
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-left mb-16 space-y-4">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground">
            {t.pricing.title}
          </h2>
          <p className="text-xl text-foreground/70">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className="relative overflow-hidden bg-card/50 border-border hover:border-primary/50 transition-all duration-300 backdrop-blur-sm"
            >
              <CardContent className="p-8 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                </div>

                <div className="space-y-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="text-sm text-foreground/80">
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
