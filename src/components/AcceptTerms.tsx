import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type SignupAcknowledgements = { eligibilityAndTerms: boolean; privacy: boolean };
export const emptySignupAcknowledgements: SignupAcknowledgements = { eligibilityAndTerms: false, privacy: false };
export const hasSignupAcknowledgements = (value: SignupAcknowledgements) => value.eligibilityAndTerms && value.privacy;

export function LegalAcknowledgement({ id, checked, onChange, children }: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} className="mt-0.5 shrink-0" aria-required />
      <Label htmlFor={id} className="cursor-pointer text-[13px] font-normal leading-relaxed text-muted-foreground">
        {children}
      </Label>
    </div>
  );
}

export const LegalLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-deep underline">
    {children}
  </Link>
);

export function AcceptTerms({ id, value, onChange }: {
  id: string;
  value: SignupAcknowledgements;
  onChange: (value: SignupAcknowledgements) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Before you create an account</legend>
      <LegalAcknowledgement id={`${id}-terms`} checked={value.eligibilityAndTerms} onChange={(eligibilityAndTerms) => onChange({ ...value, eligibilityAndTerms })}>
        I confirm I am 18 or older, agree to the <LegalLink to="/legal/terms">Terms of Service</LegalLink>, and have read the <LegalLink to="/legal/privacy">Privacy Policy</LegalLink>.
      </LegalAcknowledgement>
      <LegalAcknowledgement id={`${id}-privacy`} checked={value.privacy} onChange={(privacy) => onChange({ ...value, privacy })}>
        I consent to Kidzopedia using my name, contact details, and sign-in information to create and secure my account and send verification messages, as described in the <LegalLink to="/legal/privacy">Privacy Policy</LegalLink>.
      </LegalAcknowledgement>
      <p className="text-xs leading-relaxed text-muted-foreground">
        See <LegalLink to="/legal/data-rights">Data Rights &amp; Grievance</LegalLink> to withdraw consent or request help. Optional diagnostics are managed separately in Cookie Preferences.
      </p>
    </fieldset>
  );
}
