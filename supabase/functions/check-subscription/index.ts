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

// Map Stripe product IDs to subscription tiers
const PRODUCT_TIER_MAP: Record<string, string> = {
  "prod_TEvmhiwsigA8wE": "amateur", // Amateur Monthly (CHF 6.90)
  "prod_TEvmFwrDTxQYrT": "amateur", // Amateur Yearly (CHF 66.00)
  "prod_TEvmWCaGHNS17q": "pro",     // Pro Monthly (CHF 15.00)
  "prod_TEvm1qgmfSNKDz": "pro",     // Pro Yearly (CHF 144.00)
  "prod_TEvmUk7MYUf9XQ": "premium", // Premium Monthly (CHF 30.00)
  "prod_TEvmj6Pr2p7wxV": "premium", // Premium Yearly (CHF 288.00)
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
      
      // Safely handle subscription end date
      if (subscription.current_period_end) {
        try {
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        } catch (error) {
          logStep("Error parsing subscription end date", { error: String(error) });
          subscriptionEnd = null;
        }
      }
      
      stripeProductId = subscription.items.data[0].price.product as string;
      tier = PRODUCT_TIER_MAP[stripeProductId] || 'free';
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id,
        productId: stripeProductId,
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