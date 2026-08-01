import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

serve(async (req: Request) => {
  try {
    const payload = await req.json();

    // Only process INSERT events on donations
    if (payload.type !== "INSERT" || payload.table !== "donations") {
      return new Response("Not an insert event for donations", { status: 200 });
    }

    const donationId = payload.record.id;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase env vars.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Invoke the PostgreSQL function to generate matches
    const { data, error } = await supabase.rpc("generate_matches_for_donation", {
      p_donation_id: donationId,
    });

    if (error) {
      console.error("Error generating matches:", error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true, matchCount: data }), {
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
