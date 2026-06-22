// Creates a Razorpay SUBSCRIPTION (recurring) for the chosen plan + cycle.
// The Razorpay plan id is looked up server-side from app_settings (mode-aware).
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
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);
    const user = userData.user;

    const { plan_slug, cycle } = await req.json().catch(() => ({}));
    const billingCycle = cycle === "yearly" ? "yearly" : "monthly";
    if (!plan_slug) return json({ error: "plan_slug required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: plan } = await admin
      .from("plans").select("id, slug, name, price_monthly, price_yearly, currency, is_active")
      .eq("slug", plan_slug).maybeSingle();
    if (!plan || !plan.is_active) return json({ error: "Plan not available" }, 404);

    const amount = Number(billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly);
    if (!amount || amount <= 0) return json({ error: "This plan is free — no payment needed" }, 400);

    // Look up the Razorpay plan id (mode-aware) from app_settings.
    const { data: setting } = await admin.from("app_settings").select("value").eq("key", "razorpay_plans").maybeSingle();
    const map = (setting?.value as any)?.[mode] ?? {};
    const rzpPlanId = map[`${plan.slug}_${billingCycle}`];
    if (!rzpPlanId) {
      return json({ error: `No Razorpay ${mode} plan configured for ${plan.slug}/${billingCycle}. Create the plan and add its id to app_settings.razorpay_plans.${mode}.` }, 400);
    }

    const totalCount = billingCycle === "yearly" ? 10 : 120; // ~10 years of cycles

    // 1) pending invoice (carries the intended plan + cycle; provider_order_id holds the subscription id)
    const { data: invoice, error: invErr } = await admin.from("invoices").insert({
      user_id: user.id, plan_id: plan.id, amount, currency: plan.currency || "INR",
      status: "pending", provider: "razorpay", billing_cycle: billingCycle,
      notes: `Razorpay subscription — ${plan.name} (${billingCycle})`,
    }).select("id").single();
    if (invErr) throw invErr;

    // 2) create the Razorpay subscription
    const auth = "Basic " + btoa(`${KEY_ID}:${KEY_SECRET}`);
    const subRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: rzpPlanId,
        total_count: totalCount,
        customer_notify: 1,
        notes: { user_id: user.id, plan_slug: plan.slug, cycle: billingCycle, invoice_id: invoice.id },
      }),
    });
    const sub = await subRes.json();
    if (!subRes.ok) {
      await admin.from("invoices").update({ status: "failed", notes: `Razorpay subscription error: ${JSON.stringify(sub)}` }).eq("id", invoice.id);
      return json({ error: sub?.error?.description || "Could not create subscription" }, 502);
    }

    // 3) store the subscription id on the invoice
    await admin.from("invoices").update({ provider_order_id: sub.id }).eq("id", invoice.id);

    return json({
      subscription_id: sub.id,
      key_id: KEY_ID,
      invoice_id: invoice.id,
      plan_name: plan.name,
      amount, currency: plan.currency || "INR", cycle: billingCycle,
      prefill: { name: user.user_metadata?.full_name ?? "", email: user.email ?? "" },
    });
  } catch (err) {
    console.error("razorpay-create-subscription error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
