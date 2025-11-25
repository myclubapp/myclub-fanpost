import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
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
        title: t.profile.logos.nameRequired,
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
        title: t.profile.logos.nameRequired,
        description: t.profile.logos.nameRequiredDescription,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logos/${user.id}/${Date.now()}.${fileExt}`;

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
        title: t.profile.logos.uploadSuccess,
        description: t.profile.logos.uploadSuccessDescription,
      });

      setLogoName('');
      loadLogos();
    } catch (error: any) {
      toast({
        title: t.profile.logos.nameRequired,
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
        title: t.profile.logos.deleteSuccess,
        description: t.profile.logos.deleteSuccessDescription,
      });

      loadLogos();
    } catch (error: any) {
      toast({
        title: t.profile.logos.nameRequired,
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
          <CardTitle>{t.profile.logos.locked}</CardTitle>
        </div>
        <CardDescription>
          {t.profile.logos.lockedDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            {t.profile.logos.upgradeMessage}
          </AlertDescription>
        </Alert>
          <Button onClick={handleUpgrade} className="w-full">
            {t.profile.logos.upgrade}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.profile.logos.title}</CardTitle>
        <CardDescription>
          {t.profile.logos.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo-name">{t.profile.logos.logoName}</Label>
            <Input
              id="logo-name"
              placeholder={t.profile.logos.logoNamePlaceholder}
              value={logoName}
              onChange={(e) => setLogoName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-type">{t.profile.logos.logoType}</Label>
            <Select value={logoType} onValueChange={setLogoType}>
              <SelectTrigger id="logo-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sponsor">{t.profile.logos.types.sponsor}</SelectItem>
                <SelectItem value="club">{t.profile.logos.types.club}</SelectItem>
                <SelectItem value="team">{t.profile.logos.types.team}</SelectItem>
                <SelectItem value="other">{t.profile.logos.types.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-file">{t.profile.logos.logoFile}</Label>
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
              <span>{t.profile.logos.uploading}</span>
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
            <p>{t.profile.logos.noLogos}</p>
          </div>
        ) : (
          <Tabs defaultValue="sponsor" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sponsor">{t.profile.logos.tabs.sponsor}</TabsTrigger>
              <TabsTrigger value="club">{t.profile.logos.tabs.club}</TabsTrigger>
              <TabsTrigger value="team">{t.profile.logos.tabs.team}</TabsTrigger>
              <TabsTrigger value="other">{t.profile.logos.tabs.other}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sponsor" className="mt-4">
              {logos.filter(logo => logo.logo_type === 'sponsor').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t.profile.logos.noLogosFound.sponsor}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {logos.filter(logo => logo.logo_type === 'sponsor').map((logo) => (
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
            </TabsContent>

            <TabsContent value="club" className="mt-4">
              {logos.filter(logo => logo.logo_type === 'club').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t.profile.logos.noLogosFound.club}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {logos.filter(logo => logo.logo_type === 'club').map((logo) => (
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
            </TabsContent>

            <TabsContent value="team" className="mt-4">
              {logos.filter(logo => logo.logo_type === 'team').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t.profile.logos.noLogosFound.team}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {logos.filter(logo => logo.logo_type === 'team').map((logo) => (
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
            </TabsContent>

            <TabsContent value="other" className="mt-4">
              {logos.filter(logo => logo.logo_type === 'other').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t.profile.logos.noLogosFound.other}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {logos.filter(logo => logo.logo_type === 'other').map((logo) => (
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
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
