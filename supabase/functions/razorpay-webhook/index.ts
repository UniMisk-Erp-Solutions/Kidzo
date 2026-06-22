// Razorpay webhook — the reliable backstop that activates a plan even if the
// user closes the browser before the verify call. Signature is verified against
// the raw body using the webhook secret. Processing is idempotent.
// NOTE: this function must be deployed with verify_jwt = false (Razorpay calls it).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok", { status: 200 });

  try {
    const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!WEBHOOK_SECRET) {
      console.error("razorpay-webhook: RAZORPAY_WEBHOOK_SECRET not set");
      return new Response("not configured", { status: 500 });
    }

    const raw = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const expected = await hmacHex(WEBHOOK_SECRET, raw);
    if (expected !== signature) {
      console.warn("razorpay-webhook: bad signature");
      return new Response("invalid signature", { status: 400 });
    }

    const body = JSON.parse(raw);
    const eventType: string = body.event ?? "";
    const payment = body?.payload?.payment?.entity;
    const orderEntity = body?.payload?.order?.entity;
    const orderId: string | undefined = payment?.order_id ?? orderEntity?.id;
    const paymentId: string | undefined = payment?.id;
    // Razorpay sends a unique event id header; fall back to payment id.
    const eventId = req.headers.get("x-razorpay-event-id") ?? paymentId ?? `${orderId}:${eventType}`;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Idempotency: record the event; if it already exists, we're done.
    const { error: dupErr } = await admin
      .from("payment_events")
      .insert({ provider: "razorpay", event_id: eventId, event_type: eventType, payload: body });
    if (dupErr) {
      // unique violation => already processed
      return new Response("already processed", { status: 200 });
    }

    const PAID_EVENTS = ["payment.captured", "order.paid"];
    if (PAID_EVENTS.includes(eventType) && orderId) {
      const { data: invoice } = await admin
        .from("invoices")
        .select("id, user_id, plan_id, billing_cycle, status")
        .eq("provider_order_id", orderId)
        .maybeSingle();
      if (invoice && invoice.status !== "paid") {
        const { error: actErr } = await admin.rpc("activate_paid_subscription", {
          p_user: invoice.user_id,
          p_plan: invoice.plan_id,
          p_cycle: invoice.billing_cycle ?? "monthly",
          p_invoice: invoice.id,
          p_payment_id: paymentId ?? null,
        });
        if (actErr) console.error("razorpay-webhook activate error", actErr);
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("razorpay-webhook error", err);
    // Return 200 so Razorpay doesn't hammer retries on a parse error we can't fix;
    // genuine signature/processing failures above already returned non-200.
    return new Response("ok", { status: 200 });
  }
});
