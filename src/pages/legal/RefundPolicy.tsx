import { Link } from "react-router-dom";
import { Callout, H3, LegalDoc, P, Section, Table, UL } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/pages/legal/legalConfig";

const sections: Section[] = [
  {
    id: "cancel",
    title: "Cancelling a plan",
    body: (
      <UL>
        <li>You can cancel a paid plan at any time from <strong>Settings → Billing</strong> inside the app.</li>
        <li>Cancelling stops the next renewal. You keep your paid features until the end of the billing period you have already paid for.</li>
        <li>Cancelling never deletes your child's memories. Your account moves to the Free plan; content beyond its limits becomes read-only and can still be viewed and exported.</li>
      </UL>
    ),
  },
  {
    id: "refunds",
    title: "When you get a refund",
    body: (
      <>
        <Table
          head={["Situation", "What happens"]}
          rows={[
            ["You cancel within 14 days of first paying for a plan", "Full refund, no questions asked"],
            ["You cancel later in a billing cycle", "No refund for the remaining part of that cycle; you keep paid features until it ends"],
            ["We are at fault — a prolonged outage, or a charge we should not have made", "Full refund"],
            ["A printed keepsake book arrives damaged or wrong", "We reprint it or refund it. Tell us within 7 days of delivery, with a photo"],
          ]}
        />
        <Callout>
          Printed books are made to order with your child's own photos, so we cannot accept returns for a change of
          mind once printing has started. You can cancel an order for a full refund any time before it enters printing.
        </Callout>
      </>
    ),
  },
  {
    id: "how",
    title: "How to request a refund",
    body: (
      <>
        <UL>
          <li>
            Email{" "}
            <a href={`mailto:${LEGAL.contactEmail}`} className="font-medium text-primary-deep hover:underline">
              {LEGAL.contactEmail}
            </a>{" "}
            from the address on your account.
          </li>
          <li>Include your order or invoice number and, for a damaged book, a clear photo of the problem.</li>
          <li>We reply within 1–2 business days.</li>
        </UL>
      </>
    ),
  },
  {
    id: "timeline",
    title: "How long a refund takes",
    body: (
      <>
        <P>
          Approved refunds are issued to the <strong>original payment method</strong> through Razorpay. They typically
          reach you within <strong>5–7 working days</strong> of approval; your bank or card issuer may take a little
          longer to show it on your statement.
        </P>
        <H3>Failed or duplicate payments</H3>
        <P>
          If money was debited but your plan did not activate, or you were charged twice, write to us. Amounts debited
          without a successful order are reversed automatically by the payment gateway, usually within 5–7 working
          days, and we will help you trace it.
        </P>
      </>
    ),
  },
  {
    id: "related",
    title: "Related policies",
    body: (
      <P>
        See also our{" "}
        <Link to="/legal/terms" className="font-medium text-primary-deep hover:underline">Terms &amp; Conditions</Link>{" "}
        and{" "}
        <Link to="/legal/shipping-policy" className="font-medium text-primary-deep hover:underline">
          Shipping &amp; Delivery Policy
        </Link>
        .
      </P>
    ),
  },
];

const RefundPolicy = () => (
  <LegalDoc
    title="Cancellation & Refund Policy"
    description="How to cancel a Kidzopedia plan, when you are entitled to a refund, and how long refunds take to reach you."
    sections={sections}
  />
);

export default RefundPolicy;
