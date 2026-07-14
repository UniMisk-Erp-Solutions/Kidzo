import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Phone, Mail } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PhoneField, toE164 } from "@/components/childbook/PhoneField";
import { AcceptTerms } from "@/components/AcceptTerms";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Email
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  // Terms + Privacy consent (required to create an account, on either route)
  const [agreedEmail, setAgreedEmail] = useState(false);
  const [agreedPhone, setAgreedPhone] = useState(false);

  // Email verification (6-digit OTP)
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");

  // Phone (WhatsApp): country dial code + local number -> E.164
  const [dial, setDial] = useState("91");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (!user) return;
    // Brand-new signups go to onboarding; the flag is set right after a
    // successful sign-up / email-verification so we win any redirect race.
    if (sessionStorage.getItem("postSignup")) {
      sessionStorage.removeItem("postSignup");
      navigate("/onboarding", { replace: true });
      return;
    }
    (async () => {
      // Block suspended users
      const { data: prof } = await supabase
        .from("profiles").select("is_suspended").eq("id", user.id).maybeSingle();
      if ((prof as any)?.is_suspended) {
        await supabase.auth.signOut();
        toast.error("Your account has been suspended.");
        return;
      }
      // Super admin → admin panel
      const { data: roleRow } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle();
      if (roleRow) {
        navigate("/admin", { replace: true });
        return;
      }
      const pending = sessionStorage.getItem("pendingInviteToken");
      if (pending) {
        sessionStorage.removeItem("pendingInviteToken");
        navigate(`/share/${pending}`, { replace: true });
        return;
      }
      const pendingPlan = sessionStorage.getItem("pendingPlan");
      if (pendingPlan) {
        sessionStorage.removeItem("pendingPlan");
        navigate(`/checkout?plan=${pendingPlan}&cycle=monthly`, { replace: true });
        return;
      }
      navigate("/home", { replace: true });
    })();
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedEmail) {
      toast.error("Please accept the Terms & Privacy Policy to continue");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    // If email confirmation is required, no session is returned yet — ask for the code.
    if (!data.session) {
      setEmailOtpSent(true);
      setEmailOtp("");
      toast.success("Check your inbox ✉️", { description: "We sent a 6-digit verification code to your email." });
      return;
    }
    // Email auto-confirm is on — straight into onboarding.
    sessionStorage.setItem("postSignup", "1");
    toast.success("Welcome to Kidzopedia! ✨", { description: "Let's set up your child's profile." });
    navigate("/onboarding", { replace: true });
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: emailOtp, type: "signup" });
    setLoading(false);
    if (error) return toast.error(error.message);
    sessionStorage.setItem("postSignup", "1");
    toast.success("Email verified! ✨", { description: "Let's set up your child's profile." });
    navigate("/onboarding", { replace: true });
  };

  const resendEmailOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Code resent — check your inbox.");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: signinEmail, password: signinPassword });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
  };

  // Full number in E.164, e.g. +919876543210 — this is what Supabase stores on auth.users.phone
  const fullPhone = toE164(dial, phoneLocal);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneLocal.replace(/[^0-9]/g, "").length < 6) {
      toast.error("Enter a valid WhatsApp number");
      return;
    }
    if (!agreedPhone) {
      toast.error("Please accept the Terms & Privacy Policy to continue");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setLoading(false);
    if (error) return toast.error(error.message);
    setOtpSent(true);
    toast.success("Code sent on WhatsApp 💬", { description: `Check WhatsApp on ${fullPhone}` });
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo className="mb-3 h-20 w-20" />
          <h1 className="text-3xl font-bold text-foreground">Kidzopedia</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">Capture every moment, celebrate every milestone.</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2 rounded-xl bg-muted">
              <TabsTrigger value="email" className="rounded-lg"><Mail className="mr-1 h-4 w-4" />Email</TabsTrigger>
              <TabsTrigger value="phone" className="rounded-lg"><Phone className="mr-1 h-4 w-4" />Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted">
                  <TabsTrigger value="signin" className="rounded-lg">Sign in</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg">Create account</TabsTrigger>
                </TabsList>
                <TabsContent value="signin" className="mt-5">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input id="signin-email" type="email" required value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input id="signin-password" type="password" required value={signinPassword} onChange={(e) => setSigninPassword(e.target.value)} className="h-11 rounded-xl" />
                    </div>
                    <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign in"}
                    </Button>
                    <Link to="/forgot-password" className="block text-center text-[13px] text-muted-foreground hover:text-foreground">
                      Forgot your password?
                    </Link>
                  </form>
                </TabsContent>
                <TabsContent value="signup" className="mt-5">
                  {!emailOtpSent ? (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Your name</Label>
                        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input id="signup-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
                        <p className="text-[12px] text-muted-foreground">At least 6 characters</p>
                      </div>
                      <AcceptTerms id="accept-email" checked={agreedEmail} onChange={setAgreedEmail} />
                      <Button type="submit" variant="warm" size="lg" className="w-full" disabled={loading || !agreedEmail}>
                        {loading ? "Creating account..." : "Create my Kidzopedia"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                      <div className="space-y-2 text-center">
                        <Label>Enter verification code</Label>
                        <p className="text-[13px] text-muted-foreground">
                          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} value={emailOtp} onChange={setEmailOtp}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <Button type="submit" variant="warm" size="lg" className="w-full" disabled={loading || emailOtp.length !== 6}>
                        {loading ? "Verifying…" : "Verify & continue"}
                      </Button>
                      <div className="flex items-center justify-between text-[13px]">
                        <button type="button" onClick={() => { setEmailOtpSent(false); setEmailOtp(""); }} className="text-muted-foreground hover:text-foreground">
                          ← Back
                        </button>
                        <button type="button" onClick={resendEmailOtp} disabled={loading} className="text-muted-foreground hover:text-foreground disabled:opacity-50">
                          Resend code
                        </button>
                      </div>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="phone" className="mt-5">
              {!otpSent ? (
                <form onSubmit={sendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">WhatsApp number</Label>
                    <PhoneField
                      id="phone"
                      dial={dial}
                      local={phoneLocal}
                      onDialChange={setDial}
                      onLocalChange={setPhoneLocal}
                    />
                    <p className="text-[12px] text-muted-foreground">
                      {phoneLocal.length >= 6 ? (
                        <>We'll send a 6-digit code to <span className="font-medium text-foreground">{fullPhone}</span> on WhatsApp.</>
                      ) : (
                        <>Pick your country, then type just your number. We'll send a 6-digit code on WhatsApp.</>
                      )}
                    </p>
                  </div>
                  <AcceptTerms id="accept-phone" checked={agreedPhone} onChange={setAgreedPhone} />
                  <Button type="submit" variant="warm" size="lg" className="w-full" disabled={loading || !agreedPhone}>
                    {loading ? "Sending code…" : "Send code on WhatsApp"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={verifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter the 6-digit code</Label>
                    <Input
                      id="otp"
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="••••••"
                      className="h-14 rounded-xl text-center font-mono text-2xl tracking-[0.5em]"
                    />
                    <p className="text-[12px] text-muted-foreground">
                      Sent on WhatsApp to <span className="font-medium text-foreground">{fullPhone}</span>
                    </p>
                  </div>
                  <Button type="submit" variant="warm" size="lg" className="w-full" disabled={loading || otp.length !== 6}>
                    {loading ? "Verifying…" : "Verify & continue"}
                  </Button>
                  <div className="flex items-center justify-between text-[13px]">
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(""); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Use a different number
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={(e) => sendOtp(e as unknown as React.FormEvent)}
                      className="text-primary-deep hover:underline disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          Your family's memories stay private — never sold, never used for ads.
        </p>
      </div>
    </div>
  );
};

export default Auth;
