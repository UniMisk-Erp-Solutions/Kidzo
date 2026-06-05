import { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading } = useUserRole();

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-pulse rounded-full bg-primary/30" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have permission to view the master admin panel. This area is restricted to super admins only.
          </p>
          <Button asChild className="mt-6">
            <Link to="/home">Back to app</Link>
          </Button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
