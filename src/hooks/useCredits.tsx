import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UserCredits {
  credits_remaining: number;
  credits_purchased: number;
  last_reset_date: string;
}

export const useCredits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: credits, isLoading: loading } = useQuery({
    queryKey: ['credits', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_remaining, credits_purchased, last_reset_date')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as UserCredits;
    },
    enabled: !!user,
  });

  const consumeCredit = async (gameUrl?: string, templateInfo?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('consume_credit', {
        p_user_id: user.id,
        p_game_url: gameUrl || null,
        p_template_info: templateInfo || null
      });

      if (error) throw error;

      if (data) {
        // Invalidate and refetch credits
        await queryClient.invalidateQueries({ queryKey: ['credits', user.id] });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error consuming credit:', error);
      return false;
    }
  };

  const refetchCredits = async () => {
    await queryClient.invalidateQueries({ queryKey: ['credits', user?.id] });
  };

  const hasCredits = credits ? credits.credits_remaining > 0 : false;

  return {
    credits,
    loading,
    hasCredits,
    consumeCredit,
    refetchCredits
  };
};
