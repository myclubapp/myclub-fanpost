import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Save, ArrowLeft, Eye, Plus, Minus } from 'lucide-react';
import { TemplateDesigner } from '@/components/templates/TemplateDesigner';
import { z } from 'zod';

const TemplateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { isPaidUser, loading: roleLoading } = useUserRole();
  const { maxGamesPerTemplate, loading: limitsLoading } = useSubscriptionLimits();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [supportedGames, setSupportedGames] = useState<number>(1);
  const [format, setFormat] = useState<'4:5' | '1:1'>('4:5');
  const [svgConfig, setSvgConfig] = useState<any>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const isEditMode = !!id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!roleLoading && !isPaidUser) {
      navigate('/profile/templates');
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
      if (typeof data.svg_config === 'object' && data.svg_config !== null && 'format' in data.svg_config) {
        setFormat((data.svg_config as any).format || '4:5');
      }
    } catch (error: any) {
      toast({
        title: "Fehler beim Laden",
        description: error.message,
        variant: "destructive",
      });
      navigate('/profile/templates');
    } finally {
      setLoading(false);
    }
  };

  const loadPreviewData = async () => {
    try {
      const gameIds = ['1073721', '1073723', '1073724'];
      const gamesToLoad = gameIds.slice(0, supportedGames);

      const promises = gamesToLoad.map(gameId =>
        fetch(`https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query=%7B%0A%20%20game(gameId%3A%20%22${gameId}%22)%20%7B%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20location%0A%20%20%20%20city%0A%20%20%20%20result%0A%20%20%20%20resultDetail%0A%20%20%20%20teamHomeLogo%0A%20%20%20%20teamAwayLogo%0A%20%20%7D%0A%7D%0A`)
          .then(res => res.json())
          .then(data => data.data.game)
      );

      const gamesData = await Promise.all(promises);

      // Create preview data with suffixed fields for games 2 and 3
      const previewDataObj: any = gamesData[0]; // Game 1 has no suffix

      if (gamesData[1]) {
        Object.keys(gamesData[1]).forEach(key => {
          previewDataObj[`${key}2`] = gamesData[1][key];
        });
      }

      if (gamesData[2]) {
        Object.keys(gamesData[2]).forEach(key => {
          previewDataObj[`${key}3`] = gamesData[2][key];
        });
      }

      setPreviewData(previewDataObj);
      setPreviewMode(true);
      toast({
        title: t.messages.previewLoaded,
        description: `Template wird mit Beispieldaten für ${supportedGames} ${supportedGames === 1 ? 'Spiel' : 'Spiele'} angezeigt`,
      });
    } catch (error) {
      toast({
        title: t.messages.loadingError,
        description: t.messages.previewError,
        variant: "destructive",
      });
    }
  };

  const handleTogglePreview = () => {
    if (previewMode) {
      setPreviewMode(false);
      setPreviewData(null);
    } else {
      loadPreviewData();
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate with dynamic max based on subscription
    setErrors({});
    const templateSchema = z.object({
      name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
      supported_games: z.number().min(1).max(maxGamesPerTemplate, `Maximal ${maxGamesPerTemplate} ${maxGamesPerTemplate === 1 ? 'Spiel' : 'Spiele'} erlaubt`),
    });

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

      navigate('/profile/templates');
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

  if (authLoading || roleLoading || limitsLoading) {
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

      {/* Sticky Header */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/profile/templates')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditMode ? 'Template bearbeiten' : 'Neues Template'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Erstelle eine eigene Vorlage für deine Spielbilder
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleTogglePreview}
                variant={previewMode ? "default" : "outline"}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {previewMode ? 'Editor-Modus' : 'Vorschau'}
              </Button>
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Speichern
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-6xl mx-auto space-y-6">

          <Card>
            <CardHeader>
              <CardTitle>Grundeinstellungen</CardTitle>
              <CardDescription>
                Gib deinem Template einen Namen und wähle die Anzahl unterstützter Spiele
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="games">Anzahl Spiele</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setSupportedGames(Math.max(1, supportedGames - 1))}
                      disabled={supportedGames <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-bold">{supportedGames}</div>
                      <div className="text-xs text-muted-foreground">
                        {supportedGames === 1 ? 'Spiel' : 'Spiele'}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setSupportedGames(Math.min(maxGamesPerTemplate, supportedGames + 1))}
                      disabled={supportedGames >= maxGamesPerTemplate}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.supported_games && (
                    <p className="text-sm text-destructive">{errors.supported_games}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Ihr Abo erlaubt max. {maxGamesPerTemplate} {maxGamesPerTemplate === 1 ? 'Spiel' : 'Spiele'} pro Template
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={format}
                    onValueChange={(value: '4:5' | '1:1') => setFormat(value)}
                  >
                    <SelectTrigger id="format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4:5">4:5 (Instagram - 1080x1350)</SelectItem>
                      <SelectItem value="1:1">1:1 (Quadratisch - 1080x1080)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <TemplateDesigner
            supportedGames={supportedGames}
            config={svgConfig}
            onChange={setSvgConfig}
            onSupportedGamesChange={setSupportedGames}
            format={format}
            onFormatChange={setFormat}
            previewMode={previewMode}
            previewData={previewData}
            onTogglePreview={handleTogglePreview}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
