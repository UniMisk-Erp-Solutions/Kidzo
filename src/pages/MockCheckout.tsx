import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const MockCheckout = () => {
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

  const amount = plan ? (cycle === "monthly" ? plan.price_monthly : plan.price_yearly) : 0;

  const handlePay = async () => {
    if (!user || !plan) return;
    setSubmitting(true);
    const { error } = await supabase.from("invoices").insert({
      user_id: user.id,
      plan_id: plan.id,
      amount,
      currency: plan.currency,
      status: "pending",
      provider: "mock",
      billing_cycle: cycle,
      notes: "Awaiting admin confirmation (mock checkout)",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubmitted(true);
    toast.success("Request received — we'll activate your plan shortly.");
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
        <Link to="/pricing-plans" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to plans
        </Link>

        <Card className="mt-4 p-6 sm:p-8">
          {!submitted ? (
            <>
              <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
              <p className="mt-1 text-sm text-muted-foreground">Mock checkout — Razorpay integration coming soon.</p>

              <div className="mt-6 rounded-xl border border-border bg-muted/40 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
                    <p className="text-lg font-semibold text-foreground">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">Billed {cycle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {plan.currency === "INR" ? "₹" : "$"}{Number(amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">/{cycle === "monthly" ? "mo" : "yr"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-2 rounded-xl bg-primary/10 p-4 text-sm text-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-deep" />
                <span>This is a mock checkout. Clicking Pay will create a pending invoice that your admin will confirm manually.</span>
              </div>

              <Button variant="warm" size="lg" className="mt-6 w-full" disabled={submitting} onClick={handlePay}>
                {submitting ? "Submitting…" : `Pay ${plan.currency === "INR" ? "₹" : "$"}${Number(amount).toFixed(2)} (mock)`}
              </Button>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-7 w-7 text-amber-700" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">Awaiting confirmation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your request for the <span className="font-semibold text-foreground">{plan.name}</span> plan has been received. An admin will activate it shortly.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button variant="outline" onClick={() => navigate("/billing")}>View billing</Button>
                <Button variant="warm" onClick={() => navigate("/home")}>Back to home</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MockCheckout;
