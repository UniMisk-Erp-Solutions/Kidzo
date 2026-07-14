import { Link } from "react-router-dom";
import { Callout, H3, LegalDoc, OL, P, Section, Table, UL } from "@/components/legal/LegalDoc";
import { LEGAL, SUBPROCESSORS } from "@/pages/legal/legalConfig";

const sections: Section[] = [
  {
    id: "who-we-are",
    title: "Who we are and what this policy covers",
    body: (
      <>
        <P>
          {LEGAL.product} is a private digital keepsake operated by {LEGAL.entity}. Parents and guardians use it to
          record memories, track milestones and store their child's important documents. Because of what the service
          is, almost everything you put into it is personal data — and a great deal of it is personal data{" "}
          <em>about a child</em>. We have written this policy on that assumption.
        </P>
        <P>
          Under India's Digital Personal Data Protection Act, 2023 (the "<strong>DPDP Act</strong>") we are the{" "}
          <strong>Data Fiduciary</strong> — the person who determines the purpose and means of processing your
          personal data. You are the <strong>Data Principal</strong>. Where your child's data is concerned, you act
          for your child, who is also a Data Principal.
        </P>
        <P>
          This policy applies to the {LEGAL.product} website, the web app, the Android app and the emails and WhatsApp
          messages we send you. It sits alongside our{" "}
          <Link to="/legal/terms" className="font-medium text-primary-deep hover:underline">Terms &amp; Conditions</Link>,{" "}
          <Link to="/legal/data-processing" className="font-medium text-primary-deep hover:underline">Data Processing Policy</Link> and{" "}
          <Link to="/legal/cookies" className="font-medium text-primary-deep hover:underline">Cookie Policy</Link>.
        </P>
        <Callout>
          <strong>The short version.</strong> We collect what we need to run the service and nothing else. We do not
          sell your data. We do not advertise to you or to your child. We do not use your child's photographs or
          records to train anyone's AI models. Your files live on our own servers in India. You can export or delete
          everything at any time.
        </Callout>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What personal data we collect",
    body: (
      <>
        <H3>Data you give us directly</H3>
        <Table
          head={["Category", "Examples", "Why we need it"]}
          rows={[
            [
              "Account data",
              "Display name, email address and/or mobile number, password (stored only as a salted hash — we never see it)",
              "To create your account, sign you in, and secure it",
            ],
            [
              "Child profile data",
              "Child's name, date of birth, pronouns, avatar photograph, relationship to you",
              "To organise the keepsake around your child and calculate age and milestones",
            ],
            [
              "Memories and media",
              "Photographs, captions, notes, dates, locations you choose to add",
              "This is the core of the product — it is the keepsake itself",
            ],
            [
              "Milestones and growth",
              "Height, weight, first words, achievements and the dates you record them",
              "To show growth charts and milestone timelines",
            ],
            [
              "Records and documents",
              "Files you upload: birth certificates, vaccination and medical records, school reports, ID documents",
              "So you can find them when you need them. These are held for you, not analysed by us",
            ],
            [
              "Sharing data",
              "Email addresses of family members you invite, and the permission (view or edit) you grant them",
              "To send the invitation and enforce what each person can see or change",
            ],
            [
              "Payment data",
              "Name, email, plan chosen, and the payment/transaction identifiers returned by Razorpay",
              "To take payment and issue an invoice",
            ],
            [
              "Support data",
              "What you write to us in an email or the contact form",
              "To answer you",
            ],
          ]}
        />

        <H3>Data we collect automatically</H3>
        <UL>
          <li>
            <strong>Technical and security data</strong> — IP address, browser and device type, timestamps of sign-in
            attempts. Used to keep the account secure and to detect abuse. Retained for a short period.
          </li>
          <li>
            <strong>Error and crash diagnostics</strong> — if you consent, a technical report when something breaks
            (the error message, the page, the browser). This runs on our own GlitchTip server with personally
            identifiable information switched off. You can refuse this and the app works exactly the same. See{" "}
            <Link to="/legal/cookie-preferences" className="font-medium text-primary-deep hover:underline">Cookie Preferences</Link>.
          </li>
          <li>
            <strong>Essential storage</strong> — the sign-in token that keeps you logged in, your theme choice, and
            your consent choice. Detailed one by one in the{" "}
            <Link to="/legal/cookies" className="font-medium text-primary-deep hover:underline">Cookie Policy</Link>.
          </li>
        </UL>

        <H3>What we deliberately do <em>not</em> collect</H3>
        <UL>
          <li>We do not use advertising or social-media tracking pixels. There are none in the product.</li>
          <li>We do not buy personal data from data brokers or enrich your profile from outside sources.</li>
          <li>We do not run facial recognition on your photographs, and we do not scan your documents for content.</li>
          <li>We do not use your content to train machine-learning models — ours or anyone else's.</li>
        </UL>
      </>
    ),
  },
  {
    id: "children",
    title: "Children's data — our most important obligation",
    body: (
      <>
        <P>
          Section 9 of the DPDP Act sets special rules for the personal data of children (in India, anyone under{" "}
          <strong>eighteen</strong>). {LEGAL.product} exists to hold children's data, so these rules are the centre of
          how we are built, not a footnote.
        </P>
        <Callout>
          <strong>Our commitments, which mirror the statute:</strong>
          <UL>
            <li>
              We process a child's personal data only on the basis of{" "}
              <strong>verifiable consent of the parent or lawful guardian</strong>. That is the account holder — you.
            </li>
            <li>
              We do <strong>not</strong> undertake tracking or behavioural monitoring of children.
            </li>
            <li>
              We do <strong>not</strong> serve targeted advertising to children. We serve no advertising at all.
            </li>
            <li>
              We do not process children's data in any way likely to cause a detrimental effect on the well-being of
              the child.
            </li>
          </UL>
        </Callout>
        <H3>How parental consent works here</H3>
        <OL>
          <li>
            Only an adult can hold a {LEGAL.product} account. By creating one you confirm you are the parent or lawful
            guardian of the child you add, or that you have that person's authority.
          </li>
          <li>
            We verify your identity as the account holder through a one-time code sent to your email address or your
            WhatsApp number before the account becomes usable. This is our verifiable-consent mechanism.
          </li>
          <li>
            When you invite a family member, you decide whether they may only <em>view</em> or also <em>edit</em>. That
            grant is your consent for them to see the child's data, and you can revoke it at any moment from the Family
            screen. Revocation takes effect immediately at the database level.
          </li>
          <li>
            A child who has reached majority may write to us at{" "}
            <a href={`mailto:${LEGAL.dpoEmail}`} className="font-medium text-primary-deep hover:underline">{LEGAL.dpoEmail}</a>{" "}
            to obtain a copy of their data or to ask for it to be erased, and we will verify and act on that request.
          </li>
        </OL>
      </>
    ),
  },
  {
    id: "why",
    title: "Why we process your data (purpose and lawful basis)",
    body: (
      <>
        <P>
          Under the DPDP Act personal data may be processed only for a lawful purpose, either with your consent or for
          a "legitimate use" listed in the Act. We rely almost entirely on <strong>consent</strong>, given by you when
          you create the account and when you choose to add each piece of content.
        </P>
        <Table
          head={["Purpose", "Basis", "What happens if you say no"]}
          rows={[
            [
              "Create and secure your account; sign you in",
              "Consent + performance of the service you asked for",
              "We cannot provide the service at all",
            ],
            [
              "Store and display the memories, milestones and documents you add",
              "Consent (given each time you upload)",
              "Simply don't add them — the rest of the app still works",
            ],
            [
              "Send you a verification code by email or WhatsApp",
              "Consent; necessary to prove the account is yours",
              "We cannot verify the account and it cannot be created",
            ],
            [
              "Take payment for a paid plan and issue an invoice",
              "Consent + our legal obligation to keep tax records",
              "Stay on the free plan",
            ],
            [
              "Fix crashes using error diagnostics",
              "Consent — strictly opt-in",
              "Nothing. The app works identically; we just fix bugs more slowly",
            ],
            [
              "Detect and prevent abuse, fraud and unauthorised access",
              "Legitimate use — protecting the security of the service",
              "This cannot be turned off; it protects every family on the platform",
            ],
            [
              "Answer your support email",
              "Consent (you wrote to us)",
              "Don't write to us",
            ],
          ]}
        />
        <P>
          We will not use your data for a new purpose that is incompatible with the one you consented to. If we ever
          want to, we will ask you first.
        </P>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share data with",
    body: (
      <>
        <P>
          We <strong>never sell</strong> personal data and we do not share it for anyone else's marketing. We share it
          only in these four situations:
        </P>
        <OL>
          <li>
            <strong>People you choose.</strong> Family members you invite see exactly what you granted them — view or
            edit — and nothing from any other child or account.
          </li>
          <li>
            <strong>Sub-processors who run part of the service.</strong> Each is bound to process data only on our
            instructions. The complete list, including what each one sees and where it sits, is below and in the{" "}
            <Link to="/legal/data-processing" className="font-medium text-primary-deep hover:underline">Data Processing Policy</Link>.
          </li>
          <li>
            <strong>Where the law requires it.</strong> If we receive a valid, lawful order from a court or a competent
            authority we will comply, but we will insist it is properly served, disclose the minimum necessary, and
            tell you unless we are legally forbidden from doing so.
          </li>
          <li>
            <strong>A business transfer.</strong> If the service is ever acquired or merged, your data may transfer to
            the acquirer. We will notify you first and the acquirer will be bound by this policy or you may take your
            data and leave.
          </li>
        </OL>
        <Table
          head={["Sub-processor", "What it does", "What it sees", "Where"]}
          rows={SUBPROCESSORS.map((s) => [s.name, s.purpose, s.data, s.location])}
        />
      </>
    ),
  },
  {
    id: "transfers",
    title: "Where your data lives, and cross-border transfers",
    body: (
      <>
        <P>
          Your account, your child's profile, your memories, your growth records and every document you upload are
          stored on <strong>servers we own and operate in India</strong>. We deliberately do not put your family's
          photographs on a third-party public cloud.
        </P>
        <H3>The one transfer outside India</H3>
        <P>
          Transactional email — your verification code, password reset, and payment receipts — is delivered through
          Resend, which sends via Amazon SES in the <strong>ap-northeast-1 (Tokyo, Japan)</strong> region. This means
          your email address and the contents of that specific email are processed outside India.
        </P>
        <P>
          Section 16 of the DPDP Act permits transfer of personal data outside India except to territories that the
          Central Government restricts by notification. Japan is not, at the date of this policy, a restricted
          territory. We monitor that list and will change provider if it changes.
        </P>
        <P>
          WhatsApp one-time codes are handed to WhatsApp (Meta) for delivery to your handset. Our gateway is on our own
          servers; delivery across the WhatsApp network is Meta's infrastructure.
        </P>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <>
        <P>
          The DPDP Act requires us to erase personal data once the purpose is served and retention is no longer
          necessary for a legal purpose. Concretely:
        </P>
        <Table
          head={["Data", "Retention", "Then what"]}
          rows={[
            ["Your account, children, memories, milestones, documents", "For as long as your account is open", "Kept — it is the keepsake you asked us to hold"],
            ["Everything above, after you delete your account", "Erased within 30 days", "Permanently deleted from the database and from object storage. Backups age out within 90 days"],
            ["An individual memory, milestone or document you delete", "Removed immediately", "Purged from backups within 90 days"],
            ["A revoked family-member invitation", "Access ends immediately", "The invitation record is kept only as an audit trail of who had access"],
            ["Invoices and payment records", "8 years", "Required by Indian tax law. We cannot delete these on request"],
            ["Security and sign-in logs", "90 days", "Deleted"],
            ["Error diagnostics (if you consented)", "90 days", "Deleted"],
          ]}
        />
        <P>
          We will also give you advance notice before erasing anything because of prolonged inactivity, so you always
          have the chance to export first.
        </P>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect your data",
    body: (
      <>
        <P>
          Section 8(5) of the DPDP Act requires reasonable security safeguards. These are the ones we actually operate
          — not aspirations:
        </P>
        <UL>
          <li>
            <strong>Encryption in transit.</strong> Every connection to {LEGAL.product} is TLS-encrypted. The app is
            served only over HTTPS, and traffic reaches our servers through an authenticated Cloudflare tunnel — our
            servers are not directly exposed to the public internet.
          </li>
          <li>
            <strong>Encryption at rest.</strong> Files are held in our object storage with server-side encryption;
            passwords are stored only as salted bcrypt hashes and are never recoverable, even by us.
          </li>
          <li>
            <strong>Row-Level Security.</strong> This is the important one. Access control is enforced in the database
            itself, not merely in the app. Every table carries policies so that a query can only ever return rows for
            children you own or that have been explicitly shared with you, and only an "editor" share can write. Even
            if a bug existed in our front-end code, the database would still refuse to hand over another family's data.
          </li>
          <li>
            <strong>Least privilege.</strong> Secrets and API keys are held in a table with row-level security enabled
            and no read policy, meaning no browser session can ever read them — only the server can.
          </li>
          <li>
            <strong>Strong authentication.</strong> Sign-in by password, or by a one-time code delivered to your email
            or WhatsApp. Changing your password requires your current password. Changing your mobile number requires a
            fresh one-time code sent to the new number.
          </li>
          <li>
            <strong>Backups.</strong> Encrypted backups are taken on an hourly and daily cycle and stored separately,
            so a hardware failure cannot cost you your child's photographs.
          </li>
          <li>
            <strong>Monitoring.</strong> Self-hosted error monitoring alerts us to failures. It is configured not to
            send personal data.
          </li>
        </UL>
        <H3>If there is ever a breach</H3>
        <P>
          If a personal data breach occurs we will notify the <strong>Data Protection Board of India</strong> and every
          affected Data Principal, in the form and within the time the DPDP Rules require. Our notice to you will tell
          you in plain language what happened, what data was involved, what we have done about it, and what you should
          do. We will not quietly absorb a breach.
        </P>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <P>The DPDP Act gives you the following rights, and we honour every one of them:</P>
        <UL>
          <li>
            <strong>Right to access information (s.11)</strong> — a summary of the personal data we process about you
            and your child, and the identities of everyone we have shared it with.
          </li>
          <li>
            <strong>Right to correction and erasure (s.12)</strong> — correct anything inaccurate, complete anything
            incomplete, update it, or have it erased.
          </li>
          <li>
            <strong>Right to grievance redressal (s.13)</strong> — a readily available means of complaining to us, and
            an answer within the prescribed period.
          </li>
          <li>
            <strong>Right to nominate (s.14)</strong> — nominate someone to exercise these rights on your behalf if you
            die or become incapacitated. For a keepsake meant to outlive us, this matters more than usual.
          </li>
          <li>
            <strong>Right to withdraw consent</strong> — as easily as you gave it. Withdrawal does not undo processing
            that already lawfully happened, and we will stop processing within a reasonable time.
          </li>
          <li>
            <strong>Right to data portability</strong> — export your memories and books at any time from the app.
          </li>
        </UL>
        <P>
          How to exercise any of these, what we will ask you for, how long we take, and how to escalate to the Data
          Protection Board is set out in full in{" "}
          <Link to="/legal/data-rights" className="font-medium text-primary-deep hover:underline">
            Data Rights &amp; Grievance Redressal
          </Link>
          .
        </P>
        <H3>Your duties</H3>
        <P>
          Section 15 of the Act also places duties on you: not to impersonate someone else, not to suppress material
          information, not to register a false or frivolous grievance, and to furnish only authentic information.
        </P>
      </>
    ),
  },
  {
    id: "other-laws",
    title: "Other laws we comply with",
    body: (
      <UL>
        <li>
          <strong>Information Technology Act, 2000</strong> (including s.43A and s.72A) and the{" "}
          <strong>SPDI Rules, 2011</strong> — reasonable security practices for sensitive personal data such as health
          records and passwords.
        </li>
        <li>
          <strong>IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong> — publication of
          grievance officer contact details and adherence to complaint timelines.
        </li>
        <li>
          <strong>Consumer Protection Act, 2019</strong> and the <strong>E-Commerce Rules, 2020</strong> — fair
          disclosure of price, refunds and grievance handling for paid plans.
        </li>
        <li>
          <strong>Payment and card data</strong> — handled entirely by Razorpay, a PCI-DSS compliant payment
          aggregator. Card numbers never reach our servers.
        </li>
        <li>
          <strong>GDPR</strong> — if you use {LEGAL.product} from the European Economic Area or the UK, we will honour
          the equivalent rights (access, rectification, erasure, restriction, portability, objection) through the same
          contact route.
        </li>
      </UL>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <>
        <P>
          We will update this policy when the service or the law changes. The "Last updated" date at the top always
          reflects the current version. If a change materially affects your rights or introduces a new purpose for
          processing, we will tell you by email and, where the law requires it, ask for fresh consent before the change
          applies to you. We will not make a material change quietly.
        </P>
      </>
    ),
  },
];

const Privacy = () => (
  <LegalDoc
    title="Privacy Policy"
    description="What personal data Kidzopedia collects, why, who sees it, how long we keep it, how we secure it, and the rights you have under India's DPDP Act, 2023."
    intro={
      <>
        This policy is written to be read, not to be survived. If you only read one section, read{" "}
        <a href="#children" className="font-medium text-primary-deep hover:underline">Children's data</a> — it is the
        part that matters most for a product like this one.
      </>
    }
    sections={sections}
  />
);

export default Privacy;
