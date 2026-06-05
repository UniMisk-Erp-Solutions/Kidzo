import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "super_admin" | "admin" | "user";

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!cancelled) {
        setRoles((data ?? []).map((r: any) => r.role as AppRole));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return {
    roles,
    loading,
    isSuperAdmin: roles.includes("super_admin"),
    isAdmin: roles.includes("super_admin") || roles.includes("admin"),
  };
};
