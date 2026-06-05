import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ClaimAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin");
      setExists((count ?? 0) > 0);
    })();
  }, []);

  const claim = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("claim_super_admin");
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data === true) {
      toast.success("You're now the master admin!");
      navigate("/admin");
    } else {
      toast.error("A super admin already exists.");
      setExists(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-md">
        <Link to="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Card className="mt-4 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
            <Shield className="h-7 w-7 text-primary-deep" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Claim master admin</h1>
          {exists === null ? (
            <p className="mt-2 text-sm text-muted-foreground">Checking…</p>
          ) : exists ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                A master admin already exists for this app. Ask them to grant you access from the admin panel.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                No master admin exists yet. Claim it for <span className="font-medium text-foreground">{user?.email}</span> to manage every account, plan and invoice.
              </p>
              <Button variant="warm" size="lg" className="mt-6 w-full" disabled={busy} onClick={claim}>
                {busy ? "Claiming…" : "Make me the master admin"}
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ClaimAdmin;
