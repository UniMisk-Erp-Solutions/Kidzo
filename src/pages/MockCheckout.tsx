import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  useEffect(() => {
    if (!planSlug) return;
    (async () => {
      const { data } = await supabase.from("plans").select("*").eq("slug", planSlug).maybeSingle();
      setPlan(data);
    })();
  }, [planSlug]);

  // Warm up the SDK so the checkout opens instantly on click.
  useEffect(() => {
    loadRazorpay();
  }, []);

  const amount = plan ? (cycle === "monthly" ? plan.price_monthly : plan.price_yearly) : 0;
  const symbol = plan?.currency === "INR" ? "₹" : "$";

  const handlePay = async () => {
    if (!user || !plan) return;
    setSubmitting(true);

    const ready = await loadRazorpay();
    if (!ready) {
      toast.error("Couldn't load the secure payment window. Check your connection and try again.");
      setSubmitting(false);
      return;
    }

    // 1) ask our backend to create a recurring Razorpay subscription (amount/plan resolved server-side)
    const { data: order, error } = await supabase.functions.invoke("razorpay-create-subscription", {
      body: { plan_slug: planSlug, cycle },
    });
    if (error || !order || order.error) {
      toast.error(order?.error || error?.message || "Could not start checkout. Please try again.");
      setSubmitting(false);
      return;
    }

    // 2) open the Razorpay checkout (subscription mode — sets up auto-renewal)
    const rzp = new window.Razorpay({
      key: order.key_id,
      name: "Kidzopedia",
      description: `${order.plan_name} plan · auto-renews ${cycle}`,
      subscription_id: order.subscription_id,
      prefill: order.prefill,
      theme: { color: "#E29578" },
      handler: async (resp: any) => {
        // 3) verify the payment on our backend → activates the plan instantly
        const { data: verify, error: vErr } = await supabase.functions.invoke("razorpay-verify-payment", {
          body: {
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_subscription_id: resp.razorpay_subscription_id,
            razorpay_signature: resp.razorpay_signature,
            invoice_id: order.invoice_id,
          },
        });
        if (vErr || !verify || verify.error || !verify.ok) {
          toast.error(
            "We couldn't confirm your payment yet. If money was deducted, your plan will activate automatically within a minute.",
          );
          setSubmitting(false);
          return;
        }
        setSubmitted(true);
        toast.success("Payment successful — your plan is now active!");
        // Full reload so every entitlement/role hook re-reads the new plan immediately.
        setTimeout(() => window.location.assign("/billing"), 1300);
      },
      modal: {
        ondismiss: () => {
          setSubmitting(false);
          toast("Checkout closed. You can try again anytime.");
        },
      },
    });
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
              <p className="mt-1 text-sm text-muted-foreground">
                Secure payment powered by Razorpay.
              </p>

              <div className="mt-6 rounded-xl border border-border bg-muted/40 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
                    <p className="text-lg font-semibold text-foreground">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">Billed {cycle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {symbol}
                      {Number(amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">/{cycle === "monthly" ? "mo" : "yr"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-2 rounded-xl bg-primary/10 p-4 text-sm text-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-deep" />
                <span>
                  Secure auto-renewing subscription via Razorpay (UPI Autopay, cards & more). Your plan
                  activates instantly and renews automatically every {cycle === "monthly" ? "month" : "year"} —
                  cancel anytime from Billing.
                </span>
              </div>

              <Button
                variant="warm"
                size="lg"
                className="mt-6 w-full"
                disabled={submitting}
                onClick={handlePay}
              >
                {submitting
                  ? "Opening secure checkout…"
                  : `Subscribe · ${symbol}${Number(amount).toFixed(2)}/${cycle === "monthly" ? "mo" : "yr"}`}
              </Button>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-700" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">Payment successful 🎉</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your <span className="font-semibold text-foreground">{plan.name}</span> plan is now
                active. Taking you to your billing page…
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
