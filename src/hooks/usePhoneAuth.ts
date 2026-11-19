import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signupReceipt, type SignupAckHelpers } from "@/hooks/useEmailAuth";

const TERMS_MESSAGE = "Please confirm your age, accept the Terms, and consent to account data use to continue.";

interface Busy {
  setLoading: (loading: boolean) => void;
}

/** Phone (WhatsApp) sign-in / sign-up with a 6-digit one-time code. */
export const usePhoneAuth = (
  { setLoading }: Busy,
  ack: SignupAckHelpers,
  toE164: (dial: string, local: string) => string,
) => {
  // Country dial code + local number -> E.164
  const [dial, setDial] = useState("91");
  const [local, setLocal] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [signup, setSignup] = useState(false);
  const [acknowledgements, setAcknowledgements] = useState(ack.empty);
  const agreed = ack.isComplete(acknowledgements);
  // Full number in E.164, e.g. +919876543210 — this is what Supabase stores on auth.users.phone
  const fullPhone = toE164(dial, local);

  const toggleSignup = () => {
    setSignup((current) => !current);
    setAcknowledgements(ack.empty);
  };

  const sendOtp = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (local.replace(/[^0-9]/g, "").length < 6) {
      toast.error("Enter a valid WhatsApp number");
      return;
    }
    if (signup && !agreed) {
      toast.error(TERMS_MESSAGE);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
      options: {
        shouldCreateUser: signup,
        ...(signup ? { data: { signup_acknowledgement: signupReceipt } } : {}),
      },
    });
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

  const useDifferentNumber = () => {
    setOtpSent(false);
    setOtp("");
  };

  return {
    dial, setDial, local, setLocal, fullPhone,
    otpSent, otp, setOtp, signup, toggleSignup,
    acknowledgements, setAcknowledgements, agreed,
    sendOtp, verifyOtp, useDifferentNumber,
  };
};

export type PhoneAuth = ReturnType<typeof usePhoneAuth>;
