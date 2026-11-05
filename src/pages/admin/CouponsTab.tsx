import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useConfirm } from "@/components/ConfirmProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCoupons, type AdminCoupon, type CouponWrites } from "@/hooks/useAdminCoupons";
import { BLANK_COUPON_FORM, CouponForm, buildCouponPayload, validateCouponForm, type CouponFormState } from "./CouponForm";

const CouponRow = ({ coupon, onToggle, onRemove }: {
  coupon: AdminCoupon; onToggle: (c: AdminCoupon) => void; onRemove: (c: AdminCoupon) => void;
}) => (
  <TableRow>
    <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
    <TableCell>{coupon.discount_type === "percent" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}</TableCell>
    <TableCell><Badge variant="secondary">{coupon.scope}</Badge></TableCell>
    <TableCell className="text-muted-foreground">{coupon.redeemed_count}{coupon.max_redemptions ? `/${coupon.max_redemptions}` : ""}</TableCell>
    <TableCell className="text-muted-foreground">{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : "—"}</TableCell>
    <TableCell>
      <button onClick={() => onToggle(coupon)}>
        <Badge variant={coupon.is_active ? "default" : "secondary"}>{coupon.is_active ? "active" : "off"}</Badge>
      </button>
    </TableCell>
    <TableCell>
      <Button size="sm" variant="ghost" onClick={() => onRemove(coupon)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </TableCell>
  </TableRow>
);

const CouponList = ({ coupons, onToggle, onRemove }: {
  coupons: AdminCoupon[]; onToggle: (c: AdminCoupon) => void; onRemove: (c: AdminCoupon) => void;
}) => (
  <Card className="p-5">
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Scope</TableHead>
            <TableHead>Used</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((c) => <CouponRow key={c.id} coupon={c} onToggle={onToggle} onRemove={onRemove} />)}
          {coupons.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">No coupons yet.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </Card>
);

export const CouponsTab = ({ writes }: { writes: CouponWrites }) => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const { coupons, plans, users, reload } = useAdminCoupons();
  const [form, setForm] = useState<CouponFormState>({ ...BLANK_COUPON_FORM });
  const [saving, setSaving] = useState(false);

  const create = async () => {
    const invalid = validateCouponForm(form);
    if (invalid) return toast.error(invalid);
    setSaving(true);
    const error = await writes.create(buildCouponPayload(form, user?.id ?? null));
    setSaving(false);
    if (error) return toast.error(error);
    reload();
    toast.success("Coupon created");
    setForm({ ...BLANK_COUPON_FORM });
  };
  const toggleActive = async (c: AdminCoupon) => {
    const error = await writes.setActive(c.id, !c.is_active);
    if (error) return toast.error(error);
    reload();
  };
  const remove = async (c: AdminCoupon) => {
    if (!(await confirm({ title: `Delete coupon ${c.code}?`, confirmLabel: "Delete", destructive: true }))) return;
    const error = await writes.remove(c.id);
    if (error) return toast.error(error);
    toast.success("Coupon deleted");
    reload();
  };

  return (
    <div className="space-y-6">
      <CouponForm form={form} setForm={setForm} plans={plans} users={users} saving={saving} onSubmit={create} />
      <CouponList coupons={coupons} onToggle={toggleActive} onRemove={remove} />
    </div>
  );
};
