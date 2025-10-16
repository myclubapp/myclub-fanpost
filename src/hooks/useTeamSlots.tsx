import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscriptionLimits } from './useSubscriptionLimits';
import { useToast } from './use-toast';

interface TeamSlot {
  id: string;
  team_id: string;
  team_name: string | null;
  sport: string | null;
  club_id: string | null;
  last_changed_at: string;
}

export const useTeamSlots = () => {
  const { user } = useAuth();
  const { maxTeams } = useSubscriptionLimits();
  const { toast } = useToast();
  const [teamSlots, setTeamSlots] = useState<TeamSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeamSlots = async () => {
    if (!user) {
      setTeamSlots([]);
      setLoading(false);
      return;
    }
    
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
      console.error('Error loading team slots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamSlots();
  }, [user]);

  const isTeamInSlot = (teamId: string): boolean => {
    return teamSlots.some(slot => slot.team_id === teamId);
  };

  const canAddSlot = (): boolean => {
    return teamSlots.length < maxTeams;
  };

  const canChangeTeamSlot = async (teamId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('can_change_team_slot', {
        p_user_id: user.id,
        p_team_id: teamId
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking if team can be changed:', error);
      return false;
    }
  };

  const addTeamSlot = async (
    teamId: string,
    teamName: string,
    sport: string,
    clubId: string
  ): Promise<boolean> => {
    if (!user) return false;

    // Check if team is already in a slot
    if (isTeamInSlot(teamId)) {
      toast({
        title: 'Team bereits gespeichert',
        description: 'Dieses Team ist bereits in Ihren Slots gespeichert.',
      });
      return true; // Already exists, so return true
    }

    // Check if we can add more slots
    if (!canAddSlot()) {
      toast({
        title: 'Maximale Anzahl erreicht',
        description: `Du kannst maximal ${maxTeams} Team${maxTeams !== 1 ? 's' : ''} verwalten. Upgrade dein Abo für mehr Slots.`,
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_team_slots')
        .insert({
          user_id: user.id,
          team_id: teamId,
          team_name: teamName,
          sport: sport,
          club_id: clubId,
        });

      if (error) throw error;

      toast({
        title: 'Team gespeichert',
        description: 'Das Team wurde erfolgreich in Ihren Slots gespeichert.',
      });

      await loadTeamSlots();
      return true;
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getDaysUntilChange = (teamId: string): number => {
    const slot = teamSlots.find(s => s.team_id === teamId);
    if (!slot) return 0;

    const lastChange = new Date(slot.last_changed_at);
    const nextChangeDate = new Date(lastChange);
    nextChangeDate.setDate(nextChangeDate.getDate() + 7); // 1 week
    const now = new Date();
    const diffTime = nextChangeDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return {
    teamSlots,
    loading,
    isTeamInSlot,
    canAddSlot,
    canChangeTeamSlot,
    addTeamSlot,
    getDaysUntilChange,
    maxTeams,
    refreshSlots: loadTeamSlots,
  };
};
