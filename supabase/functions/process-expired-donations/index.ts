import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

serve(async (req: Request) => {
  try {
    // Only allow POST requests for scheduled functions (Supabase convention)
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase env vars.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Expire stale matches (via our existing RPC)
    const { data: expiredMatches, error: matchesError } = await supabase.rpc("expire_stale_matches");
    
    if (matchesError) {
      console.error("Error expiring matches:", matchesError);
      throw matchesError;
    }

    // 2. Expire old donations directly via the REST API
    // We update donations where use_before < NOW() and status == 'AVAILABLE'
    const nowISO = new Date().toISOString();
    const { data: expiredDonations, error: donationsError } = await supabase
      .from("donations")
      .update({ status: 'EXPIRED' })
      .lt("use_before", nowISO)
      .eq("status", "AVAILABLE")
      .select();

    if (donationsError) {
      console.error("Error expiring donations:", donationsError);
      throw donationsError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      expiredMatchCount: expiredMatches,
      expiredDonationCount: expiredDonations?.length || 0 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
