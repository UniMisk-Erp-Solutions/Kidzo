import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type InviteInfo = {
  id: string;
  child_id: string;
  child_name: string;
  owner_id: string;
  role: "viewer" | "editor";
  email: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

const Share = () => {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data, error } = await supabase.rpc("lookup_invite", { _token: token });
      if (cancel) return;
      if (error) {
        setError("Could not load this invite.");
      } else if (!data || (Array.isArray(data) && data.length === 0)) {
        setError("Invite not found.");
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        setInfo(row as InviteInfo);
      }
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [token]);

  const expired = info && new Date(info.expires_at).getTime() < Date.now();
  const used = info && (info.accepted_at || info.revoked_at);

  const handleAccept = async () => {
    if (!user) {
      sessionStorage.setItem("pendingInviteToken", token);
      navigate("/auth");
      return;
    }
    setAccepting(true);
    const { error } = await supabase.rpc("accept_invite", { _token: token });
    setAccepting(false);
    if (error) {
      toast.error(error.message ?? "Couldn't accept invite");
      return;
    }
    toast.success("You're in! Welcome 💛");
    navigate("/home", { replace: true });
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary-deep" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lift animate-fade-in-up">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/25 text-secondary">
          <Heart className="h-7 w-7" fill="currentColor" />
        </span>

        {error || !info ? (
          <>
            <h1 className="text-xl font-semibold text-foreground">Invite unavailable</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">{error ?? "This invite couldn't be found."}</p>
            <Button variant="soft" className="mt-5 w-full" onClick={() => navigate("/")}>
              Go home
            </Button>
          </>
        ) : used ? (
          <>
            <h1 className="text-xl font-semibold text-foreground">This invite has already been used</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">Ask the family to send a fresh one.</p>
            <Button variant="soft" className="mt-5 w-full" onClick={() => navigate("/")}>
              Go home
            </Button>
          </>
        ) : expired ? (
          <>
            <h1 className="text-xl font-semibold text-foreground">This invite has expired</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">Ask for a new link from the parent.</p>
            <Button variant="soft" className="mt-5 w-full" onClick={() => navigate("/")}>
              Go home
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-foreground">
              You're invited to {info.child_name}'s journey
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              You'll be added as a{" "}
              <span className="font-semibold text-foreground">{info.role === "editor" ? "co-editor" : "viewer"}</span>.
            </p>
            <Button variant="warm" size="lg" className="mt-6 w-full" onClick={handleAccept} disabled={accepting}>
              {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
              {user ? "Accept invite" : "Sign in to accept"}
            </Button>
            {!user && (
              <p className="mt-3 text-[12px] text-muted-foreground">
                You'll come back here automatically after sign-in.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Share;
