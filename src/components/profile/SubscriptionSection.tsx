import { useState, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Crown, User, Sparkles, CreditCard } from 'lucide-react';

export const SubscriptionSection = () => {
  const { role, isPaidUser } = useUserRole();
  const { subscription, loading: subscriptionLoading, createCheckout, openCustomerPortal, checkSubscription } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const url = await createCheckout();
      if (url) {
        window.open(url, '_blank');
        toast({
          title: "Checkout geöffnet",
          description: "Schließen Sie den Kaufvorgang ab, um zu Pro zu upgraden.",
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
        throw new Error('Portal URL konnte nicht erstellt werden');
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: "Zahlung erfolgreich",
        description: "Willkommen bei Pro! Ihre Subscription wird in Kürze aktiviert.",
      });
      checkSubscription();
      window.history.replaceState({}, '', '/profile/subscription');
    } else if (params.get('canceled') === 'true') {
      toast({
        title: "Zahlung abgebrochen",
        description: "Sie können jederzeit upgraden.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/profile/subscription');
    }
  }, []);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isPaidUser ? (
                <>
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Pro Account
                </>
              ) : (
                <>
                  <User className="h-5 w-5" />
                  Free Account
                </>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {isPaidUser
                ? 'Sie haben Zugriff auf alle Pro-Features'
                : 'Upgraden Sie für unbegrenzte Möglichkeiten'}
            </CardDescription>
          </div>
          <Badge
            variant={isPaidUser ? 'default' : 'secondary'}
            className={isPaidUser ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
          >
            {role === 'admin' ? 'Admin' : isPaidUser ? 'Paid' : 'Free'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isPaidUser && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Upgrade zu Pro</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Erstellen Sie eigene Templates, erhalten Sie 10 Credits pro Monat und nutzen Sie erweiterte Funktionen.
                </p>
                <p className="text-lg font-bold text-primary mb-3">
                  Nur CHF 9.- / Monat
                </p>
                <Button size="sm" onClick={handleUpgrade} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Jetzt upgraden
                </Button>
              </div>
            </div>
          </div>
        )}

        {isPaidUser && subscription?.subscribed && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-semibold">Abo verwalten</p>
              <p className="text-sm text-muted-foreground">
                {subscription.subscription_end && 
                  `Verlängert sich am ${new Date(subscription.subscription_end).toLocaleDateString('de-CH')}`
                }
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleManageSubscription} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
              Stripe Dashboard öffnen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
