import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  sort_order: number;
};
type Feature = { plan_id: string; key: string; value_int: number | null; value_bool: boolean | null; value_text?: string | null };

const FEATURE_LABEL: Record<string, string> = {
  max_children: "children",
  pdf_export: "PDF export",
  photo_book_orders: "Photo book orders",
  share_links: "Public share links",
  family_invites: "Family invites",
};

const FEATURE_ORDER = [
  "max_children",
  "max_storage_mb",
  "document_limits",
  "pdf_export",
  "photo_book_orders",
  "share_links",
  "family_invites",
];

// Retired features that may still be in the table.
const HIDDEN_FEATURES = ["ai_suggestions"];

const formatStorage = (mb: number) => (mb >= 1024 ? `${+(mb / 1024).toFixed(1)} GB` : `${mb} MB`);

const formatFeature = (f: Feature) => {
  if (f.key === "max_children") {
    return `${f.value_int} child${f.value_int === 1 ? "" : "ren"}`;
  }
  if (f.key === "max_storage_mb") {
    return `${formatStorage(f.value_int ?? 0)} storage`;
  }
  if (f.key === "document_limits") {
    let limits: Record<string, number | null> = {};
    try {
      limits = f.value_text ? JSON.parse(f.value_text) : {};
    } catch {
      /* treat as unlimited */
    }
    const entries = Object.entries(limits).filter(([, n]) => typeof n === "number");
    if (entries.length === 0) return "Unlimited documents in every folder, incl. achievement certificates";
    const m = limits.marksheet ?? 0;
    const s = limits.school ?? 0;
    if (m > 0 || s > 0) return `Document folders — up to ${m} marksheets & ${s} school certificates`;
    return "Birth certificate vault (1 document)";
  }
  return FEATURE_LABEL[f.key] ?? f.key;
};

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("plans").select("*").eq("is_active", true).order("sort_order");
      const { data: f } = await supabase.from("plan_features").select("plan_id, key, value_int, value_bool, value_text");
      setPlans((p ?? []) as Plan[]);
      setFeatures((f ?? []) as Feature[]);
    })();
  }, []);

  const handleChoose = (plan: Plan) => {
    if (!user) {
      sessionStorage.setItem("pendingPlan", plan.slug);
      navigate("/auth");
      return;
    }
    if (plan.slug === "free") {
      navigate("/billing");
      return;
    }
    navigate(`/checkout?plan=${plan.slug}&cycle=${cycle}`);
  };

  return (
    <div className="min-h-screen bg-gradient-warm px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Pick the plan for your family</h1>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade anytime to unlock more children and features.</p>
          <div className="mt-6 inline-flex rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setCycle("monthly")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${cycle === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Yearly · save 2 months
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const rank = (k: string) => (FEATURE_ORDER.indexOf(k) === -1 ? 99 : FEATURE_ORDER.indexOf(k));
            const planFeats = features
              .filter((f) => f.plan_id === plan.id)
              // Numeric limits with no value are not shown (we never advertise "unlimited").
              .filter((f) => !HIDDEN_FEATURES.includes(f.key))
              .filter((f) => !(["max_children", "max_storage_mb"].includes(f.key) && f.value_int === null))
              .sort((a, b) => rank(a.key) - rank(b.key));
            const price = cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
            const isPopular = plan.slug === "family";
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col p-6 ${isPopular ? "border-primary shadow-lift" : ""}`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.currency === "INR" ? "₹" : "$"}
                    {price}
                  </span>
                  <span className="text-sm text-muted-foreground">/{cycle === "monthly" ? "mo" : "yr"}</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {planFeats.map((f) => {
                    const enabled = f.value_bool !== false || f.value_int !== null;
                    return (
                      <li key={f.key} className="flex items-start gap-2">
                        {enabled ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <span className={enabled ? "text-foreground" : "text-muted-foreground/60 line-through"}>
                          {formatFeature(f)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-6 flex-1" />
                <Button
                  variant={isPopular ? "warm" : "outline"}
                  size="lg"
                  className="w-full"
                  onClick={() => handleChoose(plan)}
                >
                  {plan.slug === "free" ? "Start free" : `Choose ${plan.name}`}
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link to={user ? "/home" : "/"} className="text-sm text-primary-deep hover:underline">
            ← Back to {user ? "dashboard" : "home"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
