import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Notification = {
  id: string;
  user_id: string;
  child_id: string;
  actor_id: string | null;
  kind: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

const TABLE = "notifications" as never;

export const useNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as Notification[];
    },
  });

  // Realtime: refresh on insert/update for this user
  useEffect(() => {
    if (!user) return;
    // Unique channel name per mount to avoid reusing a channel that was
    // already subscribed (e.g. under React StrictMode double-invoke).
    const channel = supabase.channel(
      `notifications-${user.id}-${Math.random().toString(36).slice(2, 10)}`,
    );
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return query;
};

export const useUnreadCount = () => {
  const { data = [] } = useNotifications();
  return data.filter((n) => !n.read_at).length;
};

export const useMarkNotificationsRead = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      const q = supabase.from(TABLE).update({ read_at: new Date().toISOString() } as never);
      const { error } = ids && ids.length > 0 ? await q.in("id", ids) : await q.is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
};
