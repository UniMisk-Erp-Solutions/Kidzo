// Starts a CCAvenue HOSTED checkout (full-page redirect, not an iframe).
//
// SECURITY
//  - The client sends only *what* it wants (plan slug + cycle, or book id + options + address).
//    The amount is ALWAYS computed here from the `plans` table / the book price list.
//  - The merchant id, access code and working key live only in this function's environment.
//    The browser receives just the encrypted request blob + access code (the gateway protocol).
//  - Each attempt gets a unique, unguessable merchant order id and a row in `ccavenue_payments`.
//  - Nothing is activated or confirmed here — that happens only after verified payment success.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  buildRequestPlaintext, cancelUrl, CcavConfigError, encrypt, formatAmount, generateOrderId,
  loadConfig, redirectUrl, type CcavConfig,
} from "../_shared/ccavenue.ts";
import { BINDING, hasValidOptions, parseAddress, priceBook, validQuantity } from "../_shared/bookPricing.ts";
import { corsHeaders, HttpError, json } from "../_shared/http.ts";

const MAX_ATTEMPTS_PER_10_MIN = 10;

type Admin = ReturnType<typeof createClient>;
type Target = {
  kind: "subscription" | "book";
  amount: number;
  invoiceId?: string;
  bookOrderId?: string;
  planId?: string;
  cycle?: string;
  billing: Record<string, string>;
};

async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new HttpError(401, "Missing authorization");
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, anon, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new HttpError(401, "Not authenticated");
  return data.user;
}

/** Refuses to stack payments while a previous one is still being confirmed, and caps attempt rate. */
async function guardAttempts(admin: Admin, userId: string, kind: string) {
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const { count } = await admin.from("ccavenue_payments").select("id", { count: "exact", head: true })
    .eq("user_id", userId).gte("created_at", since);
  if ((count ?? 0) >= MAX_ATTEMPTS_PER_10_MIN) throw new HttpError(429, "Too many payment attempts. Please wait a few minutes.");

  const hourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count: pending } = await admin.from("ccavenue_payments").select("id", { count: "exact", head: true })
    .eq("user_id", userId).eq("kind", kind).eq("status", "pending").gte("created_at", hourAgo);
  if ((pending ?? 0) > 0) {
    throw new HttpError(409, "A previous payment is still being confirmed by your bank. Please wait a minute and check again before paying again.");
  }
}

async function subscriptionTarget(admin: Admin, user: { id: string; email?: string; user_metadata?: Record<string, unknown> }, body: Record<string, unknown>): Promise<Target> {
  const planSlug = String(body.plan_slug ?? "");
  const cycle = body.cycle === "yearly" ? "yearly" : "monthly";
  if (!planSlug) throw new HttpError(400, "plan_slug required");

  const { data: plan } = await admin.from("plans")
    .select("id, slug, name, price_monthly, price_yearly, currency, is_active").eq("slug", planSlug).maybeSingle();
  if (!plan || !plan.is_active) throw new HttpError(404, "Plan not available");
  if ((plan.currency || "INR") !== "INR") throw new HttpError(400, "This plan can't be paid through CCAvenue");

  const base = Number(cycle === "yearly" ? plan.price_yearly : plan.price_monthly);
  if (!base || base <= 0) throw new HttpError(400, "This plan is free — no payment needed");

  // Optional coupon: re-validated on the server, never trusting a client-side discounted price.
  let amount = base, couponId: string | null = null, discount = 0;
  const couponCode = body.coupon_code ? String(body.coupon_code) : "";
  if (couponCode) {
    const { data: quote, error } = await admin.rpc("coupon_quote", {
      p_code: couponCode, p_user: user.id, p_plan_slug: plan.slug, p_cycle: cycle,
    });
    if (error) throw error;
    if (!quote?.valid) throw new HttpError(400, quote?.reason || "Invalid coupon");
    amount = Number(quote.final_amount);
    discount = Number(quote.discount_amount);
    couponId = quote.coupon_id;
  }
  if (!(amount > 0)) throw new HttpError(400, "Nothing to pay for this plan with that coupon");

  const { data: invoice, error } = await admin.from("invoices").insert({
    user_id: user.id, plan_id: plan.id, amount, currency: "INR", status: "pending", provider: "ccavenue",
    billing_cycle: cycle, coupon_id: couponId, discount_amount: discount,
    notes: `CCAvenue one-time payment — ${plan.name} (${cycle})${couponCode ? ` · coupon ${couponCode}` : ""}`,
  }).select("id").single();
  if (error) throw error;

  const meta = user.user_metadata ?? {};
  return {
    kind: "subscription", amount, invoiceId: invoice.id, planId: plan.id, cycle,
    billing: {
      billing_name: String(meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "Kidzopedia customer").slice(0, 60),
      billing_email: user.email ?? "",
      billing_country: "India",
    },
  };
}

async function bookTarget(admin: Admin, user: { id: string; email?: string }, body: Record<string, unknown>): Promise<Target> {
  const size = String(body.size ?? ""), paper = String(body.paper ?? ""), binding = String(body.binding ?? "");
  if (!body.user_book_id || !hasValidOptions({ size, paper, binding }) || !Object.hasOwn(BINDING, binding)) {
    throw new HttpError(400, "Invalid book options");
  }
  const { address, error: addrErr } = parseAddress(body.shipping_address as Record<string, unknown> | undefined);
  if (!address) throw new HttpError(400, addrErr!);

  // Only plans that include printed-book orders may buy (same rule as the Razorpay flow).
  const { data: sub } = await admin.from("user_subscriptions").select("plan_id").eq("user_id", user.id).maybeSingle();
  const { data: feat } = sub
    ? await admin.from("plan_features").select("value_bool").eq("plan_id", sub.plan_id).eq("key", "photo_book_orders").maybeSingle()
    : { data: null };
  if (feat?.value_bool !== true) throw new HttpError(403, "Upgrade to Family or Premium to order a printed book.");

  const { data: book } = await admin.from("user_books").select("id, parent_id, title").eq("id", body.user_book_id).maybeSingle();
  if (!book || book.parent_id !== user.id) throw new HttpError(404, "Book not found");

  const cost = priceBook({ size, paper, binding, quantity: validQuantity(body.quantity) });
  const { data: order, error } = await admin.from("book_orders").insert({
    user_book_id: book.id, status: "awaiting_payment", payment_status: "unpaid", payment_provider: "ccavenue",
    shipping_address: address, cost_breakdown: cost,
  }).select("id").single();
  if (error) throw error;

  return {
    kind: "book", amount: cost.total, bookOrderId: order.id,
    billing: {
      billing_name: address.name, billing_email: user.email ?? "", billing_tel: address.phone.replace(/[^\d]/g, "").slice(-10),
      billing_address: address.street, billing_city: address.city, billing_state: address.state,
      billing_zip: address.zip, billing_country: "India",
      delivery_name: address.name, delivery_address: address.street, delivery_city: address.city,
      delivery_state: address.state, delivery_zip: address.zip, delivery_country: "India", delivery_tel: address.phone.replace(/[^\d]/g, "").slice(-10),
    },
  };
}

/** Marks the rows we created as failed when the ledger insert (or anything after) goes wrong. */
async function abandon(admin: Admin, t: Target) {
  if (t.invoiceId) await admin.from("invoices").update({ status: "failed" }).eq("id", t.invoiceId);
  if (t.bookOrderId) await admin.from("book_orders").update({ status: "failed" }).eq("id", t.bookOrderId);
}

async function handle(req: Request): Promise<Response> {
  const get = (k: string) => Deno.env.get(k);
  let cfg: CcavConfig;
  try {
    cfg = loadConfig(get);
  } catch (e) {
    if (e instanceof CcavConfigError) {
      console.error("ccavenue-create-order config:", e.message);
      throw new HttpError(503, "CCAvenue payments are not available right now");
    }
    throw e;
  }

  const user = await authenticate(req);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const kind = body.kind === "book" ? "book" : body.kind === "subscription" ? "subscription" : null;
  if (!kind) throw new HttpError(400, "kind must be 'subscription' or 'book'");

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  await guardAttempts(admin, user.id, kind);

  const target = kind === "book" ? await bookTarget(admin, user, body) : await subscriptionTarget(admin, user, body);
  const orderId = generateOrderId();

  const { error: ledgerErr } = await admin.from("ccavenue_payments").insert({
    order_id: orderId, user_id: user.id, kind: target.kind, invoice_id: target.invoiceId ?? null,
    book_order_id: target.bookOrderId ?? null, plan_id: target.planId ?? null, billing_cycle: target.cycle ?? null,
    amount: target.amount, currency: "INR", status: "created",
  });
  if (ledgerErr) {
    await abandon(admin, target);
    throw ledgerErr;
  }
  if (target.invoiceId) await admin.from("invoices").update({ provider_order_id: orderId }).eq("id", target.invoiceId);

  const plain = buildRequestPlaintext({
    merchant_id: cfg.merchantId,
    order_id: orderId,
    currency: "INR",
    amount: formatAmount(target.amount),
    redirect_url: redirectUrl(cfg),
    cancel_url: cancelUrl(cfg),
    language: "EN",
    merchant_param1: target.kind,
    ...target.billing,
  });

  return json({
    order_id: orderId,
    action_url: cfg.initiateUrl,
    access_code: cfg.accessCode,
    enc_request: encrypt(plain, cfg.workingKey, cfg.mode),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    return await handle(req);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error("ccavenue-create-order error", err);
    return json({ error: "Could not start payment. Please try again." }, 500);
  }
});
