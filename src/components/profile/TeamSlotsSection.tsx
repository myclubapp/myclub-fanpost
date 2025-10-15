import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeamSlot {
  id: string;
  team_id: string;
  team_name: string | null;
  sport: string | null;
  club_id: string | null;
  last_changed_at: string;
}

export function TeamSlotsSection() {
  const { user } = useAuth();
  const { maxTeams, loading: limitsLoading } = useSubscriptionLimits();
  const { toast } = useToast();
  const [teamSlots, setTeamSlots] = useState<TeamSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTeamSlots();
    }
  }, [user]);

  const loadTeamSlots = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_team_slots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTeamSlots(data || []);
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

  const deleteTeamSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('user_team_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: 'Erfolg',
        description: 'Team-Slot gelöscht',
      });

      loadTeamSlots();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const canAddSlot = teamSlots.length < maxTeams;
  const daysUntilChange = (lastChangedAt: string) => {
    const lastChange = new Date(lastChangedAt);
    const nextChangeDate = new Date(lastChange);
    nextChangeDate.setDate(nextChangeDate.getDate() + 30);
    const now = new Date();
    const diffTime = nextChangeDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading || limitsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Meine Team-Slots</CardTitle>
            <CardDescription>
              Sie können bis zu {maxTeams} Team{maxTeams !== 1 ? 's' : ''} verwalten
            </CardDescription>
          </div>
          <Badge variant="outline">
            {teamSlots.length} / {maxTeams} verwendet
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canAddSlot && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
            Du hast das Maximum von 1 Team‑Slot erreicht. Um für weitere Teams zu exportieren, upgrade dein Abo oder lösche einen bestehenden Slot in deinem Profil.
            </AlertDescription>
          </Alert>
        )}

        {teamSlots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Keine Teams gespeichert. Teams werden automatisch hinzugefügt, wenn Sie sie im Studio verwenden.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teamSlots.map((slot) => {
              const days = daysUntilChange(slot.last_changed_at);
              return (
                <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{slot.team_name || 'Unbekanntes Team'}</div>
                    <div className="text-sm text-muted-foreground">
                      {slot.sport && <span className="capitalize">{slot.sport}</span>}
                      {days > 0 && (
                        <span className="ml-2">• Änderbar in {days} Tag{days !== 1 ? 'en' : ''}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTeamSlot(slot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
