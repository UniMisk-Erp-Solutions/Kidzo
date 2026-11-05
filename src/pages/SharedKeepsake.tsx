import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";

type State = { kind: "loading" } | { kind: "ready"; url: string } | { kind: "missing" };

/**
 * Public page behind a shared keepsake link (/k/<token>). The token is looked up on the server and the PDF is
 * shown from a local blob, so neither the storage host nor the file path ever appears in the address bar.
 */
const SharedKeepsake = () => {
  const { token = "" } = useParams();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        const { data: path, error } = await supabase.rpc("resolve_shared_keepsake", { _token: token });
        if (error || !path) throw error ?? new Error("not found");
        const { data } = supabase.storage.from("shared-keepsakes").getPublicUrl(path);
        const res = await fetch(data.publicUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        objectUrl = URL.createObjectURL(await res.blob());
        if (!cancelled) setState({ kind: "ready", url: objectUrl });
      } catch {
        if (!cancelled) setState({ kind: "missing" });
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <BrandLogo className="h-8 w-8" />
          <span className="text-[15px] font-semibold">Kidzopedia</span>
        </div>
        {state.kind === "ready" && (
          <Button asChild variant="outline" size="sm">
            <a href={state.url} download="keepsake.pdf">
              <Download className="h-4 w-4" /> Download
            </a>
          </Button>
        )}
      </header>

      {state.kind === "loading" && (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening the photo book…
        </div>
      )}
      {state.kind === "missing" && (
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-semibold">This link isn&apos;t available</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            It may have been turned off or copied incorrectly. Ask the person who shared it to send a new one.
          </p>
        </div>
      )}
      {state.kind === "ready" && (
        <iframe title="Shared photo book" src={state.url} className="w-full flex-1 border-0" />
      )}
    </div>
  );
};

export default SharedKeepsake;
