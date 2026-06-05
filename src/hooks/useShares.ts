import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Share = {
  id: string;
  child_id: string;
  owner_id: string;
  shared_with_user_id: string | null;
  invite_email: string | null;
  role: "viewer" | "editor";
  status: "pending" | "accepted" | "revoked";
  accepted_at: string | null;
  created_at: string;
};

export type Invite = {
  id: string;
  child_id: string;
  owner_id: string;
  token: string;
  role: "viewer" | "editor";
  email: string | null;
  expires_at: string;
  accepted_by: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export const useShares = (childId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["shares", user?.id, childId],
    enabled: !!user && !!childId,
    queryFn: async (): Promise<Share[]> => {
      const { data, error } = await supabase
        .from("child_shares")
        .select("*")
        .eq("child_id", childId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Share[];
    },
  });
};

export const useInvites = (childId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["invites", user?.id, childId],
    enabled: !!user && !!childId,
    queryFn: async (): Promise<Invite[]> => {
      const { data, error } = await supabase
        .from("child_invites")
        .select("*")
        .eq("child_id", childId!)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invite[];
    },
  });
};
