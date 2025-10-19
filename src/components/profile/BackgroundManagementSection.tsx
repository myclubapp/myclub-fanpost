import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Image as ImageIcon, Upload } from 'lucide-react';

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
  const [uploading, setUploading] = useState(false);

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

      // Filter out .emptyFolderPlaceholder and thumbnail files
      const filteredData = data.filter(file => 
        !file.name.includes('.emptyFolderPlaceholder') && 
        !file.name.startsWith('thumb_')
      );

      if (filteredData.length === 0) {
        setBackgrounds([]);
        return;
      }

      const items = await Promise.all(
        filteredData.map(async (file) => {
          const filePath = `backgrounds/${user.id}/${file.name}`;
          const thumbPath = `backgrounds/${user.id}/thumb_${file.name}`;
          
          // Try to load thumbnail first, fallback to original
          let { data: signed, error: signError } = await supabase.storage
            .from('game-backgrounds')
            .createSignedUrl(thumbPath, 3600);

          // If no thumbnail exists, use original
          if (signError) {
            const result = await supabase.storage
              .from('game-backgrounds')
              .createSignedUrl(filePath, 3600);
            signed = result.data;
            if (result.error) {
              console.error('Error creating signed URL:', result.error);
              return null;
            }
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

    // Optimistic UI update
    const prevBackgrounds = backgrounds;
    setBackgrounds(prev => prev.filter(b => b.path !== background.path));

    try {
      const thumbPath = background.path.replace(
        `backgrounds/${user?.id}/`,
        `backgrounds/${user?.id}/thumb_`
      );

      // Delete both original and thumbnail
      const { error } = await supabase.storage
        .from('game-backgrounds')
        .remove([background.path, thumbPath]);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Hintergrundbild gelöscht',
      });

      // Re-sync to be safe
      await loadBackgrounds();
    } catch (error: any) {
      // Revert optimistic update on error
      setBackgrounds(prevBackgrounds);
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const createThumbnail = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Set thumbnail size (max 400px wide, maintaining aspect ratio)
        const maxWidth = 400;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadBackground = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `backgrounds/${user.id}/${timestamp}.${fileExt}`;
      const thumbFileName = `backgrounds/${user.id}/thumb_${timestamp}.${fileExt}`;

      // Upload original
      const { error: uploadError } = await supabase.storage
        .from('game-backgrounds')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create and upload thumbnail
      try {
        const thumbnail = await createThumbnail(file);
        await supabase.storage
          .from('game-backgrounds')
          .upload(thumbFileName, thumbnail);
      } catch (thumbError) {
        console.error('Thumbnail creation failed:', thumbError);
        // Continue anyway - original is uploaded
      }

      toast({
        title: 'Erfolg',
        description: 'Hintergrundbild hochgeladen',
      });

      await loadBackgrounds();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hintergrundbilder</CardTitle>
        <CardDescription>
          Verwalte deine hochgeladenen Hintergrundbilder aus dem Studio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="background-file">Hintergrundbild hochladen</Label>
            <Input
              id="background-file"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadBackground(file);
              }}
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Hintergrundbild wird hochgeladen...</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : backgrounds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Noch keine Hintergrundbilder hochgeladen</p>
            <p className="text-sm mt-2">Lade dein erstes Bild über das Formular oben hoch</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Deine hochgeladenen Hintergrundbilder:</p>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
