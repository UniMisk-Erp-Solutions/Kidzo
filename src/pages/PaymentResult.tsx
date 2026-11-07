import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type Payment = {
  status: string;
  kind: "subscription" | "book";
  amount: number;
  failure_message: string | null;
  book_order_id: string | null;
};

const POLL_MS = 4000;
const POLL_LIMIT = 30; // ~2 minutes, then we stop and reassure

/** Where CCAvenue sends the customer back to. The payment itself is settled server-side by ccavenue-callback. */
const PaymentResult = () => {
  const [params] = useSearchParams();
  const orderId = params.get("order");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);
  const [missing, setMissing] = useState(!orderId);
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let alive = true;
    (async () => {
      // ccavenue_payments is not in the generated types yet; RLS limits rows to the signed-in user.
      const { data } = await (supabase as any)
        .from("ccavenue_payments")
        .select("status, kind, amount, failure_message, book_order_id")
        .eq("order_id", orderId)
        .maybeSingle();
      if (!alive) return;
      if (!data) return setMissing(true);
      setPayment(data as Payment);
      if (data.kind === "book" && data.book_order_id) {
        const { data: bo } = await supabase.from("book_orders").select("user_book_id").eq("id", data.book_order_id).maybeSingle();
        if (alive) setBookId(bo?.user_book_id ?? null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orderId, polls]);

  const status = payment?.status;
  const waiting = status === "created" || status === "pending";
  useEffect(() => {
    if (!waiting || polls >= POLL_LIMIT) return;
    const t = setTimeout(() => setPolls((n) => n + 1), POLL_MS);
    return () => clearTimeout(t);
  }, [waiting, polls]);

  const retry = payment?.kind === "book" && bookId ? `/books/${bookId}/checkout` : "/pricing-plans";
  const done = payment?.kind === "book" && bookId ? `/books/${bookId}/confirmation` : "/billing";

  let icon = <Loader2 className="h-7 w-7 animate-spin text-primary-deep" />;
  let tone = "bg-primary/15";
  let title = "Confirming your payment…";
  let text = "Please don't close this page or pay again — this usually takes a few seconds.";
  let actions = null as React.ReactNode;

  if (missing) {
    icon = <AlertTriangle className="h-7 w-7 text-amber-700" />;
    tone = "bg-amber-100";
    title = "We couldn't find that payment";
    text = "If money was deducted from your account, it will be reversed by your bank, or write to us and we'll sort it out.";
    actions = <Button asChild variant="warm"><Link to="/pricing-plans">Back to plans</Link></Button>;
  } else if (status === "success") {
    icon = <CheckCircle2 className="h-7 w-7 text-emerald-700" />;
    tone = "bg-emerald-100";
    title = "Payment successful 🎉";
    text = payment!.kind === "book" ? "Your order is placed — we'll email you when it ships." : "Your plan is now active.";
    actions = (
      <>
        <Button asChild variant="warm"><Link to={done}>{payment!.kind === "book" ? "View order" : "View billing"}</Link></Button>
        <Button asChild variant="outline"><Link to="/home">Back to home</Link></Button>
      </>
    );
  } else if (status === "failure") {
    icon = <XCircle className="h-7 w-7 text-destructive" />;
    tone = "bg-destructive/10";
    title = "Payment failed";
    text = payment!.failure_message || "Your bank declined the payment, so you haven't been charged. You can try again.";
    actions = <Button asChild variant="warm"><Link to={retry}>Try again</Link></Button>;
  } else if (status === "cancelled") {
    icon = <XCircle className="h-7 w-7 text-muted-foreground" />;
    tone = "bg-muted";
    title = "Payment cancelled";
    text = "You cancelled the payment, so nothing was charged. You can pick up where you left off.";
    actions = <Button asChild variant="warm"><Link to={retry}>Try again</Link></Button>;
  } else if (status === "amount_mismatch" || status === "refunded") {
    icon = <AlertTriangle className="h-7 w-7 text-amber-700" />;
    tone = "bg-amber-100";
    title = "We're reviewing this payment";
    text = "Something about this payment needs a quick manual check. Please write to us with your order reference and we'll sort it out.";
  } else if (waiting && polls >= POLL_LIMIT) {
    icon = <Clock className="h-7 w-7 text-amber-700" />;
    tone = "bg-amber-100";
    title = "Still waiting for your bank";
    text = "Your bank hasn't confirmed yet. Don't pay again — if the payment goes through it will be applied, or reversed by your bank.";
    actions = <Button variant="outline" onClick={() => setPolls(0)}>Check again</Button>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm px-4 py-12">
      <Card className="w-full max-w-md p-8 text-center">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${tone}`}>{icon}</div>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        {orderId && <p className="mt-3 text-[11px] tracking-wider text-muted-foreground">Ref: {orderId}</p>}
        {actions && <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">{actions}</div>}
      </Card>
    </div>
  );
};

export default PaymentResult;
