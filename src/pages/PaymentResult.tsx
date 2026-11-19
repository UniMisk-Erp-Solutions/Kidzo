import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePaymentResult, type PaymentRecord } from "@/hooks/usePaymentResult";

type View = { icon: ReactNode; tone: string; title: string; text: string; actions?: ReactNode };
type Ctx = { payment: PaymentRecord; retry: string; done: string; recheck: () => void };

const LINK = (to: string, label: string, variant: "warm" | "outline" = "warm") => (
  <Button asChild variant={variant}>
    <Link to={to}>{label}</Link>
  </Button>
);

const WAITING: View = {
  icon: <Loader2 className="h-7 w-7 animate-spin text-primary-deep" />,
  tone: "bg-primary/15",
  title: "Confirming your payment…",
  text: "Please don't close this page or pay again — this usually takes a few seconds.",
};

const NOT_FOUND: View = {
  icon: <AlertTriangle className="h-7 w-7 text-amber-700" />,
  tone: "bg-amber-100",
  title: "We couldn't find that payment",
  text: "If money was deducted from your account, it will be reversed by your bank, or write to us and we'll sort it out.",
  actions: LINK("/pricing-plans", "Back to plans"),
};

const REVIEW: View = {
  icon: <AlertTriangle className="h-7 w-7 text-amber-700" />,
  tone: "bg-amber-100",
  title: "We're reviewing this payment",
  text: "Something about this payment needs a quick manual check. Please write to us with your order reference and we'll sort it out.",
};

/** One entry per payment status the customer can land on. */
const BY_STATUS: Record<string, (c: Ctx) => View> = {
  success: ({ payment, done }) => ({
    icon: <CheckCircle2 className="h-7 w-7 text-emerald-700" />,
    tone: "bg-emerald-100",
    title: "Payment successful 🎉",
    text: payment.kind === "book" ? "Your order is placed — we'll email you when it ships." : "Your plan is now active.",
    actions: (
      <>
        {LINK(done, payment.kind === "book" ? "View order" : "View billing")}
        {LINK("/home", "Back to home", "outline")}
      </>
    ),
  }),
  failure: ({ payment, retry }) => ({
    icon: <XCircle className="h-7 w-7 text-destructive" />,
    tone: "bg-destructive/10",
    title: "Payment failed",
    text: payment.failure_message || "Your bank declined the payment, so you haven't been charged. You can try again.",
    actions: LINK(retry, "Try again"),
  }),
  cancelled: ({ retry }) => ({
    icon: <XCircle className="h-7 w-7 text-muted-foreground" />,
    tone: "bg-muted",
    title: "Payment cancelled",
    text: "You cancelled the payment, so nothing was charged. You can pick up where you left off.",
    actions: LINK(retry, "Try again"),
  }),
  amount_mismatch: () => REVIEW,
  refunded: () => REVIEW,
};

const gaveUpView = ({ recheck }: Ctx): View => ({
  icon: <Clock className="h-7 w-7 text-amber-700" />,
  tone: "bg-amber-100",
  title: "Still waiting for your bank",
  text: "Your bank hasn't confirmed yet. Don't pay again — if the payment goes through it will be applied, or reversed by your bank.",
  actions: (
    <Button variant="outline" onClick={recheck}>
      Check again
    </Button>
  ),
});

const viewFor = (ctx: Ctx, gaveUp: boolean): View => {
  const build = BY_STATUS[ctx.payment.status];
  if (build) return build(ctx);
  return gaveUp ? gaveUpView(ctx) : WAITING;
};

/** Where CCAvenue sends the customer back to. The payment itself is settled server-side by ccavenue-callback. */
const PaymentResult = () => {
  const orderId = useSearchParams()[0].get("order");
  const { payment, bookId, missing, gaveUp, recheck } = usePaymentResult(orderId);

  const isBook = payment?.kind === "book" && !!bookId;
  const view: View = missing
    ? NOT_FOUND
    : payment
      ? viewFor(
          {
            payment,
            recheck,
            retry: isBook ? `/books/${bookId}/checkout` : "/pricing-plans",
            done: isBook ? `/books/${bookId}/confirmation` : "/billing",
          },
          gaveUp,
        )
      : WAITING;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm px-4 py-12">
      <Card className="w-full max-w-md p-8 text-center">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${view.tone}`}>{view.icon}</div>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">{view.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{view.text}</p>
        {orderId && <p className="mt-3 text-[11px] tracking-wider text-muted-foreground">Ref: {orderId}</p>}
        {view.actions && <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">{view.actions}</div>}
      </Card>
    </div>
  );
};

export default PaymentResult;
