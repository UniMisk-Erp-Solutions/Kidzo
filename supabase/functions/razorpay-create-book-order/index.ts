// Creates a Razorpay order for a printed photo book.
// SECURITY: the amount is computed here on the server — the client only sends the book id,
// the options it chose and the shipping address, never a price. Keep PRICES in sync with
// src/lib/bookPricing.ts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SIZE: Record<string, number> = { "8x10": 1499, "10x12": 1999, "12x14": 2799 };
const PAPER: Record<string, number> = { matte: 0, glossy: 199, premium: 399 };
const BINDING: Record<string, number> = { soft: 0, hard: 599, leather: 1199 };
const SHIPPING = 99;
const TAX_RATE = 0.18; // GST (estimate)

const clean = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

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

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const { user_book_id, size, paper, binding } = body;
    const quantity = Math.min(10, Math.max(1, Math.floor(Number(body.quantity) || 1)));
    if (!user_book_id || !(size in SIZE) || !(paper in PAPER) || !(binding in BINDING)) {
      return json({ error: "Invalid book options" }, 400);
    }

    const a = body.shipping_address ?? {};
    const address = {
      name: clean(a.name, 100), phone: clean(a.phone, 20), street: clean(a.street, 250),
      city: clean(a.city, 100), state: clean(a.state, 100), zip: clean(a.zip, 10), country: "India",
    };
    if (!address.name || !address.street || !address.city || !address.state) {
      return json({ error: "Please complete your delivery address" }, 400);
    }
    if (!/^[1-9][0-9]{5}$/.test(address.zip)) return json({ error: "Enter a valid 6-digit PIN code" }, 400);
    if (!/^(\+?91)?[6-9][0-9]{9}$/.test(address.phone.replace(/[\s-]/g, ""))) {
      return json({ error: "Enter a valid 10-digit mobile number" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Only plans that include printed-book orders may buy (free plan can create + preview only).
    const { data: sub } = await admin
      .from("user_subscriptions").select("plan_id").eq("user_id", user.id).maybeSingle();
    const { data: feat } = sub
      ? await admin.from("plan_features").select("value_bool").eq("plan_id", sub.plan_id).eq("key", "photo_book_orders").maybeSingle()
      : { data: null };
    if (feat?.value_bool !== true) {
      return json({ error: "Upgrade to Family or Premium to order a printed book." }, 403);
    }

    // The caller must own the book.
    const { data: book } = await admin
      .from("user_books").select("id, parent_id, title").eq("id", user_book_id).maybeSingle();
    if (!book || book.parent_id !== user.id) return json({ error: "Book not found" }, 404);

    // Server-side price.
    const unit = SIZE[size] + PAPER[paper] + BINDING[binding];
    const subtotal = unit * quantity;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + SHIPPING + tax) * 100) / 100;
    const amountMinor = Math.round(total * 100); // paise

    // 1) pending order row (not yet paid)
    const { data: order, error: oErr } = await admin
      .from("book_orders")
      .insert({
        user_book_id: book.id,
        status: "awaiting_payment",
        payment_status: "unpaid",
        shipping_address: address,
        cost_breakdown: { size, paper, binding, quantity, unit, subtotal, shipping: SHIPPING, tax, total },
      })
      .select("id")
      .single();
    if (oErr) throw oErr;

    // 2) Razorpay order
    const auth = "Basic " + btoa(`${KEY_ID}:${KEY_SECRET}`);
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountMinor,
        currency: "INR",
        receipt: `book_${order.id}`.slice(0, 40),
        notes: { kind: "book", book_order_id: order.id, user_id: user.id, user_book_id: book.id },
      }),
    });
    const rzp = await rzpRes.json();
    if (!rzpRes.ok) {
      await admin.from("book_orders").update({ status: "failed" }).eq("id", order.id);
      return json({ error: rzp?.error?.description || "Razorpay order failed" }, 502);
    }
    await admin.from("book_orders").update({ razorpay_order_id: rzp.id }).eq("id", order.id);

    return json({
      order_id: rzp.id,
      book_order_id: order.id,
      amount: amountMinor,
      currency: "INR",
      key_id: KEY_ID,
      description: `Printed photo book — ${book.title ?? "Kidzopedia"}`,
      prefill: { name: address.name, email: user.email ?? "", contact: address.phone },
    });
  } catch (err) {
    console.error("razorpay-create-book-order error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
