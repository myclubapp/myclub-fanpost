import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, SUBSCRIPTION_PRICES } from '@/hooks/useSubscription';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Lock, FileText, Trash2, Edit, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Template {
  id: string;
  name: string;
  supported_games: number;
  created_at: string;
}

export function TemplateManagementSection() {
  const { user } = useAuth();
  const { tier, createCheckout } = useSubscription();
  const { canUseCustomTemplates, maxCustomTemplates, loading: limitsLoading } = useSubscriptionLimits();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (user && canUseCustomTemplates) {
      loadTemplates();
    }
  }, [user, canUseCustomTemplates]);

  const loadTemplates = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Vorlage gelöscht',
      });

      loadTemplates();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copyTemplate = async (template: any) => {
    if (!user) return;
    if (templates.length >= maxCustomTemplates) {
      toast({
        title: 'Limit erreicht',
        description: 'Du hast die maximale Anzahl an Vorlagen erreicht.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('templates')
        .insert({
          user_id: user.id,
          name: `${template.name} (Kopie)`,
          supported_games: template.supported_games,
          svg_config: (template as any).svg_config,
          format: (template as any).format,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Vorlage kopiert',
        description: 'Die Vorlage wurde erfolgreich kopiert.',
      });

      if (data) setTemplates([data as Template, ...templates]);
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpgrade = () => {
    navigate('/profile/subscription');
  };

  if (limitsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!canUseCustomTemplates) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Vorlagen-Verwaltung</CardTitle>
          </div>
          <CardDescription>
            Diese Funktion ist nur für Amateur- ,Pro- und Premium-Abonnenten verfügbar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Upgrade auf Amateur, Pro oder Premium, um eigene Vorlagen zu erstellen und zu verwalten.
            </AlertDescription>
          </Alert>
          <Button onClick={handleUpgrade} disabled={upgrading} className="w-full">
            {upgrading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Upgraden
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vorlagen-Verwaltung</CardTitle>
            <CardDescription>
              Erstelle und verwalte deine eigenen Vorlagen
            </CardDescription>
          </div>
          <Badge variant="outline">
            {templates.length} / {maxCustomTemplates === 999 ? '∞' : maxCustomTemplates}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.length < maxCustomTemplates && (
          <Button
            onClick={() => navigate('/profile/templates/new')}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Neue Vorlage erstellen
          </Button>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Noch keine Vorlagen erstellt</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {template.supported_games} Spiel{template.supported_games !== 1 ? 'e' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/profile/templates/edit/${template.id}`)}
                    title="Vorlage bearbeiten"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyTemplate(template)}
                    title="Vorlage kopieren"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTemplate(template.id)}
                    title="Vorlage löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}