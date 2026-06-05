import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { toast } from "sonner";

const Billing = () => {
  const { user } = useAuth();
  const { planName, planSlug, features, loading } = useEntitlements();
  const [invoices, setInvoices] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*, plans(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setInvoices(data ?? []);
    })();
  }, [user]);

  const statusColor = (s: string) =>
    s === "paid" ? "bg-primary/20 text-primary-deep" :
    s === "pending" ? "bg-amber-200 text-amber-900" :
    s === "refunded" ? "bg-muted text-muted-foreground" :
    "bg-destructive/20 text-destructive";

  return (
    <div className="min-h-screen bg-gradient-warm px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link to="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-foreground">Billing</h1>
        <p className="mt-1 text-muted-foreground">Manage your plan and review past invoices.</p>

        <Card className="mt-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "…" : planName ?? "Free"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(features).map(([key, f]) => {
                  if (f.value_bool === false) return null;
                  if (f.key === "max_children") {
                    return (
                      <Badge key={key} variant="secondary">
                        {f.value_int === null ? "Unlimited children" : `${f.value_int} child${f.value_int === 1 ? "" : "ren"}`}
                      </Badge>
                    );
                  }
                  if (f.value_bool) return <Badge key={key} variant="secondary">{key.replace(/_/g, " ")}</Badge>;
                  return null;
                })}
              </div>
            </div>
            <Button variant="warm" onClick={() => navigate("/pricing-plans")}>
              {planSlug === "premium" ? "Manage plan" : "Upgrade"}
            </Button>
          </div>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold text-foreground">Invoices</h2>
          {invoices.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-foreground">{inv.plans?.name ?? "Plan"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString()} · {inv.billing_cycle}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">
                      {inv.currency === "INR" ? "₹" : "$"}{Number(inv.amount).toFixed(2)}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Billing;
