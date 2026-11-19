import { Callout, H3, LegalDoc, OL, P, Section, Table, UL } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/pages/legal/legalConfig";

const sections: Section[] = [
  {
    id: "rights",
    title: "The rights you have",
    body: (
      <>
        <Table
          head={["Right", "Section of the DPDP Act", "What you can ask for"]}
          rows={[
            ["Access", "s.11", "A summary of the personal data we process about you and your child, what we do with it, and the identity of everyone we have shared it with"],
            ["Correction & completion", "s.12", "Fix anything wrong, complete anything missing, update anything stale"],
            ["Erasure", "s.12", "Delete your personal data, unless a law requires us to keep it (for example, tax invoices)"],
            ["Grievance redressal", "s.13", "Complain to us and get a reasoned answer within the prescribed time"],
            ["Nomination", "s.14", "Nominate a person to exercise your rights if you die or are incapacitated"],
            ["Withdraw consent", "s.6(4)", "Withdraw as easily as you gave it. We stop processing on that basis"],
            ["Portability", "Contractual", "Export your memories, records and books in a usable format, from inside the app"],
          ]}
        />
        <Callout>
          You can update a profile, remove memories from the app, revoke invitations and use available exports.
          Use the request process below to withdraw account or profile consent or ask about media links and erasure.
        </Callout>
      </>
    ),
  },
  {
    id: "how",
    title: "How to make a request",
    body: (
      <>
        <P>
          To withdraw account or profile consent, email{" "}
          <a href={`mailto:${LEGAL.dpoEmail}?subject=Withdraw%20consent`} className="font-medium text-primary-deep underline">Withdraw consent</a>{" "}
          and tell us what you want to stop. Withdrawal may affect the service we can provide. If another legal basis
          still requires us to keep or process particular data, we will explain it.
        </P>
        <OL>
          <li>
            Email{" "}
            <a href={`mailto:${LEGAL.dpoEmail}`} className="font-medium text-primary-deep hover:underline">{LEGAL.dpoEmail}</a>{" "}
            from the email linked to your account if you have one. If you use phone sign-in, tell us that when you write so we can arrange an ownership check.
          </li>
          <li>
            Tell us which right you are exercising, and about whom — yourself, or your child (say which child).
          </li>
          <li>
            If we cannot verify you from the registered address alone, we will ask for one additional check, such as a
            one-time code to your registered mobile number. We will not demand identity documents we do not need.
          </li>
        </OL>
        <P>
          We do not charge for this. If a request is manifestly excessive or repetitive, we may explain why and ask you
          to narrow it, rather than simply refusing.
        </P>
      </>
    ),
  },
  {
    id: "timelines",
    title: "How quickly we respond",
    body: (
      <Table
        head={["Stage", "Our commitment"]}
        rows={[
          ["Acknowledge your request or complaint", "Within 24 hours"],
          ["Substantive response to a data-rights request", "Within 30 days"],
          ["Respond to a grievance", "Our target is 15 days. We follow any applicable statutory deadline."],
          ["Act on a consent withdrawal", "Optional settings take effect in the app. For account or profile data, contact us and we will explain what stops and what the law requires us to retain."],
          ["Account deletion and erasure", "Start from Settings or contact us about any remaining links, storage copies and applicable retention."],
        ]}
      />
    ),
  },
  {
    id: "grievance",
    title: "Grievance Officer",
    body: (
      <>
        <P>
          In accordance with the DPDP Act and the Information Technology (Intermediary Guidelines and Digital Media
          Ethics Code) Rules, 2021, the contact details of our Grievance Officer are:
        </P>
        <div className="rounded-xl border border-border bg-card p-5 text-[14px]">
          <dl className="space-y-2">
            {LEGAL.grievanceOfficerName && (
              <div className="flex gap-2">
                <dt className="w-40 shrink-0 text-muted-foreground">Name</dt>
                <dd className="font-medium text-foreground">{LEGAL.grievanceOfficerName}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">Designation</dt>
              <dd className="font-medium text-foreground">Grievance Officer, {LEGAL.product}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">Entity</dt>
              <dd className="font-medium text-foreground">{LEGAL.entity}</dd>
            </div>
            {LEGAL.registeredAddress && (
              <div className="flex gap-2">
                <dt className="w-40 shrink-0 text-muted-foreground">Address</dt>
                <dd className="font-medium text-foreground">{LEGAL.registeredAddress}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">Email</dt>
              <dd className="font-medium text-foreground">
                <a href={`mailto:${LEGAL.grievanceEmail}`} className="text-primary-deep hover:underline">
                  {LEGAL.grievanceEmail}
                </a>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">Hours</dt>
              <dd className="font-medium text-foreground">Monday to Friday, 10:00–18:00 IST</dd>
            </div>
          </dl>
        </div>
        <P>
          Write "Grievance" in the subject line and we will route it straight to the Officer rather than the general
          support queue.
        </P>
      </>
    ),
  },
  {
    id: "escalate",
    title: "If you are not satisfied with our answer",
    body: (
      <>
        <P>
          You do not have to accept our decision. You can escalate, and the law gives you a route that does not depend
          on our goodwill:
        </P>
        <OL>
          <li>
            <strong>Ask us to review.</strong> Reply and say you want the decision reviewed. A different person will
            look at it.
          </li>
          <li>
            <strong>Complain to the Data Protection Board of India.</strong> Under the DPDP Act you may complain to the
            Board about how we have handled your personal data when the applicable provisions are in force, after
            using our grievance process.
          </li>
          <li>
            <strong>Appeal.</strong> An order of the Board may be appealed to the Telecom Disputes Settlement and
            Appellate Tribunal (TDSAT), within the period the Act prescribes.
          </li>
          <li>
            <strong>Consumer forums.</strong> For a billing or service complaint, the remedies under the Consumer
            Protection Act, 2019 remain available to you.
          </li>
        </OL>
      </>
    ),
  },
  {
    id: "nomination",
    title: "Nomination — who inherits the keepsake",
    body: (
      <>
        <P>
          Section 14 gives you the right to nominate someone to exercise your rights if you die or become incapable of
          exercising them. For a product whose entire purpose is to outlast the moment it records, this is not a
          formality. Think of it as deciding who receives the album.
        </P>
        <H3>How to nominate</H3>
        <UL>
          <li>
            Email{" "}
            <a href={`mailto:${LEGAL.dpoEmail}`} className="font-medium text-primary-deep hover:underline">{LEGAL.dpoEmail}</a>{" "}
            from your registered address with the nominee's full name and email address, and your relationship to them.
          </li>
          <li>We record the nomination against your account and confirm it back to you.</li>
          <li>
            On satisfactory proof of death or incapacity, the nominee may exercise your rights — including obtaining an
            export of the keepsake, or asking us to erase it.
          </li>
          <li>You can change or cancel the nomination whenever you like.</li>
        </UL>
      </>
    ),
  },
  {
    id: "duties",
    title: "Your duties as a Data Principal",
    body: (
      <>
        <P>Section 15 of the Act asks something of you in return. You must:</P>
        <UL>
          <li>comply with the law when exercising your rights;</li>
          <li>not impersonate another person when providing personal data;</li>
          <li>not suppress material information, or provide false particulars — for example about your relationship to a child;</li>
          <li>not register a false or frivolous grievance;</li>
          <li>furnish only information that is authentic when asking us to correct or erase data.</li>
        </UL>
      </>
    ),
  },
];

const DataRights = () => (
  <LegalDoc
    title="Data Rights & Grievance Redressal"
    description="How to access, correct, erase, port or nominate under India's DPDP Act — our response timelines, our Grievance Officer, and how to escalate to the Data Protection Board."
    intro={
      <>
        A right you cannot actually use is not a right. This page tells you precisely who to write to, what we will ask
        you for, how long we will take, and exactly where to go if we let you down.
      </>
    }
    sections={sections}
  />
);

export default DataRights;
