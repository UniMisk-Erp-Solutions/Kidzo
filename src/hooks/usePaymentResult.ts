import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentKind = "subscription" | "book";

export type PaymentRecord = {
  status: string;
  kind: PaymentKind;
  amount: number;
  failure_message: string | null;
  book_order_id: string | null;
};

const POLL_MS = 4000;
/** About 2 minutes of checking, then we stop and reassure the customer. */
export const POLL_LIMIT = 30;

const isWaiting = (status?: string) => status === "created" || status === "pending";

async function loadPayment(orderId: string): Promise<PaymentRecord | null> {
  // RLS limits rows to the signed-in customer.
  const { data } = await supabase
    .from("ccavenue_payments")
    .select("status, kind, amount, failure_message, book_order_id")
    .eq("order_id", orderId)
    .maybeSingle();
  return data ? { ...data, kind: data.kind as PaymentKind } : null;
}

async function loadBookId(bookOrderId: string): Promise<string | null> {
  const { data } = await supabase.from("book_orders").select("user_book_id").eq("id", bookOrderId).maybeSingle();
  return data?.user_book_id ?? null;
}

type Loaded = { payment: PaymentRecord; bookId: string | null };

/** The payment, plus which book it was for when it was a book order. Null when there is no such payment. */
async function fetchRecord(orderId: string): Promise<Loaded | null> {
  const payment = await loadPayment(orderId);
  if (!payment) return null;
  const bookId = payment.kind === "book" && payment.book_order_id ? await loadBookId(payment.book_order_id) : null;
  return { payment, bookId };
}

/** Reads one CCAvenue payment and keeps re-reading it while the bank is still confirming. */
export function usePaymentResult(orderId: string | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [missing, setMissing] = useState(!orderId);
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let alive = true;
    void fetchRecord(orderId).then((r) => {
      if (!alive) return;
      if (r) setLoaded(r);
      else setMissing(true);
    });
    return () => {
      alive = false;
    };
  }, [orderId, ticks]);

  const waiting = isWaiting(loaded?.payment.status);
  useEffect(() => {
    if (!waiting || ticks >= POLL_LIMIT) return;
    const t = setTimeout(() => setTicks((n) => n + 1), POLL_MS);
    return () => clearTimeout(t);
  }, [waiting, ticks]);

  return {
    payment: loaded?.payment ?? null,
    bookId: loaded?.bookId ?? null,
    missing,
    gaveUp: waiting && ticks >= POLL_LIMIT,
    recheck: () => setTicks(0),
  };
}
