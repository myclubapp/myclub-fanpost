import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  const deleteTeamSlot = async (slotId: string, lastChangedAt: string) => {
    // Check if 7 days have passed
    const lastChange = new Date(lastChangedAt);
    const now = new Date();
    const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceChange < 7) {
      const daysRemaining = 7 - daysSinceChange;
      toast({
        title: 'Löschen nicht möglich',
        description: `Team-Slots können nur 1x pro Woche geändert werden. Du kannst diesen Slot in ${daysRemaining} Tag${daysRemaining !== 1 ? 'en' : ''} löschen.`,
        variant: 'destructive',
      });
      return;
    }

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
    nextChangeDate.setDate(nextChangeDate.getDate() + 7); // 7 days instead of 30
    const now = new Date();
    const diffTime = nextChangeDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const canDeleteSlot = (lastChangedAt: string) => {
    const lastChange = new Date(lastChangedAt);
    const now = new Date();
    const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceChange >= 7;
  };

  const handleTeamClick = (slot: TeamSlot) => {
    const params = new URLSearchParams();
    if (slot.sport) params.append('sport', slot.sport);
    if (slot.club_id) params.append('club', slot.club_id);
    if (slot.team_id) params.append('team', slot.team_id);
    
    navigate(`/studio?${params.toString()}`);
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
              Du kannst bis zu {maxTeams} Team{maxTeams !== 1 ? 's' : ''} verwalten
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
            <p>Keine Teams gespeichert. Teams werden automatisch hinzugefügt, wenn du sie im Studio verwendest.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teamSlots.map((slot) => {
              const days = daysUntilChange(slot.last_changed_at);
              const canDelete = canDeleteSlot(slot.last_changed_at);
              return (
                <div 
                  key={slot.id} 
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleTeamClick(slot)}
                >
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
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTeamSlot(slot.id, slot.last_changed_at);
                    }}
                    disabled={!canDelete}
                    title={!canDelete ? `Löschbar in ${days} Tag${days !== 1 ? 'en' : ''}` : 'Team-Slot löschen'}
                  >
                    <Trash2 className={`h-4 w-4 ${!canDelete ? 'opacity-50' : ''}`} />
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
