import { Link } from "react-router-dom";
import { Callout, H3, LegalDoc, OL, P, Section, Table, UL } from "@/components/legal/LegalDoc";
import { LEGAL, SUBPROCESSORS } from "@/pages/legal/legalConfig";

const sections: Section[] = [
  {
    id: "roles",
    title: "Roles: who is who",
    body: (
      <>
        <Table
          head={["Role under the DPDP Act", "Who", "What it means"]}
          rows={[
            ["Data Fiduciary", `${LEGAL.entity} (operating ${LEGAL.product})`, "We decide why and how your personal data is processed, and we carry the legal responsibility for it"],
            ["Data Principal", "You — and your child", "The person the data is about. For a child, the parent or guardian exercises the rights"],
            ["Data Processor", "The sub-processors listed below", "They process data only on our documented instructions, never for their own purposes"],
          ]}
        />
        <P>
          We are not, at present, notified as a <strong>Significant Data Fiduciary</strong>. If we are ever so
          notified, we will appoint a Data Protection Officer based in India, commission independent data audits and
          carry out Data Protection Impact Assessments, as Section 10 requires — and we will say so on this page.
        </P>
      </>
    ),
  },
  {
    id: "where",
    title: "Where your data physically lives",
    body: (
      <>
        <Callout>
          Your memories, your child's profile, your growth records and every document you upload are stored on{" "}
          <strong>servers we own and operate in India</strong>. They are not on a third-party public cloud, and they
          are not reachable directly from the public internet.
        </Callout>
        <H3>The architecture, plainly</H3>
        <OL>
          <li>
            <strong>Application database (PostgreSQL).</strong> Account details, child profiles, memories, milestones,
            sharing permissions. On our own hardware, in India.
          </li>
          <li>
            <strong>Object storage (S3-compatible).</strong> Photographs, uploaded documents and generated keepsake
            PDFs. On the same infrastructure, with server-side encryption at rest.
          </li>
          <li>
            <strong>Ingress.</strong> The public internet never touches our servers directly. Traffic arrives over a
            TLS-encrypted, authenticated tunnel, so there are no open inbound ports to attack.
          </li>
          <li>
            <strong>Backups.</strong> Encrypted, taken hourly and daily, held on separate storage so that a single
            hardware failure cannot cost you your child's photographs.
          </li>
        </OL>
      </>
    ),
  },
  {
    id: "subprocessors",
    title: "Every sub-processor we use",
    body: (
      <>
        <P>
          This is the complete list. If we add one, we will update this page before we start using it, and we will
          notify you if the change materially affects how your data is handled.
        </P>
        <Table
          head={["Sub-processor", "Purpose", "Personal data it sees", "Location"]}
          rows={SUBPROCESSORS.map((s) => [s.name, s.purpose, s.data, s.location])}
        />
        <H3>Note the two that are not ours</H3>
        <UL>
          <li>
            <strong>Resend / Amazon SES (Japan).</strong> The only routine transfer of personal data outside India. It
            sees your email address and the content of the transactional email — a verification code, a reset link, a
            receipt. It never sees your child's data, your photographs or your documents.
          </li>
          <li>
            <strong>WhatsApp (Meta).</strong> If you choose phone sign-in, your mobile number and the six-digit code
            travel over WhatsApp to reach your handset. Our gateway runs on our own servers; delivery is Meta's
            network. If you would rather Meta were not involved at all, use email sign-in instead.
          </li>
        </UL>
      </>
    ),
  },
  {
    id: "safeguards",
    title: "Technical and organisational safeguards",
    body: (
      <>
        <H3>Technical</H3>
        <UL>
          <li><strong>TLS everywhere</strong> — no unencrypted transport, on any surface, including the mobile app.</li>
          <li><strong>Encryption at rest</strong> for uploaded files; <strong>salted bcrypt hashes</strong> for passwords, which are irreversible even to us.</li>
          <li>
            <strong>Row-Level Security in the database.</strong> Authorisation is enforced by PostgreSQL itself. A
            query can only return rows for a child you own or that has been shared with you, and only an "editor" share
            may write. A front-end bug cannot leak another family's data, because the front end is not what is guarding
            the door.
          </li>
          <li>
            <strong>Secrets isolation.</strong> Integration credentials live in a table with row-level security enabled
            and <em>no read policy at all</em>, so no browser session — signed in or not — can ever read them.
          </li>
          <li><strong>One-time codes</strong> for sign-in and for any change to your registered mobile number; current-password confirmation before a password change.</li>
          <li><strong>Server-side authorisation</strong> for every payment and plan change — the client cannot grant itself a paid tier.</li>
        </UL>

        <H3>Organisational</H3>
        <UL>
          <li>Access to production systems is limited to the people who must have it, and is authenticated.</li>
          <li>We practise least privilege: no shared admin logins for routine work.</li>
          <li>Backups are tested, not merely taken.</li>
          <li>Errors are monitored on our own self-hosted GlitchTip, configured not to transmit personal data.</li>
        </UL>
      </>
    ),
  },
  {
    id: "breach",
    title: "Personal data breach procedure",
    body: (
      <OL>
        <li><strong>Contain.</strong> Cut off the access path and preserve the evidence.</li>
        <li><strong>Assess.</strong> Establish what data, whose data, and how much.</li>
        <li>
          <strong>Notify the Data Protection Board of India</strong> in the form and within the time prescribed under
          the DPDP Act and Rules.
        </li>
        <li>
          <strong>Notify you</strong> — every affected Data Principal — in plain language: what happened, what data was
          involved, what we have done, and what you should do (for example, change your password).
        </li>
        <li><strong>Remediate and publish.</strong> Fix the root cause and tell you what we changed so it cannot recur.</li>
      </OL>
    ),
  },
  {
    id: "retention",
    title: "Retention and erasure",
    body: (
      <>
        <P>
          Retention periods for each category of data are set out in the{" "}
          <Link to="/legal/privacy" className="font-medium text-primary-deep hover:underline">Privacy Policy</Link>. In
          summary: we keep your keepsake for as long as your account is open; when you delete your account we erase
          your personal data within 30 days and it ages out of backups within 90; invoices are kept for 8 years because
          tax law requires it.
        </P>
        <P>
          Erasure means erasure — the row is deleted from the database and the object is deleted from storage. It is
          not merely hidden from your view.
        </P>
      </>
    ),
  },
];

const DataProcessing = () => (
  <LegalDoc
    title="Data Processing Policy"
    description="Where Kidzopedia's data physically lives, every sub-processor that touches it, the technical safeguards that protect it, and what we do if there is a breach."
    intro={
      <>
        This document is the technical companion to the Privacy Policy. It exists so that a careful parent can audit
        us: what runs where, who sees what, and what actually stops another family from reading your child's records.
      </>
    }
    sections={sections}
  />
);

export default DataProcessing;
