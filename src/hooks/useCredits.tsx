import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserCredits {
  credits_remaining: number;
  credits_purchased: number;
  last_reset_date: string;
}

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_remaining, credits_purchased, last_reset_date')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCredits(data);
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  const consumeCredit = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('consume_credit', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data) {
        // Refresh credits after consuming
        await fetchCredits();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error consuming credit:', error);
      return false;
    }
  };

  const hasCredits = credits ? credits.credits_remaining > 0 : false;

  return {
    credits,
    loading,
    hasCredits,
    consumeCredit,
    refetchCredits: fetchCredits
  };
};
