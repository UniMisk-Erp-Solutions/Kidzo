import { Link } from "react-router-dom";
import { Callout, LegalDoc, P, Section, UL } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/pages/legal/legalConfig";

const sections: Section[] = [
  {
    id: "not-medical",
    title: "Not medical advice",
    body: (
      <>
        <Callout>
          {LEGAL.product} is a keepsake and a filing cabinet. It is <strong>not</strong> a medical device, not a
          diagnostic tool, and not a substitute for a paediatrician.
        </Callout>
        <UL>
          <li>
            Growth charts plot the numbers <em>you</em> entered. They are a record, not an assessment. We do not
            validate them and we do not interpret them.
          </li>
          <li>
            Milestone prompts are drawn from broad, published age ranges. Children develop at wildly different paces.
            A prompt that has not been ticked means nothing on its own.
          </li>
          <li>
            Vaccination and medical records you upload are <strong>stored</strong> for you, not checked. We do not
            verify them, remind you of clinical schedules, or tell you if something is missing.
          </li>
          <li>
            <strong>If you have any concern about your child's health or development, speak to a qualified
            doctor.</strong> Never delay seeking medical advice because of something you saw — or did not see — in this
            app.
          </li>
        </UL>
      </>
    ),
  },
  {
    id: "not-legal",
    title: "Not legal, financial or educational advice",
    body: (
      <UL>
        <li>
          Storing a birth certificate, an identity document or a school report in {LEGAL.product} does not make it
          legally certified, authenticated or admissible. It is a convenience copy.
        </li>
        <li>Nothing in the app is legal, tax, financial or educational advice. Consult a professional.</li>
        <li>
          The documents in our{" "}
          <Link to="/legal" className="font-medium text-primary-deep hover:underline">Company &amp; Legal</Link>{" "}
          centre describe our own practices. They are not legal advice to you.
        </li>
      </UL>
    ),
  },
  {
    id: "accuracy",
    title: "Accuracy of content",
    body: (
      <>
        <P>
          Almost everything in {LEGAL.product} was put there by you or by a family member you invited. We do not
          verify, correct or moderate it. If a date is wrong, a measurement mistyped or a photograph mislabelled, that
          is content you control — and can fix.
        </P>
        <P>
          Where we publish general information (for example, typical milestone age ranges), we take care to be
          accurate, but we make no warranty that it is complete, current or applicable to your child.
        </P>
      </>
    ),
  },
  {
    id: "availability",
    title: "Availability and preservation",
    body: (
      <>
        <P>
          We take this seriously — encrypted hourly and daily backups, stored separately — precisely because this data
          is irreplaceable. But no service can promise perpetual, uninterrupted availability, and we will not pretend
          otherwise.
        </P>
        <Callout>
          <strong>Please keep your own copy of anything irreplaceable.</strong> The export tools exist for exactly this
          reason. A photograph of your child's first steps should not live in only one place — not even ours.
        </Callout>
        <P>
          Our liability, and its limits, are set out in the{" "}
          <Link to="/legal/terms" className="font-medium text-primary-deep hover:underline">Terms &amp; Conditions</Link>.
        </P>
      </>
    ),
  },
  {
    id: "third-party",
    title: "Third-party links and services",
    body: (
      <P>
        Where the app links to a third party, or relies on one (such as Razorpay for payment, or WhatsApp to deliver a
        code), that party's own terms and privacy policy govern what it does. We choose our sub-processors carefully
        and list every one of them in the{" "}
        <Link to="/legal/data-processing" className="font-medium text-primary-deep hover:underline">
          Data Processing Policy
        </Link>
        , but we do not control them.
      </P>
    ),
  },
];

const Disclaimer = () => (
  <LegalDoc
    title="Disclaimer"
    description="What Kidzopedia is and is not — a keepsake, not a medical, legal or financial adviser — and why you should always keep your own copy of what is irreplaceable."
    sections={sections}
  />
);

export default Disclaimer;
