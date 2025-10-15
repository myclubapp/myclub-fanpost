import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription, SUBSCRIPTION_PRICES } from '@/hooks/useSubscription';
import { Crown, User, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

export function SubscriptionSection() {
  const [loading, setLoading] = useState(false);
  const { subscription, tier, isSubscribed, checkSubscription, createCheckout, openCustomerPortal } = useSubscription();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<'amateur' | 'pro'>('pro');
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');

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

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const priceId = SUBSCRIPTION_PRICES[selectedPlan][selectedInterval];
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
      name: 'Free',
      price: '0',
      yearlyPrice: '0',
      features: ['1 Team', '5 Templates (Vorinstalliert)', '1 Spiel pro Vorlage'],
      isCurrent: tier === 'free',
    },
    {
      id: 'amateur' as const,
      name: 'Amateur',
      price: '5',
      yearlyPrice: '48',
      features: ['3 Teams', '20 Templates', '3 Spiele pro Vorlage'],
      isCurrent: tier === 'amateur',
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: '12',
      yearlyPrice: '115.20',
      features: ['10 Teams', 'Unbegrenzte Templates', '5 Spiele pro Vorlage', '5 Eigene Vorlagen', 'Logo-Upload'],
      isCurrent: tier === 'pro',
    },
    {
      id: 'premium' as const,
      name: 'Premium',
      price: 'Custom',
      yearlyPrice: 'Custom',
      features: ['Individuelle Lösung', 'Persönliche Beratung', 'Prioritäts-Support'],
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

      {/* Available Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.isCurrent ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                {plan.isCurrent && <Badge variant="default">Aktuell</Badge>}
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">
                  {plan.price !== 'Custom' && 'CHF '}
                  {plan.price !== 'Custom' 
                    ? (selectedInterval === 'monthly' ? plan.price : (parseFloat(plan.yearlyPrice) / 12).toFixed(2))
                    : 'Custom'
                  }
                </div>
                {plan.price !== 'Custom' && (
                  <div className="text-sm text-muted-foreground">
                    pro Monat
                    {selectedInterval === 'yearly' && (
                      <span className="block">(CHF {plan.yearlyPrice} jährlich)</span>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {!plan.isCurrent && plan.id !== 'premium' && plan.id !== 'free' && (
                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    handleUpgrade();
                  }}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {tier === 'free' ? 'Upgraden' : 'Wechseln'}
                </Button>
              )}
              {plan.id === 'premium' && (
                <Button variant="outline" className="w-full" onClick={() => window.location.href = 'mailto:info@fanpost.ch'}>
                  Kontakt aufnehmen
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Billing Interval Toggle (only for non-subscribers) */}
      {!isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle>Zahlungsintervall</CardTitle>
            <CardDescription>Wählen Sie, wie oft Sie zahlen möchten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={selectedInterval === 'monthly' ? 'default' : 'outline'}
                onClick={() => setSelectedInterval('monthly')}
                className="flex-1"
              >
                Monatlich
              </Button>
              <Button
                variant={selectedInterval === 'yearly' ? 'default' : 'outline'}
                onClick={() => setSelectedInterval('yearly')}
                className="flex-1"
              >
                Jährlich (-20%)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
