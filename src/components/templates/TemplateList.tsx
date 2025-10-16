import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil, Trash2, FileText, Image, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Template {
  id: string;
  name: string;
  supported_games: number;
  svg_config: any;
  created_at: string;
  updated_at: string;
}

export const TemplateList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as Template[]);
    } catch (error: any) {
      toast({
        title: "Fehler beim Laden",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: "Template gelöscht",
        description: "Das Template wurde erfolgreich gelöscht.",
      });

      setTemplates(templates.filter(t => t.id !== deleteId));
    } catch (error: any) {
      toast({
        title: "Fehler beim Löschen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleCopy = async (template: Template) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('templates')
        .insert({
          user_id: user.id,
          name: `${template.name} (Kopie)`,
          supported_games: template.supported_games,
          svg_config: template.svg_config,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Template kopiert",
        description: "Das Template wurde erfolgreich kopiert.",
      });

      setTemplates([data as Template, ...templates]);
    } catch (error: any) {
      toast({
        title: "Fehler beim Kopieren",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine Templates vorhanden</h3>
          <p className="text-muted-foreground text-center mb-6">
            Erstelle dein erstes Template, um loszulegen.
          </p>
          <Button onClick={() => navigate('/templates/new')}>
            Erstes Template erstellen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-2 space-y-1 text-xs">
                    <div>Erstellt: {formatDateTime(template.created_at)}</div>
                    <div>Geändert: {formatDateTime(template.updated_at)}</div>
                  </CardDescription>
                </div>
                <Badge variant="default">
                  <FileText className="h-3 w-3 mr-1" />
                  {template.supported_games} {template.supported_games === 1 ? 'Spiel' : 'Spiele'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/templates/edit/${template.id}`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(template)}
                  title="Template kopieren"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(template.id)}
                  className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                  title="Template löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Template löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Template wird permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
