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

export const SettingsSection = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
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
        title: "Gespeichert",
        description: "Instagram-Benutzername wurde aktualisiert.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler",
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
        <CardTitle>Einstellungen</CardTitle>
        <CardDescription>
          Passen Sie die Darstellung an Ihre Präferenzen an
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-semibold">Darstellung</Label>
          <p className="text-sm text-muted-foreground">
            Wählen Sie, wie die Anwendung angezeigt werden soll.
          </p>
          <RadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer font-normal">
                <Sun className="h-4 w-4" />
                Hell
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer font-normal">
                <Moon className="h-4 w-4" />
                Dunkel
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer font-normal">
                <Monitor className="h-4 w-4" />
                System
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3 border-t pt-6">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram Integration
          </Label>
          <p className="text-sm text-muted-foreground">
            Verknüpfen Sie Ihren Instagram-Account für schnelles Teilen.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Benutzername (ohne @)"
              value={instagramUsername}
              onChange={(e) => setInstagramUsername(e.target.value)}
            />
            <Button onClick={handleSaveInstagram} disabled={saving}>
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
