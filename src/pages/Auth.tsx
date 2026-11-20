import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailAuthTabs } from "@/components/auth/EmailAuthTabs";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";
import { toE164 } from "@/components/childbook/PhoneField";
import { emptySignupAcknowledgements, hasSignupAcknowledgements } from "@/components/AcceptTerms";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useEmailAuth } from "@/hooks/useEmailAuth";
import { usePhoneAuth } from "@/hooks/usePhoneAuth";
import { WashShell } from "@/components/landing/WashShell";

const signupAck = { empty: emptySignupAcknowledgements, isComplete: hasSignupAcknowledgements };

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const emailAuth = useEmailAuth({ setLoading }, navigate, signupAck);
  const phoneAuth = usePhoneAuth({ setLoading }, signupAck, toE164);

  useAuthRedirect(user, navigate);

  return (
    <WashShell className="flex min-h-screen items-center justify-center bg-gradient-warm px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo className="mb-3 h-20 w-20" />
          <h1 className="font-display text-3xl font-bold text-foreground">Kidzopedia</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">Capture every moment, celebrate every milestone.</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2 rounded-xl bg-muted">
              <TabsTrigger value="email" className="rounded-lg"><Mail className="mr-1 h-4 w-4" />Email</TabsTrigger>
              <TabsTrigger value="phone" className="rounded-lg"><Phone className="mr-1 h-4 w-4" />Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <EmailAuthTabs auth={emailAuth} loading={loading} />
            </TabsContent>

            <TabsContent value="phone" className="mt-5">
              <PhoneAuthForm auth={phoneAuth} loading={loading} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </WashShell>
  );
};

export default Auth;
