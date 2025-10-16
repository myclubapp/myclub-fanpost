import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'free' | 'amateur' | 'pro' | 'premium';

interface SubscriptionStatus {
  subscribed: boolean;
  tier: SubscriptionTier;
  subscription_end: string | null;
  product_id: string | null;
}

// Price IDs mapping
export const SUBSCRIPTION_PRICES = {
  amateur: {
    monthly: 'price_1SIszGKI9ikURwOt7wsvwcIU',
    yearly: 'price_1SIszJKI9ikURwOte5flDHEg',
  },
  pro: {
    monthly: 'price_1SIszLKI9ikURwOtiCgphLRN',
    yearly: 'price_1SIszLKI9ikURwOtijLekR6e',
  },
  premium: {
    monthly: 'price_1SIszMKI9ikURwOtq9qOzaiH',
    yearly: 'price_1SIszMKI9ikURwOteeKbjJri',
  },
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({ subscribed: false, tier: 'free', subscription_end: null, product_id: null });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    
    // Check subscription every minute
    const interval = setInterval(checkSubscription, 60000);
    
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const createCheckout = async (priceId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: priceId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      return null;
    }
  };

  return {
    subscription,
    loading,
    tier: subscription?.tier || 'free',
    isSubscribed: subscription?.subscribed || false,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
