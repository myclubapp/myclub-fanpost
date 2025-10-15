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
  const { subscription, tier, isSubscribed, checkSubscription, createCheckout, openCustomerPortal } = useSubscription();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<'amateur' | 'pro' | 'premium'>('pro');
  const [isYearly, setIsYearly] = useState(false);

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
    if (planId === 'premium') {
      window.location.href = 'mailto:info@fanpost.ch';
      return;
    }
    
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

      {/* Billing Interval Toggle (only for non-subscribers) */}
      {!isSubscribed && (
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
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.isCurrent ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  {plan.emoji} {plan.name}
                </CardTitle>
                {plan.isCurrent && <Badge variant="default">Aktuell</Badge>}
              </div>
              <CardDescription className="text-sm">{plan.subtitle}</CardDescription>
              <div className="space-y-1">
                <div className="text-3xl font-bold">
                  CHF {isYearly 
                    ? parseFloat(plan.priceYearly) === 0 
                      ? '0' 
                      : (parseFloat(plan.priceYearly) / 12).toFixed(2)
                    : plan.price
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  {plan.period}
                  {isYearly && parseFloat(plan.priceYearly) > 0 && (
                    <span className="block text-xs">
                      ({t.pricing.billedYearly} {plan.priceYearly})
                    </span>
                  )}
                </div>
                {'priceNote' in plan && plan.priceNote && (
                  <p className="text-xs text-muted-foreground italic">{plan.priceNote}</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Features */}
              <div className="space-y-2 pb-2 border-b">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-bold">{plan.teams}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{plan.templates}</p>
                    {'templateNote' in plan && plan.templateNote && (
                      <p className="text-xs text-muted-foreground">{plan.templateNote}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold">{plan.games}</span>
                </div>
              </div>

              {/* Additional Features */}
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {!plan.isCurrent && plan.id !== 'free' && (
                <Button
                  className="w-full"
                  variant={plan.id === 'premium' ? 'outline' : 'default'}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {plan.cta}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
