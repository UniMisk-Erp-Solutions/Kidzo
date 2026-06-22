import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEntitlements, type FeatureKey } from "./useEntitlements";

/**
 * Returns a guard(key, label) function. Call it at the start of a paid action:
 *   if (!guard("pdf_export", "PDF export")) return;
 * If the user's plan doesn't include the feature it shows an upgrade toast
 * (with an Upgrade action) and returns false. Server-side triggers are the
 * hard enforcement; this is the friendly UX layer.
 */
export const useFeatureGuard = () => {
  const { can, loading } = useEntitlements();
  const navigate = useNavigate();

  return (key: FeatureKey, label: string): boolean => {
    if (loading) {
      toast("One moment — checking your plan…");
      return false;
    }
    if (can(key)) return true;
    toast.error(`${label} is a paid feature.`, {
      description: "Upgrade your plan to unlock it.",
      action: { label: "Upgrade", onClick: () => navigate("/pricing-plans") },
    });
    return false;
  };
};

/** Friendly message for a server-side plan_feature_locked error. */
export const isPlanLockedError = (msg?: string | null) =>
  !!msg && /plan_feature_locked/i.test(msg);
