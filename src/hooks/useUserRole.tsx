import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'free_user' | 'paid_user' | 'admin';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setRole(data.role as UserRole);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('free_user');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isPaidUser = role === 'paid_user' || role === 'admin';
  const isAdmin = role === 'admin';

  return { role, loading, isPaidUser, isAdmin };
};
