import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, SUBSCRIPTION_PRICES } from '@/hooks/useSubscription';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, Lock, Sparkles } from 'lucide-react';
import { TemplateList } from '@/components/templates/TemplateList';
import { useToast } from '@/hooks/use-toast';

const Templates = () => {
  const { user, loading: authLoading } = useAuth();
  const { tier, createCheckout } = useSubscription();
  const { canUseCustomTemplates, loading: limitsLoading } = useSubscriptionLimits();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      navigate('/auth');
    }
  }, [mounted, authLoading, user, navigate]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Default to Pro monthly
      const priceId = SUBSCRIPTION_PRICES.pro.monthly;
      const url = await createCheckout(priceId);
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

  if (authLoading || limitsLoading || !mounted) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!canUseCustomTemplates) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Pro Feature</CardTitle>
              <CardDescription>
                Der Template Editor ist nur für Paid Users verfügbar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Upgrade Sie Ihren Account, um eigene Templates zu erstellen und zu verwalten.
              </p>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Mit Pro Features erhalten Sie:</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4 mb-3">
                      <li>• 10 Teams</li>
                      <li>• Unbegrenzte Templates</li>
                      <li>• 5 Spiele pro Vorlage</li>
                      <li>• 5 Eigene Vorlagen</li>
                      <li>• Logo-Upload</li>
                    </ul>
                    <p className="text-lg font-bold text-primary">
                      Nur CHF 12.- / Monat
                    </p>
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={handleUpgrade} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Jetzt zu Pro upgraden
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Zurück zur Startseite
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Meine Templates</h1>
              <p className="text-muted-foreground mt-1">
                Verwalten Sie Ihre eigenen Vorlagen für Spielvorschauen und Resultate
              </p>
            </div>
            <Button onClick={() => navigate('/templates/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Neues Template
            </Button>
          </div>

          <TemplateList />
        </div>
      </div>
    </div>
  );
};

export default Templates;
