import { Link } from "react-router-dom";
import { Callout, LegalDoc, P, Section, UL } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/pages/legal/legalConfig";

const sections: Section[] = [
  {
    id: "digital",
    title: "Digital plans — no shipping",
    body: (
      <P>
        {LEGAL.product} subscriptions (Free, Family and Premium) are digital services. Nothing is shipped. Your plan
        is activated in your account <strong>immediately</strong> after a successful payment, and you will receive an
        email receipt.
      </P>
    ),
  },
  {
    id: "books",
    title: "Printed keepsake books",
    body: (
      <>
        <UL>
          <li>Each book is printed to order from the memories and photos you choose.</li>
          <li>
            <strong>Estimated delivery: 7–14 business days</strong> from the day your order is confirmed. Printing
            happens first, then dispatch.
          </li>
          <li>We currently deliver to addresses in India.</li>
          <li>The shipping charge and any applicable tax are shown at checkout, before you pay. There are no hidden fees.</li>
          <li>You receive an email when your order is dispatched, with tracking details where the courier provides them.</li>
        </UL>
        <Callout>
          Please double-check your delivery address and phone number at checkout. We cannot redirect a parcel once it
          has been dispatched.
        </Callout>
      </>
    ),
  },
  {
    id: "problems",
    title: "Damaged, wrong or lost parcels",
    body: (
      <UL>
        <li>
          If your book arrives damaged or is not what you ordered, email us within <strong>7 days of delivery</strong>{" "}
          with a photo. We will reprint it or refund you — see the{" "}
          <Link to="/legal/refund-policy" className="font-medium text-primary-deep hover:underline">
            Cancellation &amp; Refund Policy
          </Link>
          .
        </li>
        <li>If a parcel has not arrived within 14 business days, write to us and we will trace it with the courier.</li>
      </UL>
    ),
  },
  {
    id: "contact",
    title: "Questions about an order",
    body: (
      <P>
        Email{" "}
        <a href={`mailto:${LEGAL.contactEmail}`} className="font-medium text-primary-deep hover:underline">
          {LEGAL.contactEmail}
        </a>{" "}
        with your order number. We reply within 1–2 business days.
      </P>
    ),
  },
];

const ShippingPolicy = () => (
  <LegalDoc
    title="Shipping & Delivery Policy"
    description="How Kidzopedia plans are delivered instantly, and how printed keepsake books are produced, shipped and replaced if damaged."
    sections={sections}
  />
);

export default ShippingPolicy;
