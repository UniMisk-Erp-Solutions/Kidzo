import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as typedClient } from "@/integrations/supabase/client";

// The generated types do not include the coupons table yet, so use the untyped view of the client.
const supabase: SupabaseClient = typedClient;

export interface AdminCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  scope: string;
  redeemed_count: number;
  max_redemptions: number | null;
  expires_at: string | null;
  is_active: boolean;
}
export interface CouponPlanOption { slug: string; name: string }
export interface CouponUserOption { id: string; display_name: string | null }

export interface CouponPayload {
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  scope: string;
  allowed_emails: string[] | null;
  allowed_user_ids: string[] | null;
  applicable_plan_slugs: string[] | null;
  applicable_cycles: string[] | null;
  min_amount: number;
  max_redemptions: number | null;
  per_user_limit: number;
  first_time_only: boolean;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
}

/** Coupon writes, supplied by the admin page; each resolves to an error message or null. */
export interface CouponWrites {
  create: (payload: CouponPayload) => Promise<string | null>;
  setActive: (id: string, isActive: boolean) => Promise<string | null>;
  remove: (id: string) => Promise<string | null>;
}

/** Admin data access for the coupons tab: lists coupons, paid plans and users (reads only). */
export function useAdminCoupons() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [plans, setPlans] = useState<CouponPlanOption[]>([]);
  const [users, setUsers] = useState<CouponUserOption[]>([]);

  const load = useCallback(async () => {
    const { data: c } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((c ?? []) as AdminCoupon[]);
    const { data: p } = await supabase.from("plans").select("slug, name").neq("slug", "free").order("sort_order");
    setPlans(p ?? []);
    const { data: u } = await supabase.from("profiles").select("id, display_name").order("display_name");
    setUsers(u ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  return { coupons, plans, users, reload: load };
}
