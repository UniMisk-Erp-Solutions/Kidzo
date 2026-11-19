import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneField } from "@/components/childbook/PhoneField";
import { AcceptTerms } from "@/components/AcceptTerms";
import type { PhoneAuth } from "@/hooks/usePhoneAuth";

interface Props {
  auth: PhoneAuth;
  loading: boolean;
}

const SendCodeForm = ({ auth, loading }: Props) => (
  <form onSubmit={auth.sendOtp} className="space-y-4">
    <div className="space-y-1.5">
      <Label htmlFor="phone">WhatsApp number</Label>
      <PhoneField
        id="phone"
        dial={auth.dial}
        local={auth.local}
        onDialChange={auth.setDial}
        onLocalChange={auth.setLocal}
      />
      <p className="text-[12px] text-muted-foreground">
        {auth.local.length >= 6 ? (
          <>We'll send a 6-digit code to <span className="font-medium text-foreground">{auth.fullPhone}</span> on WhatsApp.</>
        ) : (
          <>Pick your country, then type just your number. We'll send a 6-digit code on WhatsApp.</>
        )}
      </p>
    </div>
    <Button type="button" size="sm" variant="ghost" className="text-primary-deep" disabled={loading} onClick={auth.toggleSignup}>
      {auth.signup ? "Already have an account? Sign in" : "New to Kidzopedia? Create an account"}
    </Button>
    {auth.signup && <AcceptTerms id="accept-phone" value={auth.acknowledgements} onChange={auth.setAcknowledgements} />}
    <Button type="submit" variant="warm" size="lg" className="w-full" disabled={loading || (auth.signup && !auth.agreed)}>
      {loading ? "Sending code…" : "Send code on WhatsApp"}
    </Button>
  </form>
);

const VerifyCodeForm = ({ auth, loading }: Props) => (
  <form onSubmit={auth.verifyOtp} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="otp">Enter the 6-digit code</Label>
      <Input
        id="otp"
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={auth.otp}
        onChange={(e) => auth.setOtp(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="••••••"
        className="h-14 rounded-xl text-center font-mono text-2xl tracking-[0.5em]"
      />
      <p className="text-[12px] text-muted-foreground">
        Sent on WhatsApp to <span className="font-medium text-foreground">{auth.fullPhone}</span>
      </p>
    </div>
    <Button type="submit" variant="warm" size="lg" className="w-full" disabled={loading || auth.otp.length !== 6}>
      {loading ? "Verifying…" : "Verify & continue"}
    </Button>
    <div className="flex items-center justify-between text-[13px]">
      <button type="button" onClick={auth.useDifferentNumber} className="text-muted-foreground hover:text-foreground">
        Use a different number
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={auth.sendOtp}
        className="text-primary-deep hover:underline disabled:opacity-50"
      >
        Resend code
      </button>
    </div>
  </form>
);

/** The "Phone" tab: request a WhatsApp code, then verify it. */
export const PhoneAuthForm = ({ auth, loading }: Props) =>
  auth.otpSent ? <VerifyCodeForm auth={auth} loading={loading} /> : <SendCodeForm auth={auth} loading={loading} />;
