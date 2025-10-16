import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription, SUBSCRIPTION_PRICES } from '@/hooks/useSubscription';
import { Crown, User, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function SubscriptionSection() {
  const [loading, setLoading] = useState(false);
  const { subscription, tier, isSubscribed, checkSubscription, createCheckout, openCustomerPortal, loading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<'amateur' | 'pro' | 'premium'>('pro');
  const [isYearly, setIsYearly] = useState(true);

  // Check for pre-selected plan from landing page
  useEffect(() => {
    const savedPlan = localStorage.getItem('selectedPlan');
    const savedInterval = localStorage.getItem('selectedBillingInterval');
    
    if (savedPlan && (savedPlan === 'amateur' || savedPlan === 'pro')) {
      setSelectedPlan(savedPlan);
      setIsYearly(savedInterval === 'yearly');
      
      // Clear from localStorage after reading
      localStorage.removeItem('selectedPlan');
      localStorage.removeItem('selectedBillingInterval');
      
      // Show toast to inform user
      toast({
        title: "Abo vorausgewählt",
        description: `Das ${savedPlan === 'amateur' ? 'Amateur' : 'Pro'}-Abo wurde für Sie vorausgewählt.`,
      });
    }
  }, [toast]);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success) {
      toast({
        title: "Abonnement erfolgreich!",
        description: "Ihr Abonnement wurde erfolgreich aktiviert.",
      });
      checkSubscription();
      setSearchParams({});
    } else if (canceled) {
      toast({
        title: "Abonnement abgebrochen",
        description: "Der Kaufvorgang wurde abgebrochen.",
        variant: "destructive",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, checkSubscription, toast]);

  const handleUpgrade = async (planId: 'amateur' | 'pro' | 'premium') => {
    setLoading(true);
    try {
      const interval = isYearly ? 'yearly' : 'monthly';
      const priceId = SUBSCRIPTION_PRICES[planId][interval];
      const url = await createCheckout(priceId);
      if (url) {
        window.open(url, '_blank');
        toast({
          title: "Checkout geöffnet",
          description: "Schließen Sie den Kaufvorgang ab, um Ihr Abonnement zu aktivieren.",
        });
      } else {
        throw new Error('Checkout URL konnte nicht erstellt werden');
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const url = await openCustomerPortal();
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('Customer Portal URL konnte nicht erstellt werden');
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'free' as const,
      ...t.pricing.free,
      isCurrent: tier === 'free',
    },
    {
      id: 'amateur' as const,
      ...t.pricing.amateur,
      isCurrent: tier === 'amateur',
    },
    {
      id: 'pro' as const,
      ...t.pricing.pro,
      isCurrent: tier === 'pro',
    },
    {
      id: 'premium' as const,
      ...t.pricing.premium,
      isCurrent: tier === 'premium',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isSubscribed ? <Crown className="h-5 w-5 text-yellow-500" /> : <User className="h-5 w-5" />}
                {tier === 'free' && 'Free Account'}
                {tier === 'amateur' && 'Amateur Account'}
                {tier === 'pro' && 'Pro Account'}
                {tier === 'premium' && 'Premium Account'}
              </CardTitle>
              <CardDescription>
                {isSubscribed 
                  ? `Aktiv bis ${subscription?.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString('de-CH') : 'N/A'}`
                  : 'Kein aktives Abonnement'
                }
              </CardDescription>
            </div>
            <Badge variant={isSubscribed ? 'default' : 'secondary'}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        {isSubscribed && (
          <CardContent>
            <Button onClick={handleManageSubscription} disabled={loading} variant="outline" className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Abonnement verwalten
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Billing Interval Toggle */}
      {!subscriptionLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Zahlungsintervall</CardTitle>
            <CardDescription>Wählen Sie, wie oft Sie zahlen möchten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <Label 
                htmlFor="billing-toggle-profile" 
                className={`text-sm sm:text-base font-semibold transition-colors cursor-pointer ${
                  !isYearly ? 'text-foreground' : 'text-foreground/50'
                }`}
              >
                {t.pricing.billingToggle.monthly}
              </Label>
              <Switch
                id="billing-toggle-profile"
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-primary"
              />
              <Label 
                htmlFor="billing-toggle-profile" 
                className={`text-sm sm:text-base font-semibold transition-colors cursor-pointer ${
                  isYearly ? 'text-foreground' : 'text-foreground/50'
                }`}
              >
                {t.pricing.billingToggle.yearly}
              </Label>
              {isYearly && (
                <span className="ml-1 sm:ml-2 bg-destructive text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                  -20%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative transition-all duration-300 ${
              plan.popular ? 'lg:-translate-y-4' : plan.isCurrent ? '' : 'hover:-translate-y-2'
            }`}
          >
            <Card
              className={`relative overflow-hidden bg-background border-2 rounded-3xl transition-all duration-300 flex flex-col h-full ${
                plan.isCurrent
                  ? 'border-primary shadow-2xl shadow-primary/20'
                  : plan.popular
                  ? 'border-[#2979FF] shadow-2xl shadow-[#2979FF]/20'
                  : 'border-border hover:border-foreground/20'
              }`}
            >
              {/* Popular/Current Badge */}
              {(plan.popular || plan.isCurrent) && (
                <div className={`absolute top-0 inset-x-0 h-1 ${
                  plan.isCurrent 
                    ? 'bg-primary'
                    : 'bg-gradient-to-r from-[#2979FF] via-[#FF4E56] to-[#2979FF]'
                }`} />
              )}
              
              <CardContent className="p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 flex flex-col h-full">
                {/* Plan Header */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    {plan.isCurrent && (
                      <Badge variant="default" className="mb-2">Aktuell</Badge>
                    )}
                    {plan.popular && !plan.isCurrent && (
                      <span className="bg-gradient-to-r from-[#2979FF] to-[#FF4E56] text-white text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full mb-2">
                        {plan.subtitle}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{plan.name}</h3>
                  {!plan.popular && !plan.isCurrent && (
                    <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                  )}
                  {plan.isCurrent && (
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
                  {('priceNote' in plan) && plan.priceNote && (
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
                        {('templateNote' in plan) && plan.templateNote && (
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
                {!plan.isCurrent && plan.id !== 'free' && (
                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    size="default"
                    className={`w-full mt-auto font-bold rounded-xl transition-all duration-300 text-sm sm:text-base ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#2979FF] to-[#1557CC] hover:from-[#1557CC] hover:to-[#2979FF] text-white shadow-lg shadow-[#2979FF]/30'
                        : 'hover:bg-foreground/5'
                    }`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {plan.cta}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
