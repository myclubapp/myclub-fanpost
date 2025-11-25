import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Mail } from "lucide-react";

export const EmailPreferencesSection = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [gameDayReminder, setGameDayReminder] = useState(true);
  const [gameAnnouncementReminder, setGameAnnouncementReminder] = useState(true);
  const [announcementDaysBefore, setAnnouncementDaysBefore] = useState(3);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('email_game_day_reminder, email_game_announcement_reminder, announcement_days_before')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setGameDayReminder(data.email_game_day_reminder ?? true);
        setGameAnnouncementReminder(data.email_game_announcement_reminder ?? true);
        setAnnouncementDaysBefore(data.announcement_days_before ?? 3);
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
      toast({
        title: t.messages.error,
        description: t.profile.emailPreferences.loadError,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (field: 'email_game_day_reminder' | 'email_game_announcement_reminder' | 'announcement_days_before', value: boolean | number) => {
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: t.profile.emailPreferences.saved,
        description: t.profile.emailPreferences.savedDescription,
      });
    } catch (error) {
      console.error('Error updating email preference:', error);
      toast({
        title: t.messages.error,
        description: t.profile.emailPreferences.saveError,
        variant: "destructive",
      });
      // Revert the change
      if (field === 'email_game_day_reminder') {
        setGameDayReminder(!value as boolean);
      } else if (field === 'email_game_announcement_reminder') {
        setGameAnnouncementReminder(!value as boolean);
      } else if (field === 'announcement_days_before') {
        // Don't revert for days before
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>{t.profile.emailPreferences.title}</CardTitle>
        </div>
        <CardDescription>
          {t.profile.emailPreferences.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-4 rounded-lg border border-border p-4 bg-muted/30">
          <div className="flex-1 space-y-1">
            <Label htmlFor="game-day-reminder" className="text-sm font-medium cursor-pointer">
              {t.profile.emailPreferences.gameDayReminder}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t.profile.emailPreferences.gameDayReminderDescription}
            </p>
          </div>
          <Switch
            id="game-day-reminder"
            checked={gameDayReminder}
            onCheckedChange={(checked) => {
              setGameDayReminder(checked);
              updatePreference('email_game_day_reminder', checked);
            }}
            disabled={updating}
          />
        </div>

        <div className="flex items-center justify-between space-x-4 rounded-lg border border-border p-4 bg-muted/30">
          <div className="flex-1 space-y-1">
            <Label htmlFor="game-announcement-reminder" className="text-sm font-medium cursor-pointer">
              {t.profile.emailPreferences.gameAnnouncementReminder}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t.profile.emailPreferences.gameAnnouncementReminderDescription}
            </p>
          </div>
          <Switch
            id="game-announcement-reminder"
            checked={gameAnnouncementReminder}
            onCheckedChange={(checked) => {
              setGameAnnouncementReminder(checked);
              updatePreference('email_game_announcement_reminder', checked);
            }}
            disabled={updating}
          />
        </div>

        {gameAnnouncementReminder && (
          <div className="flex items-center justify-between space-x-4 rounded-lg border border-border p-4 bg-muted/30 ml-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="days-before" className="text-sm font-medium cursor-pointer">
                {t.profile.emailPreferences.daysBefore}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t.profile.emailPreferences.daysBeforeDescription}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="days-before"
                type="number"
                min="1"
                max="14"
                value={announcementDaysBefore}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 3;
                  if (value >= 1 && value <= 14) {
                    setAnnouncementDaysBefore(value);
                    updatePreference('announcement_days_before', value);
                  }
                }}
                disabled={updating}
                className="w-16 px-3 py-2 text-center border border-border rounded-md bg-background"
              />
              <span className="text-sm text-muted-foreground">{t.profile.emailPreferences.days}</span>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          <p>💡 {t.profile.emailPreferences.tip}</p>
        </div>
      </CardContent>
    </Card>
  );
};