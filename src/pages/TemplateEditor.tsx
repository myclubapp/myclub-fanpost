import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { TemplateDesigner } from '@/components/templates/TemplateDesigner';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  supported_games: z.number().min(1).max(3),
});

const TemplateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isPaidUser, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [supportedGames, setSupportedGames] = useState<number>(1);
  const [svgConfig, setSvgConfig] = useState<any>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isEditMode = !!id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!roleLoading && !isPaidUser) {
      navigate('/templates');
    }
  }, [authLoading, roleLoading, user, isPaidUser, navigate]);

  useEffect(() => {
    if (isEditMode && user) {
      loadTemplate();
    }
  }, [isEditMode, user]);

  const loadTemplate = async () => {
    if (!id || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setName(data.name);
      setSupportedGames(data.supported_games || 1);
      setSvgConfig(data.svg_config || {});
    } catch (error: any) {
      toast({
        title: "Fehler beim Laden",
        description: error.message,
        variant: "destructive",
      });
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate
    setErrors({});
    const validation = templateSchema.safeParse({ name, supported_games: supportedGames });
    if (!validation.success) {
      const newErrors: { [key: string]: string } = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const templateData = {
        user_id: user.id,
        name,
        supported_games: supportedGames,
        svg_config: svgConfig,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Template aktualisiert",
          description: "Ihre Änderungen wurden gespeichert.",
        });
      } else {
        const { error } = await supabase
          .from('templates')
          .insert([templateData]);

        if (error) throw error;

        toast({
          title: "Template erstellt",
          description: "Ihr neues Template wurde gespeichert.",
        });
      }

      navigate('/templates');
    } catch (error: any) {
      toast({
        title: "Fehler beim Speichern",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/templates')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">
                  {isEditMode ? 'Template bearbeiten' : 'Neues Template'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Erstellen Sie eine eigene Vorlage für Ihre Spielbilder
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Speichern
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grundeinstellungen</CardTitle>
              <CardDescription>
                Geben Sie Ihrem Template einen Namen und wählen Sie die Anzahl unterstützter Spiele
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Mein Custom Template"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="games">Anzahl Spiele</Label>
                <Select
                  value={supportedGames.toString()}
                  onValueChange={(value) => setSupportedGames(parseInt(value))}
                >
                  <SelectTrigger id="games">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Spiel</SelectItem>
                    <SelectItem value="2">2 Spiele</SelectItem>
                    <SelectItem value="3">3 Spiele</SelectItem>
                  </SelectContent>
                </Select>
                {errors.supported_games && (
                  <p className="text-sm text-destructive">{errors.supported_games}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <TemplateDesigner
            supportedGames={supportedGames}
            config={svgConfig}
            onChange={setSvgConfig}
            onSupportedGamesChange={setSupportedGames}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
