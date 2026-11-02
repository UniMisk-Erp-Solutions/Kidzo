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
  | "document_limits";

type FeatureRow = { key: string; value_int: number | null; value_bool: boolean | null; value_text: string | null };

/** The user's plan and its features, or null when they have no subscription row. */
async function loadEntitlements(userId: string) {
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("plan_id, plans(slug, name)")
    .eq("user_id", userId)
    .maybeSingle();
  if (!sub) return null;
  const plan = (sub as any).plans;
  const { data: feats } = await supabase
    .from("plan_features")
    .select("key, value_int, value_bool, value_text")
    .eq("plan_id", (sub as any).plan_id);
  const features: Record<string, FeatureRow> = {};
  (feats ?? []).forEach((f: any) => (features[f.key] = f));
  return { planSlug: (plan?.slug ?? null) as string | null, planName: (plan?.name ?? null) as string | null, features };
}

/** A numeric limit for a feature; null means unlimited (or the plan has no such feature). */
const featureLimit = (features: Record<string, FeatureRow>, key: FeatureKey): number | null => features[key]?.value_int ?? null;

/**
 * Max files for a document folder on this plan: a number (0 = locked) or null = unlimited.
 * Stored as JSON in the `document_limits` feature, e.g. {"marksheet":20,"school":7}.
 */
function documentFolderLimit(features: Record<string, FeatureRow>, category: string): number | null {
  try {
    const raw = features["document_limits"]?.value_text;
    const n = raw ? JSON.parse(raw)?.[category] : null;
    return typeof n === "number" ? n : null;
  } catch {
    return null;
  }
}

export const useEntitlements = () => {
  const { user, loading: authLoading } = useAuth();
  const [planSlug, setPlanSlug] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [features, setFeatures] = useState<Record<string, FeatureRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const pending = user ? loadEntitlements(user.id) : Promise.resolve(null);
    pending.then((loaded) => {
      if (cancelled && loaded) return;
      if (loaded) {
        setPlanSlug(loaded.planSlug);
        setPlanName(loaded.planName);
        setFeatures(loaded.features);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const can = (key: FeatureKey) => features[key]?.value_bool === true;
  const limit = (key: FeatureKey) => featureLimit(features, key);
  const documentLimit = (category: string) => documentFolderLimit(features, category);

  return { planSlug, planName, features, can, limit, documentLimit, loading };
};
