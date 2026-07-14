import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * One tick covering both policies — required before an account can be created.
 *
 * The links open in a new tab on purpose: reading the Terms must never cost the
 * user the form they were half-way through filling in.
 *
 * The guardian sentence is not decoration. Under s.9 of the DPDP Act a child's
 * data may only be processed with verifiable parental consent, so this is the
 * moment we obtain it.
 */
export const AcceptTerms = ({
  checked,
  onChange,
  id = "accept-terms",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) => (
  <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3">
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(v) => onChange(v === true)}
      className="mt-0.5 shrink-0"
      aria-required
    />
    <Label htmlFor={id} className="cursor-pointer text-[13px] font-normal leading-relaxed text-muted-foreground">
      I agree to the{" "}
      <Link
        to="/legal/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary-deep hover:underline"
      >
        Terms &amp; Conditions
      </Link>{" "}
      and{" "}
      <Link
        to="/legal/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary-deep hover:underline"
      >
        Privacy Policy
      </Link>
      , and I confirm I am the parent or lawful guardian of any child I add.
    </Label>
  </div>
);
