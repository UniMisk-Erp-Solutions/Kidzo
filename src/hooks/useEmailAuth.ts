import { useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LEGAL } from "@/lib/legalConfig";

export const signupReceipt = {
  terms_version: LEGAL.termsVersion,
  privacy_version: LEGAL.privacyVersion,
  adult_confirmed: true,
  account_data_consented: true,
};

/** The empty/complete checks for the sign-up acknowledgements, supplied by the page that renders them. */
export interface SignupAckHelpers {
  empty: { eligibilityAndTerms: boolean; privacy: boolean };
  isComplete: (value: { eligibilityAndTerms: boolean; privacy: boolean }) => boolean;
}

interface Busy {
  setLoading: (loading: boolean) => void;
}

/** Email + password sign-in / sign-up with 6-digit email verification. */
export const useEmailAuth = ({ setLoading }: Busy, navigate: NavigateFunction, ack: SignupAckHelpers) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [acknowledgements, setAcknowledgements] = useState(ack.empty);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const agreed = ack.isComplete(acknowledgements);

  const goToOnboarding = () => {
    sessionStorage.setItem("postSignup", "1");
    navigate("/onboarding", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please confirm your age, accept the Terms, and consent to account data use to continue.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name, signup_acknowledgement: signupReceipt } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    // If email confirmation is required, no session is returned yet — ask for the code.
    if (!data.session) {
      setOtpSent(true);
      setOtp("");
      toast.success("Check your inbox ✉️", { description: "We sent a 6-digit verification code to your email." });
      return;
    }
    // Email auto-confirm is on — straight into onboarding.
    toast.success("Welcome to Kidzopedia! ✨", { description: "Let's set up your child's profile." });
    goToOnboarding();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "signup" });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Email verified! ✨", { description: "Let's set up your child's profile." });
    goToOnboarding();
  };

  const resendOtp = async () => {
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

  const backFromOtp = () => {
    setOtpSent(false);
    setOtp("");
  };

  return {
    name, setName, email, setEmail, password, setPassword,
    signinEmail, setSigninEmail, signinPassword, setSigninPassword,
    acknowledgements, setAcknowledgements, agreed,
    otpSent, otp, setOtp,
    handleSignUp, handleVerifyOtp, resendOtp, handleSignIn, backFromOtp,
  };
};

export type EmailAuth = ReturnType<typeof useEmailAuth>;
