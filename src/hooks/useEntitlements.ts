import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type FeatureKey =
  | "max_children"
  | "max_memories_per_month"
  | "max_storage_mb"
  | "pdf_export"
  | "photo_book_orders"
  | "share_links"
  | "family_invites"
  | "ai_suggestions";

type FeatureRow = { key: string; value_int: number | null; value_bool: boolean | null; value_text: string | null };

export const useEntitlements = () => {
  const { user, loading: authLoading } = useAuth();
  const [planSlug, setPlanSlug] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [features, setFeatures] = useState<Record<string, FeatureRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("plan_id, plans(slug, name)")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!sub) {
        setLoading(false);
        return;
      }
      const plan = (sub as any).plans;
      const { data: feats } = await supabase
        .from("plan_features")
        .select("key, value_int, value_bool, value_text")
        .eq("plan_id", (sub as any).plan_id);
      if (cancelled) return;
      setPlanSlug(plan?.slug ?? null);
      setPlanName(plan?.name ?? null);
      const m: Record<string, FeatureRow> = {};
      (feats ?? []).forEach((f: any) => (m[f.key] = f));
      setFeatures(m);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const can = (key: FeatureKey) => features[key]?.value_bool === true;
  const limit = (key: FeatureKey): number | null => {
    const f = features[key];
    if (!f) return null;
    return f.value_int; // null means unlimited
  };

  return { planSlug, planName, features, can, limit, loading };
};
