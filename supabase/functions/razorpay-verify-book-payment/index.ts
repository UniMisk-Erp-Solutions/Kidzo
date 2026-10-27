// Verifies the Razorpay signature for a printed-book payment and marks the order paid.
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, book_order_id } =
      await req.json().catch(() => ({}));
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !book_order_id) {
      return json({ error: "Missing payment fields" }, 400);
    }

    const expected = await hmacHex(KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (expected !== razorpay_signature) return json({ error: "Invalid payment signature" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: order } = await admin
      .from("book_orders")
      .select("id, user_book_id, razorpay_order_id, cost_breakdown")
      .eq("id", book_order_id).maybeSingle();
    if (!order) return json({ error: "Order not found" }, 404);
    if (order.razorpay_order_id !== razorpay_order_id) return json({ error: "Order mismatch" }, 400);

    const { data: book } = await admin
      .from("user_books").select("id, parent_id").eq("id", order.user_book_id).maybeSingle();
    if (!book || book.parent_id !== user.id) return json({ error: "Order does not belong to you" }, 403);

    const { error } = await admin.rpc("mark_book_order_paid", {
      p_razorpay_order: razorpay_order_id,
      p_payment: razorpay_payment_id,
      p_amount: (order.cost_breakdown as { total?: number } | null)?.total ?? null,
    });
    if (error) throw error;

    return json({ ok: true, user_book_id: order.user_book_id });
  } catch (err) {
    console.error("razorpay-verify-book-payment error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
