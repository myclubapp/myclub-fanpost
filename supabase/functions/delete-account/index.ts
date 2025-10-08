import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

    // 6. Finally delete the auth user
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