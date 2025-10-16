import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Image as ImageIcon } from 'lucide-react';

interface BackgroundImage {
  name: string;
  url: string;
  path: string;
}

export function BackgroundManagementSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [backgrounds, setBackgrounds] = useState<BackgroundImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBackgrounds();
    }
  }, [user]);

  const loadBackgrounds = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('game-backgrounds')
        .list(`backgrounds/${user.id}`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'updated_at', order: 'desc' },
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        setBackgrounds([]);
        return;
      }

      const items = await Promise.all(
        data.map(async (file) => {
          const filePath = `backgrounds/${user.id}/${file.name}`;
          const { data: signed, error: signError } = await supabase.storage
            .from('game-backgrounds')
            .createSignedUrl(filePath, 3600);

          if (signError) {
            console.error('Error creating signed URL:', signError);
            return null;
          }

          return {
            name: file.name,
            url: signed.signedUrl,
            path: filePath,
          };
        })
      );

      setBackgrounds(items.filter((item): item is BackgroundImage => item !== null));
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

  const deleteBackground = async (background: BackgroundImage) => {
    setDeleting(background.name);
    try {
      const { error } = await supabase.storage
        .from('game-backgrounds')
        .remove([background.path]);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Hintergrundbild gelöscht',
      });

      loadBackgrounds();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hintergrundbilder</CardTitle>
        <CardDescription>
          Verwalten Sie Ihre hochgeladenen Hintergrundbilder aus dem Studio
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : backgrounds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Noch keine Hintergrundbilder hochgeladen</p>
            <p className="text-sm mt-2">Laden Sie Bilder im Studio hoch, um sie hier zu verwalten</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {backgrounds.map((background) => (
              <div key={background.name} className="relative group border rounded-lg overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <img
                    src={background.url}
                    alt={background.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteBackground(background)}
                  disabled={deleting === background.name}
                >
                  {deleting === background.name ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
