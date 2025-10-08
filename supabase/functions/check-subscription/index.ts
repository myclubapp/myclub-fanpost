import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      
      // Safely handle subscription end date
      if (subscription.current_period_end) {
        try {
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        } catch (dateError) {
          logStep("Error parsing date", { error: String(dateError) });
        }
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Safely extract product ID
      if (subscription.items?.data?.[0]?.price?.product) {
        productId = String(subscription.items.data[0].price.product);
      }
      
      logStep("Determined subscription product", { productId });

      // Update user role to paid_user if they have active subscription
      const { data: roleData } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'paid_user' && roleData?.role !== 'admin') {
        logStep("Updating user role to paid_user (first time)");
        await supabaseClient
          .from('user_roles')
          .update({ role: 'paid_user' })
          .eq('user_id', user.id);
        
        // Only refill credits when upgrading to paid for the first time
        logStep("Initial credit refill for new paid user");
        await supabaseClient
          .from('user_credits')
          .update({ 
            credits_remaining: 10,
            credits_purchased: 0,
            last_reset_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        // Log the credit transaction
        await supabaseClient
          .from('credit_transactions')
          .insert({
            user_id: user.id,
            amount: 10,
            transaction_type: 'subscription_activated',
            description: 'Pro Abo aktiviert: +10 Credits'
          });
      } else if (roleData?.role === 'paid_user') {
        // For existing paid users, only refill credits if it's a new billing period
        // Check if subscription period has renewed since last credit reset
        const { data: creditsData } = await supabaseClient
          .from('user_credits')
          .select('last_reset_date')
          .eq('user_id', user.id)
          .single();
        
        if (creditsData && subscriptionEnd) {
          const lastResetDate = new Date(creditsData.last_reset_date);
          const subscriptionEndDate = new Date(subscriptionEnd);
          const currentDate = new Date();
          
          // Calculate subscription start (one month before end)
          const subscriptionStartDate = new Date(subscriptionEndDate);
          subscriptionStartDate.setMonth(subscriptionStartDate.getMonth() - 1);
          
          // Only refill if:
          // 1. Last reset was before the current billing period started
          // 2. We are currently within the billing period
          if (lastResetDate < subscriptionStartDate && currentDate >= subscriptionStartDate) {
            logStep("Refilling credits for new billing period", {
              lastReset: lastResetDate.toISOString(),
              periodStart: subscriptionStartDate.toISOString(),
              periodEnd: subscriptionEndDate.toISOString()
            });
            
            await supabaseClient
              .from('user_credits')
              .update({ 
                credits_remaining: 10,
                credits_purchased: 0,
                last_reset_date: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id);
            
            // Log the credit transaction
            await supabaseClient
              .from('credit_transactions')
              .insert({
                user_id: user.id,
                amount: 10,
                transaction_type: 'monthly_reset',
                description: 'Pro Abo erneuert: Credits aufgefüllt +10'
              });
          } else {
            logStep("No credit refill needed - not a new billing period", {
              lastReset: lastResetDate.toISOString(),
              periodStart: subscriptionStartDate.toISOString(),
              currentDate: currentDate.toISOString()
            });
          }
        }
      }
    } else {
      logStep("No active subscription found");
      
      // Update user role back to free_user if no active subscription
      const { data: roleData } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role === 'paid_user') {
        logStep("Updating user role to free_user");
        await supabaseClient
          .from('user_roles')
          .update({ role: 'free_user' })
          .eq('user_id', user.id);
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});