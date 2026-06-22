// Razorpay webhook — drives auto-renewal + activation backstop. Verifies the
// x-razorpay-signature against the raw body and processes events idempotently.
// Deploy with verify_jwt = false (Razorpay calls it server-to-server).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
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
    if (!WEBHOOK_SECRET) { console.error("razorpay-webhook: secret not set"); return new Response("not configured", { status: 500 }); }

    const raw = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    if ((await hmacHex(WEBHOOK_SECRET, raw)) !== signature) return new Response("invalid signature", { status: 400 });

    const body = JSON.parse(raw);
    const eventType: string = body.event ?? "";
    const payment = body?.payload?.payment?.entity;
    const orderEntity = body?.payload?.order?.entity;
    const subEntity = body?.payload?.subscription?.entity;
    const orderId: string | undefined = payment?.order_id ?? orderEntity?.id;
    const paymentId: string | undefined = payment?.id;
    const subId: string | undefined = subEntity?.id ?? payment?.subscription_id;
    const eventId = req.headers.get("x-razorpay-event-id") ?? `${subId ?? orderId ?? eventType}:${paymentId ?? ""}:${eventType}`;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Idempotency.
    const { error: dupErr } = await admin.from("payment_events")
      .insert({ provider: "razorpay", event_id: eventId, event_type: eventType, payload: body });
    if (dupErr) return new Response("already processed", { status: 200 });

    // ---- recurring subscription lifecycle ----
    if (subId && (eventType === "subscription.charged" || eventType === "subscription.activated")) {
      const amount = payment?.amount != null ? Number(payment.amount) / 100 : null;
      const { data: renewed } = await admin.rpc("renew_subscription", {
        p_sub_id: subId, p_payment_id: paymentId ?? null, p_amount: amount,
      });
      if (renewed === false) {
        // Not activated yet (user closed tab before verify) -> activate from the pending invoice.
        const { data: inv } = await admin.from("invoices")
          .select("id, user_id, plan_id, billing_cycle")
          .eq("provider_order_id", subId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (inv) {
          await admin.rpc("activate_subscription_v2", {
            p_user: inv.user_id, p_plan: inv.plan_id, p_cycle: inv.billing_cycle ?? "monthly",
            p_invoice: inv.id, p_payment_id: paymentId ?? null, p_sub_id: subId,
          });
        }
      }
    } else if (subId && eventType === "subscription.halted") {
      await admin.rpc("set_subscription_status", { p_sub_id: subId, p_status: "past_due", p_cancel_at_end: true });
    } else if (subId && eventType === "subscription.cancelled") {
      await admin.rpc("set_subscription_status", { p_sub_id: subId, p_status: "cancelled", p_cancel_at_end: true });
    } else if (subId && eventType === "subscription.completed") {
      await admin.rpc("set_subscription_status", { p_sub_id: subId, p_status: "completed", p_cancel_at_end: true });
    } else if (subId && eventType === "subscription.pending") {
      await admin.rpc("set_subscription_status", { p_sub_id: subId, p_status: "past_due", p_cancel_at_end: null });
    }

    // ---- one-time order backstop (legacy / non-recurring) ----
    else if ((eventType === "payment.captured" || eventType === "order.paid") && orderId) {
      const { data: invoice } = await admin.from("invoices")
        .select("id, user_id, plan_id, billing_cycle, status, coupon_id, discount_amount")
        .eq("provider_order_id", orderId).maybeSingle();
      if (invoice && invoice.status !== "paid") {
        await admin.rpc("activate_paid_subscription", {
          p_user: invoice.user_id, p_plan: invoice.plan_id, p_cycle: invoice.billing_cycle ?? "monthly",
          p_invoice: invoice.id, p_payment_id: paymentId ?? null,
        });
        if (invoice.coupon_id) {
          await admin.rpc("redeem_coupon", {
            p_coupon: invoice.coupon_id, p_user: invoice.user_id,
            p_invoice: invoice.id, p_amount: invoice.discount_amount ?? 0,
          });
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("razorpay-webhook error", err);
    return new Response("ok", { status: 200 });
  }
});
