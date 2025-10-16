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

// Map Stripe product and price IDs to subscription tiers
const PRODUCT_TIER_MAP: Record<string, string> = {
  "prod_TFNoV8omJ5Wn3O": "amateur", // Amateur Monthly (CHF 6.90)
  "prod_TFNoxECDtYR86W": "amateur", // Amateur Yearly (CHF 66.00)
  "prod_TFNobiA1WLMLOC": "pro",     // Pro Monthly (CHF 15.00)
  "prod_TFNoinvv7sn1fo": "pro",     // Pro Yearly (CHF 144.00)
  "prod_TFNoVEWgwZIZaW": "premium", // Premium Monthly (CHF 30.00)
  "prod_TFNo1hArrAfVc7": "premium", // Premium Yearly (CHF 288.00)
};

const PRICE_TIER_MAP: Record<string, string> = {
  // Amateur
  "price_1SIt38GSAgdOdkjUibu3LJtf": "amateur",
  "price_1SIt3CGSAgdOdkjUDitQ01mm": "amateur",
  // Pro
  "price_1SIt3GGSAgdOdkjUXJNvNa7j": "pro",
  "price_1SIt3GGSAgdOdkjUvIqxD2n1": "pro",
  // Premium
  "price_1SIt3HGSAgdOdkjUiURGlI67": "premium",
  "price_1SIt3HGSAgdOdkjUCP4AgG6c": "premium",
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
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, setting to free tier");
      
      // Update user_subscriptions to free tier
      await supabaseClient
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'free',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          stripe_product_id: null,
          subscription_end: null,
        });

      // Sync user role to free_user
      await supabaseClient
        .from('user_roles')
        .update({ role: 'free_user' })
        .eq('user_id', user.id);

      return new Response(JSON.stringify({
        subscribed: false,
        tier: 'free',
        subscription_end: null 
      }), {
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
    let tier = 'free';
    let subscriptionEnd = null;
    let stripeProductId = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      
      // Log raw subscription data for debugging
      logStep("Raw subscription data", { 
        current_period_end: subscription.current_period_end,
        current_period_end_type: typeof subscription.current_period_end 
      });
      
      // Safely handle subscription end date
      if (subscription.current_period_end) {
        try {
          const timestamp = Number(subscription.current_period_end);
          subscriptionEnd = new Date(timestamp * 1000).toISOString();
          logStep("Successfully parsed subscription end date", { 
            timestamp, 
            subscriptionEnd 
          });
        } catch (error) {
          logStep("Error parsing subscription end date", { 
            error: String(error),
            current_period_end: subscription.current_period_end 
          });
          subscriptionEnd = null;
        }
      } else {
        logStep("No current_period_end found in subscription");
      }
      
      const priceId = subscription.items.data[0].price.id as string;
      stripeProductId = subscription.items.data[0].price.product as string;

      // Determine tier preferring price mapping, fallback to product mapping
      tier = PRICE_TIER_MAP[priceId] || PRODUCT_TIER_MAP[stripeProductId] || 'free';
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id,
        productId: stripeProductId,
        priceId,
        tier,
        endDate: subscriptionEnd 
      });
    } else {
      logStep("No active subscription found");
      tier = 'free';
    }

    // Update user_subscriptions table
    await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        tier: tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_product_id: stripeProductId,
        subscription_end: subscriptionEnd,
      });

    logStep("Updated user subscription", { tier });

    // Sync user role based on subscription tier
    const newRole = (tier === 'free') ? 'free_user' : 'paid_user';
    logStep("Syncing user role", { newRole, tier });

    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', user.id);

    if (roleError) {
      logStep("ERROR updating user_roles", { error: roleError.message });
    } else {
      logStep("Successfully synced user role");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier: tier,
      subscription_end: subscriptionEnd,
      product_id: stripeProductId
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