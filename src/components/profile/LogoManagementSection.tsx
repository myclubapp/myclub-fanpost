import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, SUBSCRIPTION_PRICES } from '@/hooks/useSubscription';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, Lock, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Logo {
  id: string;
  name: string;
  logo_type: string;
  file_url: string | null;
  file_path: string;
}

export function LogoManagementSection() {
  const { user } = useAuth();
  const { tier, createCheckout } = useSubscription();
  const { canUploadLogos, loading: limitsLoading } = useSubscriptionLimits();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [logoName, setLogoName] = useState('');
  const [logoType, setLogoType] = useState('sponsor');

  useEffect(() => {
    if (user && canUploadLogos) {
      loadLogos();
    }
  }, [user, canUploadLogos]);

  const loadLogos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_logos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogos(data || []);
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

  const uploadLogo = async (file: File) => {
    if (!user || !logoName.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen Namen für das Logo ein',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-logos')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('user_logos')
        .insert({
          user_id: user.id,
          name: logoName.trim(),
          logo_type: logoType,
          file_path: fileName,
          file_url: publicUrl,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Erfolg',
        description: 'Logo hochgeladen',
      });

      setLogoName('');
      loadLogos();
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

  const deleteLogo = async (logo: Logo) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('user-logos')
        .remove([logo.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('user_logos')
        .delete()
        .eq('id', logo.id);

      if (dbError) throw dbError;

      toast({
        title: 'Erfolg',
        description: 'Logo gelöscht',
      });

      loadLogos();
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

  if (!canUploadLogos) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Logo-Upload</CardTitle>
          </div>
          <CardDescription>
            Diese Funktion ist nur für Pro- und Premium-Abonnenten verfügbar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Upgraden Sie auf Pro oder Premium, um eigene Logos hochzuladen und in Ihren Vorlagen zu verwenden.
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
        <CardTitle>Logo-Verwaltung</CardTitle>
        <CardDescription>
          Laden Sie Ihre eigenen Logos hoch und verwenden Sie sie in Ihren Vorlagen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo-name">Logo-Name</Label>
            <Input
              id="logo-name"
              placeholder="z.B. Hauptsponsor"
              value={logoName}
              onChange={(e) => setLogoName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-type">Logo-Typ</Label>
            <Select value={logoType} onValueChange={setLogoType}>
              <SelectTrigger id="logo-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sponsor">Sponsor</SelectItem>
                <SelectItem value="club">Verein</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-file">Logo-Datei</Label>
            <Input
              id="logo-file"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo(file);
              }}
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Logo wird hochgeladen...</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : logos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Noch keine Logos hochgeladen</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {logos.map((logo) => (
              <div key={logo.id} className="relative group border rounded-lg p-4">
                <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                  {logo.file_url ? (
                    <img
                      src={logo.file_url}
                      alt={logo.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="text-sm font-medium truncate">{logo.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{logo.logo_type}</div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteLogo(logo)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
