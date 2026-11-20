import { useEffect } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Reads a one-shot sessionStorage flag, clearing it so it is only honoured once. */
const takeSessionFlag = (key: string): string | null => {
  const value = sessionStorage.getItem(key);
  if (value) sessionStorage.removeItem(key);
  return value;
};

/** True (after signing out) when the account has been suspended. */
const blockIfSuspended = async (userId: string): Promise<boolean> => {
  const { data: prof } = await supabase.from("profiles").select("is_suspended").eq("id", userId).maybeSingle();
  if (!prof?.is_suspended) return false;
  await supabase.auth.signOut();
  toast.error("Your account has been suspended.");
  return true;
};

const isSuperAdmin = async (userId: string): Promise<boolean> => {
  const { data: roleRow } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "super_admin").maybeSingle();
  return !!roleRow;
};

/** Where a signed-in user should land, from the stored pending invite / plan. */
const pendingDestination = (): string => {
  const pending = takeSessionFlag("pendingInviteToken");
  if (pending) return `/share/${pending}`;
  const pendingPlan = takeSessionFlag("pendingPlan");
  if (pendingPlan) return `/checkout?plan=${pendingPlan}&cycle=monthly`;
  return "/home";
};

const routeSignedInUser = async (user: User, navigate: NavigateFunction) => {
  // Brand-new signups go to onboarding; the flag is set right after a
  // successful sign-up / email-verification so we win any redirect race.
  if (takeSessionFlag("postSignup")) {
    navigate("/onboarding", { replace: true });
    return;
  }
  if (await blockIfSuspended(user.id)) return;
  if (await isSuperAdmin(user.id)) {
    navigate("/admin", { replace: true });
    return;
  }
  navigate(pendingDestination(), { replace: true });
};

/** Sends an already-signed-in user to the right place after the auth page. */
export const useAuthRedirect = (user: User | null, navigate: NavigateFunction) => {
  useEffect(() => {
    if (!user) return;
    void routeSignedInUser(user, navigate);
  }, [user, navigate]);
};
