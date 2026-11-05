import { useState } from "react";
import { Ticket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CouponPayload, CouponPlanOption, CouponUserOption } from "@/hooks/useAdminCoupons";

export interface CouponFormState {
  code: string;
  description: string;
  discount_type: string;
  discount_value: number | string;
  scope: string;
  allowed_emails: string;
  allowed_user_ids: string[];
  plan_slugs: string[];
  cycles: string[];
  min_amount: number | string;
  max_redemptions: number | string;
  per_user_limit: number | string;
  first_time_only: boolean;
  expires_at: string;
  is_active: boolean;
}

export const BLANK_COUPON_FORM: CouponFormState = {
  code: "", description: "", discount_type: "percent", discount_value: 10, scope: "general",
  allowed_emails: "", allowed_user_ids: [], plan_slugs: [], cycles: [],
  min_amount: 0, max_redemptions: "", per_user_limit: 1, first_time_only: false, expires_at: "", is_active: true,
};

type ListKey = "allowed_user_ids" | "plan_slugs" | "cycles";
type SetField = <K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) => void;

/** Returns an error message, or null when the form can be submitted. */
export function validateCouponForm(form: CouponFormState): string | null {
  if (!form.code.trim()) return "Code is required";
  if (!(Number(form.discount_value) > 0)) return "Discount value must be greater than 0";
  return null;
}

function parseEmails(form: CouponFormState): string[] | null {
  if (form.scope !== "emails") return null;
  const emails = form.allowed_emails.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  return emails.length ? emails : null;
}

export function buildCouponPayload(form: CouponFormState, createdBy: string | null): CouponPayload {
  return {
    code: form.code.trim().toUpperCase(),
    description: form.description,
    discount_type: form.discount_type,
    discount_value: Number(form.discount_value),
    scope: form.scope,
    allowed_emails: parseEmails(form),
    allowed_user_ids: form.scope === "users" && form.allowed_user_ids.length ? form.allowed_user_ids : null,
    applicable_plan_slugs: form.plan_slugs.length ? form.plan_slugs : null,
    applicable_cycles: form.cycles.length ? form.cycles : null,
    min_amount: Number(form.min_amount) || 0,
    max_redemptions: form.max_redemptions === "" ? null : Number(form.max_redemptions),
    per_user_limit: Number(form.per_user_limit) || 1,
    first_time_only: form.first_time_only,
    expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    is_active: form.is_active,
    created_by: createdBy,
  };
}

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
      active ? "border-primary bg-primary/20 text-primary-deep" : "border-border bg-card text-muted-foreground hover:bg-muted"
    }`}
  >
    {children}
  </button>
);

const Field = ({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) => (
  <div className={`space-y-1.5 ${className}`}>
    <Label>{label}</Label>
    {children}
  </div>
);

const SwitchField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center gap-3">
    <Switch checked={checked} onCheckedChange={onChange} />
    <Label className="!mt-0">{label}</Label>
  </div>
);

const ScopeSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <Field label="Who can use it">
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="general">Everyone (general)</SelectItem>
        <SelectItem value="emails">Specific emails</SelectItem>
        <SelectItem value="users">Specific existing users</SelectItem>
      </SelectContent>
    </Select>
  </Field>
);

const UserPicker = ({ selected, users, onToggle }: {
  selected: string[]; users: CouponUserOption[]; onToggle: (id: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const filtered = users.filter((u) => (u.display_name ?? "").toLowerCase().includes(search.toLowerCase()));
  return (
    <Field label={`Pick users (${selected.length} selected)`} className="sm:col-span-2">
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…" />
      <div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border p-2">
        {filtered.slice(0, 60).map((u) => (
          <Chip key={u.id} active={selected.includes(u.id)} onClick={() => onToggle(u.id)}>
            {u.display_name ?? u.id.slice(0, 8)}
          </Chip>
        ))}
        {filtered.length === 0 && <span className="text-xs text-muted-foreground">No users match.</span>}
      </div>
    </Field>
  );
};

const ScopeDetails = ({ form, users, set, toggle }: {
  form: CouponFormState; users: CouponUserOption[]; set: SetField; toggle: (k: ListKey, v: string) => void;
}) => {
  if (form.scope === "emails") {
    return (
      <Field label="Allowed emails (comma or space separated)" className="sm:col-span-2">
        <Input value={form.allowed_emails} onChange={(e) => set("allowed_emails", e.target.value)} placeholder="a@x.com, b@y.com" />
      </Field>
    );
  }
  if (form.scope === "users") {
    return <UserPicker selected={form.allowed_user_ids} users={users} onToggle={(id) => toggle("allowed_user_ids", id)} />;
  }
  return null;
};

const ChipGroup = ({ label, options, selected, onToggle }: {
  label: string; options: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void;
}) => (
  <Field label={label}>
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Chip key={o.value} active={selected.includes(o.value)} onClick={() => onToggle(o.value)}>{o.label}</Chip>
      ))}
    </div>
  </Field>
);

const CYCLE_OPTIONS = [{ value: "monthly", label: "monthly" }, { value: "yearly", label: "yearly" }];

const LimitFields = ({ form, set }: { form: CouponFormState; set: SetField }) => (
  <>
    <Field label="Min order amount">
      <Input type="number" min={0} value={form.min_amount} onChange={(e) => set("min_amount", e.target.value)} />
    </Field>
    <Field label="Max total redemptions (blank = ∞)">
      <Input type="number" min={0} value={form.max_redemptions} onChange={(e) => set("max_redemptions", e.target.value)} placeholder="∞" />
    </Field>
    <Field label="Per-user limit">
      <Input type="number" min={1} value={form.per_user_limit} onChange={(e) => set("per_user_limit", e.target.value)} />
    </Field>
    <Field label="Expires at (optional)">
      <Input type="date" value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} />
    </Field>
    <SwitchField label="First purchase only" checked={form.first_time_only} onChange={(v) => set("first_time_only", v)} />
    <SwitchField label="Active" checked={form.is_active} onChange={(v) => set("is_active", v)} />
  </>
);

const BasicFields = ({ form, set }: { form: CouponFormState; set: SetField }) => (
  <>
    <Field label="Code">
      <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="WELCOME50" className="uppercase" />
    </Field>
    <Field label="Discount type">
      <Select value={form.discount_type} onValueChange={(v) => set("discount_type", v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="percent">Percentage (%)</SelectItem>
          <SelectItem value="fixed">Fixed amount</SelectItem>
        </SelectContent>
      </Select>
    </Field>
    <Field label={form.discount_type === "percent" ? "Percent off" : "Amount off"}>
      <Input type="number" min={0} value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} />
    </Field>
    <Field label="Description (internal)" className="sm:col-span-2 lg:col-span-3">
      <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Launch promo" />
    </Field>
  </>
);

interface CouponFormProps {
  form: CouponFormState;
  setForm: React.Dispatch<React.SetStateAction<CouponFormState>>;
  plans: CouponPlanOption[];
  users: CouponUserOption[];
  saving: boolean;
  onSubmit: () => void;
}

export const CouponForm = ({ form, setForm, plans, users, saving, onSubmit }: CouponFormProps) => {
  const set: SetField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggle = (key: ListKey, value: string) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }));
  return (
    <Card className="p-5">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Ticket className="h-5 w-5 text-primary-deep" /> Create coupon
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BasicFields form={form} set={set} />
        <ScopeSelect value={form.scope} onChange={(v) => set("scope", v)} />
        <ScopeDetails form={form} users={users} set={set} toggle={toggle} />
        <ChipGroup
          label="Applies to plans (none = all paid)"
          options={plans.map((p) => ({ value: p.slug, label: p.name }))}
          selected={form.plan_slugs}
          onToggle={(v) => toggle("plan_slugs", v)}
        />
        <ChipGroup label="Billing cycles (none = both)" options={CYCLE_OPTIONS} selected={form.cycles} onToggle={(v) => toggle("cycles", v)} />
        <LimitFields form={form} set={set} />
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={onSubmit} disabled={saving}>{saving ? "Creating…" : "Create coupon"}</Button>
      </div>
    </Card>
  );
};
