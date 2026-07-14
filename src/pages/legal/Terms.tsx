import { Link } from "react-router-dom";
import { Callout, H3, LegalDoc, OL, P, Section, Table, UL } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/pages/legal/legalConfig";

const sections: Section[] = [
  {
    id: "agreement",
    title: "The agreement",
    body: (
      <>
        <P>
          These Terms &amp; Conditions are a binding agreement between you and {LEGAL.entity}, which operates{" "}
          {LEGAL.product}. They are an electronic record under the Information Technology Act, 2000 and do not require
          a physical signature. By creating an account, or by using {LEGAL.product} at all, you accept them.
        </P>
        <P>
          If you do not accept them, please do not use the service. If you are accepting on behalf of a family or an
          organisation, you confirm you have the authority to bind it.
        </P>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Who may use Kidzopedia",
    body: (
      <>
        <UL>
          <li>
            You must be <strong>at least 18 years old</strong> and competent to contract under the Indian Contract Act,
            1872. {LEGAL.product} is a service for parents and guardians; it is not a service for children to sign up
            to.
          </li>
          <li>
            You may add a child's information only if you are that child's <strong>parent or lawful guardian</strong>,
            or you have that person's express authority. By adding a child you confirm this, and you consent — on the
            child's behalf — to the processing described in our{" "}
            <Link to="/legal/privacy" className="font-medium text-primary-deep hover:underline">Privacy Policy</Link>.
          </li>
          <li>
            You are responsible for everyone you invite into your account. If you grant someone edit access, they can
            change and delete content.
          </li>
        </UL>
        <Callout>
          If you are not a child's parent or guardian and you have uploaded their information, you must remove it. If
          you believe someone has uploaded your child's data without authority, write to{" "}
          <a href={`mailto:${LEGAL.grievanceEmail}`} className="font-medium text-primary-deep hover:underline">{LEGAL.grievanceEmail}</a>{" "}
          and we will investigate and act.
        </Callout>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account and its security",
    body: (
      <UL>
        <li>Give us accurate information when you sign up, and keep it current.</li>
        <li>
          Keep your password and your one-time codes to yourself. We will never ask you for a code. Anyone who has your
          code can enter your account.
        </li>
        <li>
          You are responsible for what happens under your account. Tell us immediately at{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="font-medium text-primary-deep hover:underline">{LEGAL.contactEmail}</a>{" "}
          if you suspect unauthorised access, and we will help you secure it.
        </li>
        <li>One account per person. Do not share credentials — invite the person properly instead, so you keep control.</li>
      </UL>
    ),
  },
  {
    id: "your-content",
    title: "Your content stays yours",
    body: (
      <>
        <P>
          <strong>You own everything you put into {LEGAL.product}</strong> — every photograph, note, milestone and
          document. Uploading it gives us no ownership of it whatsoever.
        </P>
        <P>
          You grant us only the narrow, revocable licence we need to actually run the service for you: to store your
          content, to display it back to you and to the family members you have invited, to resize and render images so
          they load quickly, to assemble them into the keepsake books you ask us to make, and to back them up so you
          don't lose them. That licence exists for no other purpose and ends when you delete the content or your
          account.
        </P>
        <Callout>
          We will not use your family's photographs or documents to train artificial-intelligence models, we will not
          license them to anyone, and we will not use them in our marketing without asking you first and getting a
          clear "yes".
        </Callout>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <P>You agree not to use {LEGAL.product} to:</P>
        <UL>
          <li>upload another person's child's data without the authority of their parent or guardian;</li>
          <li>upload anything unlawful, obscene, or that exploits or endangers a child in any way;</li>
          <li>infringe someone else's copyright, trade mark or privacy;</li>
          <li>upload malware, or attempt to breach, probe or overload our systems or another user's account;</li>
          <li>scrape, mass-download or resell the service or its content;</li>
          <li>impersonate anyone, or misrepresent your relationship to a child.</li>
        </UL>
        <P>
          Content that sexualises, endangers or exploits a child will be removed, the account terminated permanently,
          and the matter reported to the appropriate law-enforcement authority. There is no second chance for this.
        </P>
      </>
    ),
  },
  {
    id: "plans",
    title: "Plans, payment and renewal",
    body: (
      <>
        <H3>Pricing and billing</H3>
        <UL>
          <li>Free and paid plans are described on the pricing page. Prices are shown in Indian Rupees and include applicable taxes unless stated otherwise.</li>
          <li>Payment is collected by <strong>Razorpay</strong>. We never receive or store your full card number.</li>
          <li>
            Paid plans <strong>renew automatically</strong> at the end of each billing cycle at the then-current price,
            until you cancel. We will tell you before any price change affects you.
          </li>
          <li>You can cancel at any time from Settings. Cancellation stops the next renewal; it does not retroactively refund the cycle you are in.</li>
          <li>If a payment fails, we may retry it and may suspend paid features until it succeeds. Your data is not deleted because a payment failed.</li>
        </UL>

        <H3>Refunds</H3>
        <Table
          head={["Situation", "What happens"]}
          rows={[
            ["You cancel within 14 days of first paying for a plan", "Full refund, no questions asked"],
            ["You cancel later in a billing cycle", "No refund for the remaining part of that cycle; you keep the paid features until it ends"],
            ["We are at fault — a prolonged outage or a charge we should not have made", "We refund you, in full, without you having to argue for it"],
            ["A printed keepsake book that arrives damaged or wrong", "We reprint it or refund it. Tell us within 7 days of delivery"],
          ]}
        />
        <P>
          Refunds are returned to the original payment method and typically reach you within 5–7 working days once we
          approve them. To ask for one, write to{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="font-medium text-primary-deep hover:underline">{LEGAL.contactEmail}</a>.
        </P>

        <H3>What happens if you downgrade</H3>
        <P>
          Downgrading to the free plan does not delete anything. Content beyond the free plan's limits becomes
          read-only — you can still see it, export it and delete it, you just cannot add more until you upgrade again.
          We will never hold your child's memories hostage.
        </P>
      </>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes to the service",
    body: (
      <UL>
        <li>
          We work hard to keep {LEGAL.product} available, but we do not promise uninterrupted service. Maintenance,
          outages and failures happen.
        </li>
        <li>
          We may add, change or remove features. If we remove something you rely on, or make a change that materially
          reduces the service, we will give you reasonable notice and, if you have paid for it, a fair refund.
        </li>
        <li>
          <strong>Keep your own copies of anything irreplaceable.</strong> We take backups seriously and run them
          hourly, but no service is infallible, and the export tools exist precisely so that your child's photographs
          are never in only one place.
        </li>
      </UL>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: (
      <>
        <P>
          <strong>You</strong> may delete your account at any time from Settings. When you do, we erase your personal
          data on the timetable set out in the{" "}
          <Link to="/legal/privacy" className="font-medium text-primary-deep hover:underline">Privacy Policy</Link>{" "}
          (within 30 days; backups age out within 90).
        </P>
        <P>
          <strong>We</strong> may suspend or terminate an account that breaches these Terms — in particular the child
          safety rules — or where we are required to by law. Except where the breach is serious enough to demand
          immediate action, we will warn you first and give you a chance to fix it and to export your data.
        </P>
      </>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <>
        <P>
          Nothing in these Terms excludes liability that cannot lawfully be excluded — including liability for fraud,
          for gross negligence, or for death or personal injury caused by our negligence.
        </P>
        <P>
          Subject to that, {LEGAL.product} is provided on an "as is" basis, and to the extent permitted by law our
          total liability to you arising out of the service in any twelve-month period is limited to the greater of the
          amount you paid us in that period, or ₹5,000. We are not liable for indirect or consequential loss.
        </P>
        <P>
          We are not liable for loss caused by something genuinely outside our control — a force-majeure event, an
          internet or power failure, a government action, or your own device.
        </P>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <OL>
        <li>These Terms are governed by the laws of India.</li>
        <li>
          <strong>Talk to us first.</strong> Most problems are a misunderstanding and are fixed in a day. Write to{" "}
          <a href={`mailto:${LEGAL.grievanceEmail}`} className="font-medium text-primary-deep hover:underline">{LEGAL.grievanceEmail}</a>{" "}
          and we will respond through our{" "}
          <Link to="/legal/data-rights" className="font-medium text-primary-deep hover:underline">grievance process</Link>.
        </li>
        <li>
          If a dispute cannot be resolved that way, it is subject to the exclusive jurisdiction of {LEGAL.jurisdiction}.
        </li>
        <li>
          A complaint about how we handle personal data can also be taken to the <strong>Data Protection Board of
          India</strong> once you have first raised it with us.
        </li>
      </OL>
    ),
  },
  {
    id: "misc",
    title: "The usual small print",
    body: (
      <UL>
        <li>If a court finds any clause unenforceable, the rest of these Terms survive.</li>
        <li>Our not enforcing a right immediately does not mean we have waived it.</li>
        <li>You may not assign your rights under these Terms; we may assign ours to a successor of the business, subject to the notice we promise in the Privacy Policy.</li>
        <li>
          These Terms, together with the Privacy Policy and the other documents in the{" "}
          <Link to="/legal" className="font-medium text-primary-deep hover:underline">Company &amp; Legal</Link> centre,
          are the entire agreement between us.
        </li>
      </UL>
    ),
  },
];

const Terms = () => (
  <LegalDoc
    title="Terms & Conditions"
    description="The agreement between you and Kidzopedia — eligibility, your ownership of your content, acceptable use, plans and refunds, liability, and how disputes are resolved."
    sections={sections}
  />
);

export default Terms;
