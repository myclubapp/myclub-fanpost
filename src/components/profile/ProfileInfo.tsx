import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';

const profileSchema = z.object({
  first_name: z.string().max(100, 'Vorname zu lang').optional(),
  last_name: z.string().max(100, 'Nachname zu lang').optional(),
});

export const ProfileInfo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [rememberLastSelection, setRememberLastSelection] = useState(true);
  const [lastSport, setLastSport] = useState<string>('');
  const [lastClubName, setLastClubName] = useState<string>('');
  const [lastTeamName, setLastTeamName] = useState<string>('');
  const [loadingLastSelection, setLoadingLastSelection] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, remember_last_selection, last_sport, last_club_id, last_team_id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setRememberLastSelection(data.remember_last_selection ?? true);
        
        if (data.last_sport) {
          const sportLabels: Record<string, string> = {
            unihockey: 'Unihockey',
            volleyball: 'Volleyball',
            handball: 'Handball'
          };
          setLastSport(sportLabels[data.last_sport] || data.last_sport);
        }
        
        if (data.last_club_id || data.last_team_id) {
          loadLastSelectionNames(data.last_sport, data.last_club_id, data.last_team_id);
        }
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  const loadLastSelectionNames = async (sport: string | null, clubId: string | null, teamId: string | null) => {
    if (!sport || !clubId) return;
    
    setLoadingLastSelection(true);
    try {
      const apiUrls: Record<string, string> = {
        unihockey: "https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query={%0A%20%20clubs{%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20}%20%0A}",
        volleyball: "",
        handball: "",
      };

      const clubApiUrl = apiUrls[sport];
      if (clubApiUrl) {
        const response = await fetch(clubApiUrl);
        const data = await response.json();
        const clubs = data.data?.clubs || [];
        const club = clubs.find((c: { id: string, name: string }) => c.id === clubId);
        if (club) {
          setLastClubName(club.name);
        }
      }

      if (teamId) {
        const teamApiUrls: Record<string, (clubId: string) => string> = {
          unihockey: (clubId: string) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query={%0A%20%20teams(clubId%3A%20%22${clubId}%22)%20{%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20}%0A}%0A`,
          volleyball: () => "",
          handball: () => "",
        };

        const teamApiUrl = teamApiUrls[sport]?.(clubId);
        if (teamApiUrl) {
          const response = await fetch(teamApiUrl);
          const data = await response.json();
          const teams = data.data?.teams || [];
          const team = teams.find((t: { id: string, name: string }) => t.id === teamId);
          if (team) {
            setLastTeamName(team.name);
          }
        }
      }
    } catch (error) {
      console.error('Error loading last selection names:', error);
    } finally {
      setLoadingLastSelection(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setErrors({});
    const validation = profileSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
    });

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
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          remember_last_selection: rememberLastSelection,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const displayName = [firstName, lastName].filter(Boolean).join(' ');
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: displayName || null,
        }
      });

      if (authError) throw authError;

      toast({
        title: "Profil aktualisiert",
        description: "Ihre Änderungen wurden gespeichert.",
      });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Persönliche Informationen</CardTitle>
        <CardDescription>
          Aktualisieren Sie Ihre persönlichen Daten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Die E-Mail-Adresse kann nicht geändert werden
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Vorname</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Max"
              className={errors.first_name ? 'border-destructive' : ''}
            />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Nachname</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Mustermann"
              className={errors.last_name ? 'border-destructive' : ''}
            />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name}</p>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Wizard-Einstellungen</Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember-selection" 
                checked={rememberLastSelection}
                onCheckedChange={(checked) => setRememberLastSelection(checked as boolean)}
              />
              <Label htmlFor="remember-selection" className="text-sm cursor-pointer">
                Letzte Auswahl merken
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Wenn aktiviert, wird Ihre letzte Club- und Teamauswahl im Wizard gespeichert.
            </p>
            
            {rememberLastSelection && (lastSport || lastClubName || lastTeamName) && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Gespeicherte Auswahl:</p>
                {loadingLastSelection ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Lade...
                  </div>
                ) : (
                  <div className="space-y-1 text-sm">
                    {lastSport && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Sportart:</span>
                        <span className="font-medium">{lastSport}</span>
                      </div>
                    )}
                    {lastClubName && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Club:</span>
                        <span className="font-medium">{lastClubName}</span>
                      </div>
                    )}
                    {lastTeamName && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Team:</span>
                        <span className="font-medium">{lastTeamName}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Profil speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
