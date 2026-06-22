import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ScrollText } from "lucide-react";
import { ArrowLeft, Shield, Users as UsersIcon, Package, Receipt, Settings as SettingsIcon, LayoutDashboard, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/* ─────────── DASHBOARD ─────────── */
const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, active: 0, paid: 0, pending: 0 });
  useEffect(() => {
    (async () => {
      const [{ count: users }, subs, { count: pending }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_subscriptions").select("status, plans(slug)"),
        supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const active = (subs.data ?? []).filter((s: any) => s.status === "active").length;
      const paid = (subs.data ?? []).filter((s: any) => s.status === "active" && s.plans?.slug !== "free").length;
      setStats({ users: users ?? 0, active, paid, pending: pending ?? 0 });
    })();
  }, []);
  const cards = [
    { label: "Users", value: stats.users },
    { label: "Active subscriptions", value: stats.active },
    { label: "Paid subscribers", value: stats.paid },
    { label: "Pending invoices", value: stats.pending },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-5">
          <p className="text-sm text-muted-foreground">{c.label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{c.value}</p>
        </Card>
      ))}
    </div>
  );
};

/* ─────────── USERS ─────────── */
const UsersTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const [{ data: profs }, { data: subs }, { data: pls }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, created_at, is_suspended"),
      supabase.from("user_subscriptions").select("user_id, plan_id, status, plans(name, slug)"),
      supabase.from("plans").select("id, name, slug").order("sort_order"),
    ]);
    const subMap: Record<string, any> = {};
    (subs ?? []).forEach((s: any) => (subMap[s.user_id] = s));
    setPlans(pls ?? []);
    setRows((profs ?? []).map((p: any) => ({ ...p, sub: subMap[p.id] })));
  };
  useEffect(() => { load(); }, []);

  const toggleSuspend = async (userId: string, next: boolean) => {
    const reason = window.prompt(
      next ? "Reason for blocking this user? (optional)" : "Reason for unblocking? (optional)",
      "",
    );
    if (reason === null) return; // cancelled
    const { error } = await supabase.from("profiles").update({ is_suspended: next }).eq("id", userId);
    if (error) return toast.error(error.message);
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      await supabase.from("admin_audit_log").insert({
        admin_id: auth.user.id,
        target_user_id: userId,
        action: next ? "block" : "unblock",
        reason: reason.trim() || null,
      });
    }
    toast.success(next ? "User blocked" : "User unblocked");
    load();
  };

  const changePlan = async (userId: string, planId: string) => {
    const existing = rows.find((r) => r.id === userId)?.sub;
    if (existing) {
      const { error } = await supabase.from("user_subscriptions").update({ plan_id: planId, status: "active" }).eq("user_id", userId);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_subscriptions").insert({ user_id: userId, plan_id: planId, status: "active" });
      if (error) return toast.error(error.message);
    }
    toast.success("Plan updated");
    load();
  };

  const filtered = useMemo(
    () => rows.filter((r) => !q || (r.display_name ?? "").toLowerCase().includes(q.toLowerCase()) || r.id.includes(q)),
    [rows, q],
  );

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <Input placeholder="Search by name or user id…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <span className="text-xs text-muted-foreground">{filtered.length} users</span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Change plan</TableHead>
              <TableHead>Access</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} className={r.is_suspended ? "opacity-60" : ""}>
                <TableCell className="font-medium">
                  {r.display_name ?? "—"}
                  {r.is_suspended && <Badge variant="destructive" className="ml-2">Blocked</Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{r.sub?.plans?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  {r.sub ? <Badge variant="secondary">{r.sub.status}</Badge> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <Select value={r.sub?.plan_id ?? ""} onValueChange={(v) => changePlan(r.id, v)}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Set plan" /></SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={r.is_suspended ? "outline" : "destructive"}
                    onClick={() => toggleSuspend(r.id, !r.is_suspended)}
                  >
                    {r.is_suspended ? "Unblock" : "Block"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

/* ─────────── PLANS ─────────── */
const PlansTab = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);

  const load = async () => {
    const { data: p } = await supabase.from("plans").select("*").order("sort_order");
    const { data: f } = await supabase.from("plan_features").select("*");
    setPlans(p ?? []); setFeatures(f ?? []);
  };
  useEffect(() => { load(); }, []);

  const savePlan = async (plan: any) => {
    const { error } = await supabase.from("plans").update({
      name: plan.name, description: plan.description,
      price_monthly: Number(plan.price_monthly), price_yearly: Number(plan.price_yearly),
      currency: plan.currency, is_active: plan.is_active, sort_order: plan.sort_order,
    }).eq("id", plan.id);
    if (error) return toast.error(error.message);

    // For paid plans, re-sync the price to Razorpay so NEW subscriptions bill the new amount.
    // (Razorpay plan amounts are immutable → this creates fresh plans and repoints them.
    //  Existing subscribers keep their current price until they re-subscribe.)
    if (plan.slug !== "free" && (Number(plan.price_monthly) > 0 || Number(plan.price_yearly) > 0)) {
      const { data: sync, error: syncErr } = await supabase.functions.invoke("admin-sync-razorpay-plans", {
        body: { plan_slug: plan.slug },
      });
      if (syncErr || sync?.error) {
        toast.warning(`Plan saved, but Razorpay price sync failed: ${sync?.error || syncErr?.message}. Display/one-time prices are updated; recurring price not yet.`);
        return;
      }
      toast.success("Plan saved & synced to Razorpay — new price applies to new subscriptions.");
      return;
    }
    toast.success("Plan saved");
  };

  const saveFeature = async (f: any) => {
    const patch: any = {};
    if (f.value_int !== undefined) patch.value_int = f.value_int === "" || f.value_int === null ? null : Number(f.value_int);
    if (f.value_bool !== undefined) patch.value_bool = f.value_bool;
    const { error } = await supabase.from("plan_features").update(patch).eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Feature saved");
    load();
  };

  return (
    <div className="space-y-6">
      {plans.map((plan) => {
        const planFeats = features.filter((f) => f.plan_id === plan.id);
        return (
          <Card key={plan.id} className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={plan.name} onChange={(e) => setPlans((ps) => ps.map((p) => p.id === plan.id ? { ...p, name: e.target.value } : p))} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input value={plan.currency} onChange={(e) => setPlans((ps) => ps.map((p) => p.id === plan.id ? { ...p, currency: e.target.value } : p))} />
              </div>
              <div className="space-y-1.5">
                <Label>Price / month</Label>
                <NumberField
                  value={plan.price_monthly}
                  min={0}
                  step={1}
                  onChange={(v) => setPlans((ps) => ps.map((p) => p.id === plan.id ? { ...p, price_monthly: v } : p))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price / year</Label>
                <NumberField
                  value={plan.price_yearly}
                  min={0}
                  step={1}
                  onChange={(v) => setPlans((ps) => ps.map((p) => p.id === plan.id ? { ...p, price_yearly: v } : p))}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
                <Label>Description</Label>
                <Input value={plan.description ?? ""} onChange={(e) => setPlans((ps) => ps.map((p) => p.id === plan.id ? { ...p, description: e.target.value } : p))} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={plan.is_active} onCheckedChange={(v) => setPlans((ps) => ps.map((p) => p.id === plan.id ? { ...p, is_active: v } : p))} />
                <Label className="!mt-0">Active</Label>
              </div>
              <div className="flex justify-end sm:col-span-2 lg:col-span-3">
                <Button onClick={() => savePlan(plan)}>Save plan</Button>
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium text-foreground">Features & limits</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {planFeats.map((f) => {
                  const isNumeric = f.value_bool === null;
                  return isNumeric ? (
                    <NumericFeatureRow
                      key={f.id}
                      feature={f}
                      onSave={async (val) => { await saveFeature({ id: f.id, value_int: val }); }}
                      onRevert={() => load()}
                    />

                  ) : (
                    <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{f.key}</p>
                        <p className="text-xs text-muted-foreground">On / off</p>
                      </div>
                      <Switch
                        checked={!!f.value_bool}
                        onCheckedChange={(v) => {
                          setFeatures((fs) => fs.map((x) => x.id === f.id ? { ...x, value_bool: v } : x));
                          saveFeature({ id: f.id, value_bool: v });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

/* Numeric input with min/max/step, mobile-friendly keyboard, no spinners.
   Use for any number entry across the admin panel. */
type NumberFieldProps = {
  value: number | string | null | undefined;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
  id?: string;
};
const NumberField = ({ value, onChange, min, max, step = 1, disabled, placeholder, className, invalid, id }: NumberFieldProps) => (
  <Input
    id={id}
    type="text"
    inputMode="numeric"
    pattern="[0-9]*"
    autoComplete="off"
    min={min}
    max={max}
    step={step}
    disabled={disabled}
    placeholder={placeholder}
    value={value ?? ""}
    onChange={(e) => {
      const raw = e.target.value;
      // allow empty or digits only (and a leading minus if min<0)
      if (raw === "" || /^-?\d*$/.test(raw)) onChange(raw);
    }}
    className={`h-9 w-28 ${invalid ? "border-destructive focus-visible:ring-destructive" : ""} ${className ?? ""}`}
    aria-invalid={invalid || undefined}
  />
);

/* Per-feature caps so admins can't over-allocate. blank/null = unlimited. */
const FEATURE_CAPS: Record<string, { max: number; label: string; unit?: string }> = {
  max_children: { max: 100, label: "Max children", unit: "" },
  max_storage_mb: { max: 1024 * 1024, label: "Storage", unit: "MB" }, // 1 TB
  max_memories_per_month: { max: 100000, label: "Memories / month", unit: "" },
};

const NumericFeatureRow = ({
  feature,
  onSave,
  onRevert,
}: {
  feature: any;
  onSave: (val: string | null) => void | Promise<void>;
  onRevert: () => void;
}) => {
  const initial = feature.value_int == null ? "" : String(feature.value_int);
  const [draft, setDraft] = useState(initial);
  useEffect(() => { setDraft(initial); }, [initial]);

  const cap = FEATURE_CAPS[feature.key];
  const max = cap?.max;
  const numeric = draft === "" ? null : Number(draft);
  const tooHigh = numeric !== null && max !== undefined && numeric > max;
  const negative = numeric !== null && numeric < 0;
  const error = tooHigh
    ? `Maximum allowed is ${max!.toLocaleString()}${cap?.unit ? ` ${cap.unit}` : ""}.`
    : negative
      ? "Value must be 0 or greater."
      : null;
  const dirty = draft !== initial;

  const helper =
    feature.key === "max_storage_mb"
      ? "Storage in MB · blank = unlimited"
      : feature.key === "max_memories_per_month"
        ? "Per month · blank = unlimited"
        : "Number · blank = unlimited";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{feature.key}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="flex items-center gap-2">
          <NumberField
            value={draft}
            onChange={setDraft}
            min={0}
            max={max}
            placeholder="∞"
            invalid={!!error}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!dirty}
            onClick={() => setDraft(initial)}
          >
            Revert
          </Button>
          <Button
            size="sm"
            disabled={!dirty || !!error}
            onClick={async () => {
              if (error) return;
              await onSave(draft === "" ? null : draft);
              onRevert(); // reload to sync
            }}
          >
            Save
          </Button>
        </div>
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      {dirty && !error && (
        <p className="text-xs text-muted-foreground">Unsaved change · click Save to confirm or Revert to discard.</p>
      )}
    </div>
  );
};

/* ─────────── INVOICES ─────────── */
const InvoicesTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("*, plans(name, slug), profiles!invoices_user_id_fkey(display_name)")
      .order("created_at", { ascending: false });
    // profiles fk may not exist via PostgREST; fall back to manual join
    if (data && data.length && (data[0] as any).profiles === null) {
      const ids = Array.from(new Set(data.map((d: any) => d.user_id)));
      const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => (map[p.id] = p.display_name));
      (data as any[]).forEach((d) => (d._user_name = map[d.user_id]));
    }
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string, planId?: string, userId?: string) => {
    const patch: any = { status, paid_at: status === "paid" ? new Date().toISOString() : null };
    const { error } = await supabase.from("invoices").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    if (status === "paid" && planId && userId) {
      await supabase.from("user_subscriptions").upsert(
        { user_id: userId, plan_id: planId, status: "active" },
        { onConflict: "user_id" },
      );
    }
    toast.success(`Invoice ${status}`);
    load();
  };

  return (
    <Card className="p-5">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.profiles?.display_name ?? inv._user_name ?? inv.user_id.slice(0, 8)}</TableCell>
                <TableCell>{inv.plans?.name ?? "—"}</TableCell>
                <TableCell>{inv.currency === "INR" ? "₹" : "$"}{Number(inv.amount).toFixed(2)}</TableCell>
                <TableCell><Badge variant="secondary">{inv.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {inv.status !== "paid" && (
                      <Button size="sm" variant="default" onClick={() => setStatus(inv.id, "paid", inv.plan_id, inv.user_id)}>Mark paid</Button>
                    )}
                    {inv.status !== "refunded" && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(inv.id, "refunded")}>Refund</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No invoices yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

/* ─────────── SETTINGS ─────────── */
const SettingsTab = () => {
  const [signupsOpen, setSignupsOpen] = useState(true);
  const [defaultPlan, setDefaultPlan] = useState("free");
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("*");
      data?.forEach((s: any) => {
        if (s.key === "signups_open") setSignupsOpen(!!s.value);
        if (s.key === "default_plan_slug") setDefaultPlan(typeof s.value === "string" ? s.value : (s.value ?? "free"));
      });
      const { data: pls } = await supabase.from("plans").select("slug, name");
      setPlans(pls ?? []);
    })();
  }, []);

  const save = async (key: string, value: any) => {
    const { error } = await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  return (
    <Card className="space-y-5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">Signups open</p>
          <p className="text-sm text-muted-foreground">Allow new users to create accounts.</p>
        </div>
        <Switch checked={signupsOpen} onCheckedChange={(v) => { setSignupsOpen(v); save("signups_open", v); }} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">Default plan</p>
          <p className="text-sm text-muted-foreground">Plan applied to new signups.</p>
        </div>
        <Select value={defaultPlan} onValueChange={(v) => { setDefaultPlan(v); save("default_plan_slug", v); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {plans.map((p) => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};

/* ─────────── AUDIT LOG ─────────── */
const AuditLogTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      const ids = Array.from(new Set([
        ...(data ?? []).map((d: any) => d.admin_id),
        ...(data ?? []).map((d: any) => d.target_user_id),
      ]));
      const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => (map[p.id] = p.display_name));
      setRows((data ?? []).map((d: any) => ({
        ...d,
        admin_name: map[d.admin_id] ?? d.admin_id.slice(0, 8),
        target_name: map[d.target_user_id] ?? d.target_user_id.slice(0, 8),
      })));
    })();
  }, []);

  return (
    <Card className="p-5">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target user</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="font-medium">{r.admin_name}</TableCell>
                <TableCell>
                  <Badge variant={r.action === "block" ? "destructive" : "secondary"}>{r.action}</Badge>
                </TableCell>
                <TableCell>{r.target_name}</TableCell>
                <TableCell className="text-muted-foreground">{r.reason ?? "—"}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No audit entries yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

/* ─────────── ROOT ─────────── */
const AdminPanel = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    try { await signOut(); } finally { navigate("/auth", { replace: true }); }
  };
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link to="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to app
            </Link>
            <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-foreground">
              <Shield className="h-7 w-7 text-primary-deep" /> Master admin
            </h1>
            <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted p-1">
            <TabsTrigger value="dashboard"><LayoutDashboard className="mr-1 h-4 w-4" />Dashboard</TabsTrigger>
            <TabsTrigger value="users"><UsersIcon className="mr-1 h-4 w-4" />Users</TabsTrigger>
            <TabsTrigger value="plans"><Package className="mr-1 h-4 w-4" />Plans</TabsTrigger>
            <TabsTrigger value="invoices"><Receipt className="mr-1 h-4 w-4" />Invoices</TabsTrigger>
            <TabsTrigger value="audit"><ScrollText className="mr-1 h-4 w-4" />Audit log</TabsTrigger>
            <TabsTrigger value="settings"><SettingsIcon className="mr-1 h-4 w-4" />Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-5"><Dashboard /></TabsContent>
          <TabsContent value="users" className="mt-5"><UsersTab /></TabsContent>
          <TabsContent value="plans" className="mt-5"><PlansTab /></TabsContent>
          <TabsContent value="invoices" className="mt-5"><InvoicesTab /></TabsContent>
          <TabsContent value="audit" className="mt-5"><AuditLogTab /></TabsContent>
          <TabsContent value="settings" className="mt-5"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
