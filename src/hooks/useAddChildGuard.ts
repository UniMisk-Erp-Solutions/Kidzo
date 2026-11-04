import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveChildId } from "./useChildren";
import { useEntitlements } from "./useEntitlements";

/**
 * Returns a function to call before adding a child. When the plan's child limit is already reached it shows
 * the same upgrade toast as other paid actions and returns false. The server still enforces the limit.
 */
export const useAddChildGuard = () => {
  const { user } = useAuth();
  const { children } = useActiveChildId();
  const { limit, loading } = useEntitlements();
  const navigate = useNavigate();

  return (): boolean => {
    if (loading) {
      toast("One moment — checking your plan…");
      return false;
    }
    const max = limit("max_children"); // null = unlimited
    const owned = children.filter((c) => c.user_id === user?.id).length;
    if (max === null || owned < max) return true;
    toast.error("Adding more children is a paid feature.", {
      description: `Your plan includes ${max} ${max === 1 ? "child" : "children"}. Upgrade to add more.`,
      action: { label: "Upgrade", onClick: () => navigate("/pricing-plans") },
    });
    return false;
  };
};
