// Returns an authoritative coupon quote for the logged-in user + plan + cycle.
// Used by the checkout UI to preview the discount. create-order re-validates too.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: ud } = await userClient.auth.getUser();
    if (!ud?.user) return json({ error: "Not authenticated" }, 401);

    const { code, plan_slug, cycle } = await req.json().catch(() => ({}));
    if (!code || !plan_slug) return json({ error: "code and plan_slug required" }, 400);
    const billingCycle = cycle === "yearly" ? "yearly" : "monthly";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data, error } = await admin.rpc("coupon_quote", {
      p_code: code, p_user: ud.user.id, p_plan_slug: plan_slug, p_cycle: billingCycle,
    });
    if (error) throw error;
    return json(data);
  } catch (err) {
    console.error("validate-coupon error", err);
    return json({ valid: false, reason: (err as Error).message }, 500);
  }
});
