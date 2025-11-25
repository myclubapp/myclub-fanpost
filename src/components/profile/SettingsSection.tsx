import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '@/components/theme-provider';
import { Sun, Moon, Monitor, Instagram } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export const SettingsSection = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [instagramUsername, setInstagramUsername] = useState('');
  const [saving, setSaving] = useState(false);

  // Load Instagram username on mount
  useEffect(() => {
    const loadInstagramUsername = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        const ig = (data as any)?.instagram_username as string | undefined;
        if (ig) {
          setInstagramUsername(ig);
        }
      } catch (error) {
        console.error('Error loading Instagram username:', error);
      }
    };

    loadInstagramUsername();
  }, [user]);

  const handleSaveInstagram = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Remove @ symbol if user included it
      const cleanUsername = instagramUsername.replace('@', '').trim();

        const { error } = await supabase
          .from('profiles')
          .update({ instagram_username: (cleanUsername || null) } as any)
          .eq('id', user.id);

      if (error) throw error;

      toast({
        title: t.messages.saved,
        description: t.messages.instagramUpdated,
      });
    } catch (error: any) {
      toast({
        title: t.messages.error,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.profile.settings.title}</CardTitle>
        <CardDescription>
          {t.profile.settings.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t.profile.settings.appearance}</Label>
          <p className="text-sm text-muted-foreground">
            {t.profile.settings.appearanceDescription}
          </p>
          <RadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer font-normal">
                <Sun className="h-4 w-4" />
                {t.profile.settings.light}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer font-normal">
                <Moon className="h-4 w-4" />
                {t.profile.settings.dark}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer font-normal">
                <Monitor className="h-4 w-4" />
                {t.profile.settings.system}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3 border-t pt-6">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            {t.profile.settings.instagram}
          </Label>
          <p className="text-sm text-muted-foreground">
            {t.profile.settings.instagramDescription}
          </p>
          <div className="flex gap-2">
            <Input
              placeholder={t.profile.settings.usernamePlaceholder}
              value={instagramUsername}
              onChange={(e) => setInstagramUsername(e.target.value)}
            />
            <Button onClick={handleSaveInstagram} disabled={saving}>
              {saving ? t.profile.settings.saving : t.profile.settings.save}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
