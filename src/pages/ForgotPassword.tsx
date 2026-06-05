import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookHeart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your email 💌");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/30 text-primary-deep shadow-soft">
            <BookHeart className="h-7 w-7" strokeWidth={2.2} />
          </span>
          <h1 className="text-3xl font-bold text-foreground">Reset your password</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">We'll send a secure link to your email.</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-foreground">If an account exists for <span className="font-semibold">{email}</span>, a reset link is on its way.</p>
              <Link to="/auth" className="inline-flex items-center gap-1.5 text-sm text-primary-deep hover:underline">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="em">Email</Label>
                <Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <Button type="submit" variant="warm" size="lg" className="w-full" disabled={sending || !email}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send reset link
              </Button>
              <Link to="/auth" className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
