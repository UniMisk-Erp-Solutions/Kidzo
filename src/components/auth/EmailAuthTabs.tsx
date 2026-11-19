import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AcceptTerms } from "@/components/AcceptTerms";
import type { EmailAuth } from "@/hooks/useEmailAuth";

interface PanelProps {
  auth: EmailAuth;
  loading: boolean;
}

const SignInForm = ({ auth, loading }: PanelProps) => (
  <form onSubmit={auth.handleSignIn} className="space-y-4">
    <div className="space-y-1.5">
      <Label htmlFor="signin-email">Email</Label>
      <Input id="signin-email" name="email" type="email" autoComplete="username" required value={auth.signinEmail} onChange={(e) => auth.setSigninEmail(e.target.value)} className="h-11 rounded-xl" />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="signin-password">Password</Label>
      <Input id="signin-password" name="password" type="password" autoComplete="current-password" required value={auth.signinPassword} onChange={(e) => auth.setSigninPassword(e.target.value)} className="h-11 rounded-xl" />
    </div>
    <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
      {loading ? "Signing in..." : "Sign in"}
    </Button>
    <Link to="/forgot-password" className="block text-center text-[13px] text-muted-foreground hover:text-foreground">
      Forgot your password?
    </Link>
  </form>
);

const SignUpForm = ({ auth, loading }: PanelProps) => (
  <form onSubmit={auth.handleSignUp} className="space-y-4">
    <div className="space-y-1.5">
      <Label htmlFor="name">Your name</Label>
      <Input id="name" required value={auth.name} onChange={(e) => auth.setName(e.target.value)} placeholder="Alex" className="h-11 rounded-xl" />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="signup-email">Email</Label>
      <Input id="signup-email" name="email" type="email" autoComplete="email" required value={auth.email} onChange={(e) => auth.setEmail(e.target.value)} className="h-11 rounded-xl" />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="signup-password">Password</Label>
      <Input id="signup-password" name="password" type="password" autoComplete="new-password" required minLength={6} value={auth.password} onChange={(e) => auth.setPassword(e.target.value)} className="h-11 rounded-xl" />
      <p className="text-[12px] text-muted-foreground">At least 6 characters</p>
    </div>
    <AcceptTerms id="accept-email" value={auth.acknowledgements} onChange={auth.setAcknowledgements} />
    <Button type="submit" variant="warm" size="lg" className="w-full" disabled={loading || !auth.agreed}>
      {loading ? "Creating account..." : "Create my Kidzopedia"}
    </Button>
  </form>
);

const VerifyForm = ({ auth, loading }: PanelProps) => (
  <form onSubmit={auth.handleVerifyOtp} className="space-y-4">
    <div className="space-y-2 text-center">
      <Label>Enter verification code</Label>
      <p className="text-[13px] text-muted-foreground">
        We sent a 6-digit code to <span className="font-medium text-foreground">{auth.email}</span>
      </p>
    </div>
    <div className="flex justify-center">
      <InputOTP maxLength={6} value={auth.otp} onChange={auth.setOtp}>
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
    <Button type="submit" variant="warm" size="lg" className="w-full" disabled={loading || auth.otp.length !== 6}>
      {loading ? "Verifying…" : "Verify & continue"}
    </Button>
    <div className="flex items-center justify-between text-[13px]">
      <button type="button" onClick={auth.backFromOtp} className="text-muted-foreground hover:text-foreground">
        ← Back
      </button>
      <button type="button" onClick={auth.resendOtp} disabled={loading} className="text-muted-foreground hover:text-foreground disabled:opacity-50">
        Resend code
      </button>
    </div>
  </form>
);

/** The "Email" tab: sign in, create account, and the verification-code step. */
export const EmailAuthTabs = ({ auth, loading }: PanelProps) => (
  <Tabs defaultValue="signin" className="w-full">
    <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted">
      <TabsTrigger value="signin" className="rounded-lg">Sign in</TabsTrigger>
      <TabsTrigger value="signup" className="rounded-lg">Create account</TabsTrigger>
    </TabsList>
    <TabsContent value="signin" className="mt-5">
      <SignInForm auth={auth} loading={loading} />
    </TabsContent>
    <TabsContent value="signup" className="mt-5">
      {auth.otpSent ? <VerifyForm auth={auth} loading={loading} /> : <SignUpForm auth={auth} loading={loading} />}
    </TabsContent>
  </Tabs>
);
