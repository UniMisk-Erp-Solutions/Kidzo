import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, CheckCircle2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const RAZORPAY_SDK = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = RAZORPAY_SDK;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const Checkout = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const planSlug = params.get("plan");
  const cycle = (params.get("cycle") ?? "monthly") as "monthly" | "yearly";
  const [plan, setPlan] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponQuote, setCouponQuote] = useState<any>(null); // valid quote from validate-coupon
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (!planSlug) return;
    (async () => {
      const { data } = await supabase.from("plans").select("*").eq("slug", planSlug).maybeSingle();
      setPlan(data);
    })();
  }, [planSlug]);

  useEffect(() => {
    loadRazorpay();
  }, []);

  const symbol = plan?.currency === "INR" ? "₹" : "$";
  const baseAmount = plan ? Number(cycle === "monthly" ? plan.price_monthly : plan.price_yearly) : 0;
  const usingCoupon = !!couponQuote?.valid;
  const finalAmount = usingCoupon ? Number(couponQuote.final_amount) : baseAmount;

  const applyCoupon = async () => {
    if (!couponCode.trim() || !planSlug) return;
    setApplyingCoupon(true);
    setCouponMsg(null);
    const { data, error } = await supabase.functions.invoke("validate-coupon", {
      body: { code: couponCode.trim(), plan_slug: planSlug, cycle },
    });
    setApplyingCoupon(false);
    if (error || !data || data.valid === false) {
      setCouponQuote(null);
      setCouponMsg(data?.reason || error?.message || "Invalid code");
      return;
    }
    setCouponQuote(data);
    setCouponMsg(null);
    toast.success(`Coupon applied — you save ${symbol}${Number(data.discount_amount).toFixed(2)}`);
  };

  const removeCoupon = () => {
    setCouponQuote(null);
    setCouponCode("");
    setCouponMsg(null);
  };

  const handlePay = async () => {
    if (!user || !plan) return;
    setSubmitting(true);

    const ready = await loadRazorpay();
    if (!ready) {
      toast.error("Couldn't load the secure payment window. Check your connection and try again.");
      setSubmitting(false);
      return;
    }

    // With a coupon → one-time discounted order (no auto-renew). Without → recurring subscription.
    const fnName = usingCoupon ? "razorpay-create-order" : "razorpay-create-subscription";
    const reqBody: any = { plan_slug: planSlug, cycle };
    if (usingCoupon) reqBody.coupon_code = couponCode.trim();

    const { data: order, error } = await supabase.functions.invoke(fnName, { body: reqBody });
    if (error || !order || order.error) {
      toast.error(order?.error || error?.message || "Could not start checkout. Please try again.");
      setSubmitting(false);
      return;
    }

    const opts: any = {
      key: order.key_id,
      name: "Kidzopedia",
      prefill: order.prefill,
      theme: { color: "#E29578" },
      handler: async (resp: any) => {
        const vbody = usingCoupon
          ? {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              invoice_id: order.invoice_id,
            }
          : {
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_subscription_id: resp.razorpay_subscription_id,
              razorpay_signature: resp.razorpay_signature,
              invoice_id: order.invoice_id,
            };
        const { data: verify, error: vErr } = await supabase.functions.invoke("razorpay-verify-payment", { body: vbody });
        if (vErr || !verify || verify.error || !verify.ok) {
          toast.error(
            "We couldn't confirm your payment yet. If money was deducted, your plan will activate automatically within a minute.",
          );
          setSubmitting(false);
          return;
        }
        setSubmitted(true);
        toast.success("Payment successful — your plan is now active!");
        setTimeout(() => window.location.assign("/billing"), 1300);
      },
      modal: {
        ondismiss: () => {
          setSubmitting(false);
          toast("Checkout closed. You can try again anytime.");
        },
      },
    };
    if (usingCoupon) {
      opts.order_id = order.order_id;
      opts.amount = order.amount;
      opts.currency = order.currency;
      opts.description = `${order.plan_name} · one-time (${cycle})`;
    } else {
      opts.subscription_id = order.subscription_id;
      opts.description = `${order.plan_name} plan · auto-renews ${cycle}`;
    }

    const rzp = new window.Razorpay(opts);
    rzp.on("payment.failed", (r: any) => {
      toast.error(r?.error?.description || "Payment failed. Please try again.");
      setSubmitting(false);
    });
    rzp.open();
  };

  if (!plan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-warm">
        <div className="h-10 w-10 animate-pulse rounded-full bg-primary/30" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link
          to="/pricing-plans"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to plans
        </Link>

        <Card className="mt-4 p-6 sm:p-8">
          {!submitted ? (
            <>
              <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
              <p className="mt-1 text-sm text-muted-foreground">Secure payment powered by Razorpay.</p>

              <div className="mt-6 rounded-xl border border-border bg-muted/40 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
                    <p className="text-lg font-semibold text-foreground">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">Billed {cycle}</p>
                  </div>
                  <div className="text-right">
                    {usingCoupon && (
                      <p className="text-sm text-muted-foreground line-through">
                        {symbol}{baseAmount.toFixed(2)}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-foreground">
                      {symbol}{finalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">/{cycle === "monthly" ? "mo" : "yr"}</p>
                  </div>
                </div>

                {/* Coupon */}
                <div className="mt-4 border-t border-border/60 pt-4">
                  {!usingCoupon ? (
                    <>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Coupon code"
                            className="pl-9 uppercase"
                            onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                          />
                        </div>
                        <Button variant="outline" onClick={applyCoupon} disabled={applyingCoupon || !couponCode.trim()}>
                          {applyingCoupon ? "Checking…" : "Apply"}
                        </Button>
                      </div>
                      {couponMsg && <p className="mt-2 text-xs text-destructive">{couponMsg}</p>}
                    </>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm">
                      <span className="inline-flex items-center gap-2 font-medium text-primary-deep">
                        <Tag className="h-4 w-4" /> {couponQuote.code} applied · −{symbol}
                        {Number(couponQuote.discount_amount).toFixed(2)}
                      </span>
                      <button onClick={removeCoupon} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-start gap-2 rounded-xl bg-primary/10 p-4 text-sm text-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-deep" />
                {usingCoupon ? (
                  <span>
                    One-time payment with your coupon — unlocks <b>{plan.name}</b> for one {cycle === "monthly" ? "month" : "year"}.
                    This does <b>not</b> auto-renew; you can subscribe again anytime.
                  </span>
                ) : (
                  <span>
                    Secure auto-renewing subscription via Razorpay (UPI Autopay, cards & more). Your plan
                    activates instantly and renews automatically every {cycle === "monthly" ? "month" : "year"} —
                    cancel anytime from Billing.
                  </span>
                )}
              </div>

              <Button variant="warm" size="lg" className="mt-6 w-full" disabled={submitting} onClick={handlePay}>
                {submitting
                  ? "Opening secure checkout…"
                  : usingCoupon
                  ? `Pay ${symbol}${finalAmount.toFixed(2)} (one-time)`
                  : `Subscribe · ${symbol}${baseAmount.toFixed(2)}/${cycle === "monthly" ? "mo" : "yr"}`}
              </Button>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-700" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">Payment successful 🎉</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your <span className="font-semibold text-foreground">{plan.name}</span> plan is now active. Taking you to
                your billing page…
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button variant="outline" onClick={() => window.location.assign("/billing")}>
                  View billing
                </Button>
                <Button variant="warm" onClick={() => window.location.assign("/home")}>
                  Back to home
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
