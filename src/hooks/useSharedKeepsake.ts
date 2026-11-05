import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SharedKeepsakeState = { kind: "loading" } | { kind: "ready"; url: string } | { kind: "missing" };

/** Looks the share token up on the server and turns the PDF into a local blob URL, so the storage path never reaches the address bar. */
async function fetchKeepsakeBlobUrl(token: string): Promise<string> {
  const { data: path, error } = await supabase.rpc("resolve_shared_keepsake", { _token: token });
  if (error || !path) throw error ?? new Error("not found");
  const { data } = supabase.storage.from("shared-keepsakes").getPublicUrl(path);
  const res = await fetch(data.publicUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return URL.createObjectURL(await res.blob());
}

export function useSharedKeepsake(token: string): SharedKeepsakeState {
  const [state, setState] = useState<SharedKeepsakeState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    fetchKeepsakeBlobUrl(token)
      .then((url) => {
        objectUrl = url;
        if (!cancelled) setState({ kind: "ready", url });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "missing" });
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token]);

  return state;
}
