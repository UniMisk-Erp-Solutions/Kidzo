import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [suspended, setSuspended] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_suspended")
        .eq("id", user.id)
        .maybeSingle();
      if ((data as any)?.is_suspended) {
        toast.error("Your account has been suspended.", {
          description: "Contact support if you believe this is a mistake.",
        });
        await supabase.auth.signOut();
        setSuspended(true);
      }
      setChecking(false);
    })();
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-pulse rounded-full bg-primary/30" />
      </div>
    );
  }

  if (!user || suspended) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
