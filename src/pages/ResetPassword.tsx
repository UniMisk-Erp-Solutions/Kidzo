import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookHeart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and creates a session.
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setReady(true);
      return;
    }
    // Also check if a session already exists from the link.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else {
        toast.error("Reset link is invalid or has expired");
        navigate("/auth", { replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated — welcome back!");
    navigate("/home", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/30 text-primary-deep shadow-soft">
            <BookHeart className="h-7 w-7" strokeWidth={2.2} />
          </span>
          <h1 className="text-3xl font-bold text-foreground">Set a new password</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">Choose something memorable and strong.</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
          {!ready ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary-deep" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="np">New password</Label>
                <Input id="np" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp">Confirm password</Label>
                <Input id="cp" type="password" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 rounded-xl" required />
              </div>
              <Button type="submit" variant="warm" size="lg" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
