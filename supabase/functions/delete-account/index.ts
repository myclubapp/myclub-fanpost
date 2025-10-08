import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-ACCOUNT] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { confirmation } = await req.json();
    
    if (confirmation !== "DELETE") {
      return new Response(
        JSON.stringify({ error: "Invalid confirmation text" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    logStep("Confirmation validated");

    // Delete all user data in correct order
    // 1. Delete credit transactions
    const { error: transactionsError } = await supabaseClient
      .from('credit_transactions')
      .delete()
      .eq('user_id', user.id);

    if (transactionsError) {
      logStep("Error deleting credit transactions", { error: transactionsError.message });
    } else {
      logStep("Credit transactions deleted");
    }

    // 2. Delete templates
    const { error: templatesError } = await supabaseClient
      .from('templates')
      .delete()
      .eq('user_id', user.id);

    if (templatesError) {
      logStep("Error deleting templates", { error: templatesError.message });
    } else {
      logStep("Templates deleted");
    }

    // 3. Delete user credits
    const { error: creditsError } = await supabaseClient
      .from('user_credits')
      .delete()
      .eq('user_id', user.id);

    if (creditsError) {
      logStep("Error deleting user credits", { error: creditsError.message });
    } else {
      logStep("User credits deleted");
    }

    // 4. Delete user roles
    const { error: rolesError } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    if (rolesError) {
      logStep("Error deleting user roles", { error: rolesError.message });
    } else {
      logStep("User roles deleted");
    }

    // 5. Delete profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      logStep("Error deleting profile", { error: profileError.message });
    } else {
      logStep("Profile deleted");
    }

    // 6. Cancel Stripe subscriptions if any exist
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey && user.email) {
      try {
        logStep("Checking for Stripe subscriptions");
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        
        // Find customer by email
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          logStep("Found Stripe customer", { customerId });
          
          // Get all active subscriptions
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
          });
          
          // Cancel all active subscriptions
          for (const subscription of subscriptions.data) {
            await stripe.subscriptions.cancel(subscription.id);
            logStep("Cancelled Stripe subscription", { subscriptionId: subscription.id });
          }
          
          if (subscriptions.data.length > 0) {
            logStep("All Stripe subscriptions cancelled", { count: subscriptions.data.length });
          } else {
            logStep("No active Stripe subscriptions found");
          }
        } else {
          logStep("No Stripe customer found for this email");
        }
      } catch (stripeError) {
        logStep("Error handling Stripe subscriptions", { 
          error: stripeError instanceof Error ? stripeError.message : String(stripeError) 
        });
        // Don't throw - we still want to delete the account even if Stripe fails
      }
    }

    // 7. Finally delete the auth user
    const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      logStep("Error deleting auth user", { error: deleteUserError.message });
      throw new Error(`Failed to delete user: ${deleteUserError.message}`);
    }

    logStep("User account completely deleted");

    return new Response(
      JSON.stringify({ success: true, message: "Account successfully deleted" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in delete-account", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});