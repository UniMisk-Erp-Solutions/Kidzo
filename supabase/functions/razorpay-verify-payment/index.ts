// Verifies a Razorpay payment signature and activates the user's plan instantly.
// Two modes:
//   - Subscription: HMAC(razorpay_payment_id + "|" + razorpay_subscription_id) -> recurring
//   - One-time order: HMAC(razorpay_order_id + "|" + razorpay_payment_id)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!KEY_SECRET) return json({ error: "Razorpay keys not configured" }, 500);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);
    const user = userData.user;

    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpay_subscription_id, invoice_id,
    } = await req.json().catch(() => ({}));
    if (!razorpay_payment_id || !razorpay_signature) return json({ error: "Missing payment fields" }, 400);

    const isSubscription = !!razorpay_subscription_id;
    const message = isSubscription
      ? `${razorpay_payment_id}|${razorpay_subscription_id}`
      : `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = await hmacHex(KEY_SECRET, message);
    if (expected !== razorpay_signature) return json({ error: "Invalid payment signature" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .select("id, user_id, plan_id, billing_cycle, provider_order_id, status")
      .eq("id", invoice_id).maybeSingle();
    if (invErr || !invoice) return json({ error: "Invoice not found" }, 404);
    if (invoice.user_id !== user.id) return json({ error: "Invoice does not belong to you" }, 403);

    if (isSubscription) {
      const { error } = await admin.rpc("activate_subscription_v2", {
        p_user: invoice.user_id, p_plan: invoice.plan_id, p_cycle: invoice.billing_cycle ?? "monthly",
        p_invoice: invoice.id, p_payment_id: razorpay_payment_id, p_sub_id: razorpay_subscription_id,
      });
      if (error) throw error;
    } else {
      if (invoice.provider_order_id && invoice.provider_order_id !== razorpay_order_id) {
        return json({ error: "Order mismatch" }, 400);
      }
      const { error } = await admin.rpc("activate_paid_subscription", {
        p_user: invoice.user_id, p_plan: invoice.plan_id, p_cycle: invoice.billing_cycle ?? "monthly",
        p_invoice: invoice.id, p_payment_id: razorpay_payment_id,
      });
      if (error) throw error;
    }

    const { data: plan } = await admin.from("plans").select("slug, name").eq("id", invoice.plan_id).maybeSingle();
    return json({ ok: true, recurring: isSubscription, plan_slug: plan?.slug ?? null, plan_name: plan?.name ?? null });
  } catch (err) {
    console.error("razorpay-verify-payment error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
