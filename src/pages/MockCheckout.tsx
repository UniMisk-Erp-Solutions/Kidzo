import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { failureReason, redirectToCcavenue, type CcavenueOrder } from "@/lib/ccavenue";
import { toast } from "sonner";

const Checkout = () => {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const planSlug = params.get("plan");
  const cycle = (params.get("cycle") ?? "monthly") as "monthly" | "yearly";
  const [plan, setPlan] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

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
    const { data, error } = await supabase.functions.invoke("ccavenue-create-order", {
      body: { kind: "subscription", plan_slug: planSlug, cycle, ...(usingCoupon ? { coupon_code: couponCode.trim() } : {}) },
    });
    if (error || !data || data.error) {
      toast.error((await failureReason(data, error)) || "Could not start checkout. Please try again.");
      setSubmitting(false);
      return;
    }
    // Hosted checkout: the browser leaves for CCAvenue and comes back to /payment/result.
    redirectToCcavenue(data as CcavenueOrder);
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
          <>
              <h1 className="font-display text-2xl font-bold text-foreground">Checkout</h1>
              <p className="mt-1 text-sm text-muted-foreground">Secure payment powered by CCAvenue.</p>

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
                <span>
                  One-time payment via CCAvenue (UPI, cards, net banking &amp; wallets) — unlocks <b>{plan.name}</b> for
                  one {cycle === "monthly" ? "month" : "year"}. It does <b>not</b> auto-renew; you can pay again anytime.
                </span>
              </div>

              <Button variant="warm" size="lg" className="mt-6 w-full" disabled={submitting} onClick={handlePay}>
                {submitting ? "Opening secure checkout…" : `Pay ${symbol}${finalAmount.toFixed(2)}`}
              </Button>
          </>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
