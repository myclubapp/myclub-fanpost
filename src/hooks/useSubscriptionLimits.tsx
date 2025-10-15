import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';

interface SubscriptionLimits {
  max_teams: number;
  max_custom_templates: number;
  max_games_per_template: number;
  can_use_custom_templates: boolean;
  can_upload_logos: boolean;
}

export const useSubscriptionLimits = () => {
  const { tier } = useSubscription();

  const { data: limits, isLoading } = useQuery({
    queryKey: ['subscription-limits', tier],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_limits')
        .select('*')
        .eq('tier', tier)
        .single();

      if (error) throw error;
      return data as SubscriptionLimits;
    },
    enabled: !!tier,
  });

  return {
    limits,
    loading: isLoading,
    maxTeams: limits?.max_teams || 1,
    maxCustomTemplates: limits?.max_custom_templates || 0,
    maxGamesPerTemplate: limits?.max_games_per_template || 1,
    canUseCustomTemplates: limits?.can_use_custom_templates || false,
    canUploadLogos: limits?.can_upload_logos || false,
  };
};
