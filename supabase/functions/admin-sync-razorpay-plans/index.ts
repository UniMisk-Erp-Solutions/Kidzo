// Super-admin only. When a plan's price changes, (re)create the Razorpay plans
// for that plan's cycles and repoint app_settings.razorpay_plans[mode] so NEW
// subscriptions bill the new price. (Razorpay plan amounts are immutable, so a
// price change = a new Razorpay plan; existing subscriptions keep their price.)
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
    const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!KEY_ID || !KEY_SECRET) return json({ error: "Razorpay keys not configured" }, 500);
    const mode = KEY_ID.startsWith("rzp_live_") ? "live" : "test";

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: ud } = await userClient.auth.getUser();
    if (!ud?.user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: role } = await admin.from("user_roles")
      .select("role").eq("user_id", ud.user.id).eq("role", "super_admin").maybeSingle();
    if (!role) return json({ error: "Forbidden — super admin only" }, 403);

    const { plan_slug } = await req.json().catch(() => ({}));
    if (!plan_slug || plan_slug === "free") return json({ error: "Nothing to sync for this plan" }, 400);

    const { data: plan } = await admin.from("plans")
      .select("slug, name, price_monthly, price_yearly, currency").eq("slug", plan_slug).maybeSingle();
    if (!plan) return json({ error: "Plan not found" }, 404);

    const auth = "Basic " + btoa(`${KEY_ID}:${KEY_SECRET}`);
    const currency = plan.currency || "INR";
    const created: Record<string, string> = {};
    const mk = async (cycle: "monthly" | "yearly", amount: number) => {
      if (!amount || amount <= 0) return;
      const res = await fetch("https://api.razorpay.com/v1/plans", {
        method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({
          period: cycle, interval: 1,
          item: { name: `${plan.name} (${cycle})`, amount: Math.round(amount * 100), currency },
        }),
      });
      const p = await res.json();
      if (!res.ok) throw new Error(p?.error?.description || `Razorpay plan create failed (${cycle})`);
      created[`${plan.slug}_${cycle}`] = p.id;
    };
    await mk("monthly", Number(plan.price_monthly));
    await mk("yearly", Number(plan.price_yearly));

    // merge into app_settings.razorpay_plans[mode]
    const { data: setting } = await admin.from("app_settings").select("value").eq("key", "razorpay_plans").maybeSingle();
    const value = (setting?.value as any) ?? { test: {}, live: {} };
    value[mode] = { ...(value[mode] ?? {}), ...created };
    await admin.from("app_settings").upsert({ key: "razorpay_plans", value }, { onConflict: "key" });

    return json({ ok: true, mode, created });
  } catch (err) {
    console.error("admin-sync-razorpay-plans error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
