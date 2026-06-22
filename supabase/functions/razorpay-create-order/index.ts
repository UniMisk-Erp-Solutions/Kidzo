// Creates a Razorpay order for the chosen plan + billing cycle.
// SECURITY: the amount is computed on the server from the `plans` table — the
// client only sends the plan slug + cycle, never a price.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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

    // Identify caller from JWT.
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);
    const user = userData.user;

    const { plan_slug, cycle, coupon_code } = await req.json().catch(() => ({}));
    const billingCycle = cycle === "yearly" ? "yearly" : "monthly";
    if (!plan_slug) return json({ error: "plan_slug required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Server-side price lookup.
    const { data: plan, error: planErr } = await admin
      .from("plans")
      .select("id, slug, name, price_monthly, price_yearly, currency, is_active")
      .eq("slug", plan_slug)
      .maybeSingle();
    if (planErr || !plan) return json({ error: "Plan not found" }, 404);
    if (!plan.is_active) return json({ error: "Plan not available" }, 400);

    const baseAmount = Number(billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly);
    if (!baseAmount || baseAmount <= 0) return json({ error: "This plan is free — no payment needed" }, 400);
    const currency = plan.currency || "INR";

    // Optional coupon: re-validate server-side (never trust the client's discounted price).
    let amount = baseAmount;
    let couponId: string | null = null;
    let discountAmount = 0;
    if (coupon_code) {
      const { data: quote, error: qErr } = await admin.rpc("coupon_quote", {
        p_code: coupon_code, p_user: user.id, p_plan_slug: plan.slug, p_cycle: billingCycle,
      });
      if (qErr) throw qErr;
      if (!quote?.valid) return json({ error: quote?.reason || "Invalid coupon" }, 400);
      amount = Number(quote.final_amount);
      discountAmount = Number(quote.discount_amount);
      couponId = quote.coupon_id;
    }
    const amountMinor = Math.round(amount * 100); // paise

    // 1) create a pending invoice (so we have a receipt id)
    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        amount,
        currency,
        status: "pending",
        provider: "razorpay",
        billing_cycle: billingCycle,
        coupon_id: couponId,
        discount_amount: discountAmount,
        notes: couponId
          ? `Razorpay checkout — ${plan.name} (${billingCycle}) · coupon ${coupon_code}`
          : `Razorpay checkout — ${plan.name} (${billingCycle})`,
      })
      .select("id")
      .single();
    if (invErr) throw invErr;

    // 2) create the Razorpay order
    const auth = "Basic " + btoa(`${KEY_ID}:${KEY_SECRET}`);
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountMinor,
        currency,
        receipt: invoice.id,
        notes: { user_id: user.id, plan_slug: plan.slug, cycle: billingCycle, invoice_id: invoice.id },
      }),
    });
    const order = await orderRes.json();
    if (!orderRes.ok) {
      await admin.from("invoices").update({ status: "failed", notes: `Razorpay order error: ${JSON.stringify(order)}` }).eq("id", invoice.id);
      return json({ error: order?.error?.description || "Razorpay order failed" }, 502);
    }

    // 3) store the order id on the invoice
    await admin.from("invoices").update({ provider_order_id: order.id }).eq("id", invoice.id);

    return json({
      order_id: order.id,
      amount: amountMinor,
      currency,
      key_id: KEY_ID,
      invoice_id: invoice.id,
      plan_name: plan.name,
      prefill: { name: user.user_metadata?.full_name ?? "", email: user.email ?? "" },
    });
  } catch (err) {
    console.error("razorpay-create-order error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
