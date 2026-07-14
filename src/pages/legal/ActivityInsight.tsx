import { Link } from "react-router-dom";
import { Callout, H3, LegalDoc, P, Section, Table, UL } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/pages/legal/legalConfig";

const sections: Section[] = [
  {
    id: "what",
    title: "What this notice is",
    body: (
      <>
        <P>
          {LEGAL.product} shows you insights: how your child has grown, which milestones are coming up, how many
          memories you captured this month, what happened on this day last year. This notice explains where those
          insights come from, and — more importantly — the lines we will not cross to produce them.
        </P>
        <Callout>
          Every insight in {LEGAL.product} is computed from data <strong>you</strong> deliberately entered, and is
          shown only <strong>back to you</strong> and the family you invited. Insights are not built from tracking your
          child, and they are never used to advertise to anyone.
        </Callout>
      </>
    ),
  },
  {
    id: "sources",
    title: "What the insights are computed from",
    body: (
      <Table
        head={["Insight you see", "Computed from", "Who can see it"]}
        rows={[
          ["Age, and age at the time of a memory", "The child's date of birth that you entered", "You and family members you invited"],
          ["Growth charts", "Height and weight measurements you recorded", "You and family members you invited"],
          ["Milestone timeline and 'coming up' prompts", "Milestones you logged, against typical age ranges", "You and family members you invited"],
          ["'On this day' and memory counts", "The dates on the memories you added", "You and family members you invited"],
          ["Keepsake book suggestions", "Which memories you starred or added recently", "You only"],
        ]}
      />
    ),
  },
  {
    id: "never",
    title: "What we never do",
    body: (
      <>
        <P>
          Section 9 of the DPDP Act prohibits tracking, behavioural monitoring and targeted advertising directed at
          children. We go further, because the prohibition is also simply the right way to build this product:
        </P>
        <UL>
          <li>
            <strong>No behavioural tracking of children.</strong> We do not build a behavioural profile of your child,
            and we do not follow them around the internet. There are no advertising or social pixels in the product at
            all.
          </li>
          <li>
            <strong>No targeted advertising.</strong> Not to your child, not to you. {LEGAL.product} is funded by
            subscriptions, which is precisely what allows us to say this.
          </li>
          <li>
            <strong>No selling or sharing with data brokers.</strong> Ever, for any price.
          </li>
          <li>
            <strong>No AI training on your family.</strong> Your child's photographs, documents and notes are not used
            to train machine-learning models — ours or anybody else's.
          </li>
          <li>
            <strong>No facial recognition</strong> and no automated content analysis of your photographs or scanned
            documents.
          </li>
          <li>
            <strong>No automated decision-making with legal or similarly significant effects.</strong> Nothing in{" "}
            {LEGAL.product} makes a consequential decision about you or your child.
          </li>
        </UL>
        <P>
          Milestone prompts are a <em>convenience</em>, not an assessment. They are compared against general, published
          age ranges. They are not a developmental evaluation, they are not medical advice, and a child who is ahead of
          or behind a prompt is simply a child. See the{" "}
          <Link to="/legal/disclaimer" className="font-medium text-primary-deep hover:underline">Disclaimer</Link>.
        </P>
      </>
    ),
  },
  {
    id: "diagnostics",
    title: "Product diagnostics — the only usage data we look at",
    body: (
      <>
        <P>
          To fix crashes we may collect an error report: the error message, the page it happened on, and the browser
          version. This runs on <strong>our own self-hosted error monitor</strong> — nothing goes to a third-party
          analytics company — and it is configured with personal-information capture switched off.
        </P>
        <H3>It is strictly opt-in</H3>
        <UL>
          <li>Nothing is collected until you say yes.</li>
          <li>The app behaves identically whether you say yes or no. No feature is withheld.</li>
          <li>
            You can change your mind at any time on the{" "}
            <Link to="/legal/cookie-preferences" className="font-medium text-primary-deep hover:underline">
              Cookie Preferences
            </Link>{" "}
            page, and it takes effect immediately.
          </li>
          <li>Diagnostics are deleted after 90 days.</li>
        </UL>
      </>
    ),
  },
  {
    id: "control",
    title: "Your control",
    body: (
      <UL>
        <li>Delete any memory, milestone or measurement and the insights recompute without it, immediately.</li>
        <li>Revoke a family member's access and they lose sight of every insight at once.</li>
        <li>Turn diagnostics off and we stop receiving error reports from your device.</li>
        <li>
          Delete your account and everything — data and derived insights alike — is erased on the timetable in the{" "}
          <Link to="/legal/privacy" className="font-medium text-primary-deep hover:underline">Privacy Policy</Link>.
        </li>
      </UL>
    ),
  },
];

const ActivityInsight = () => (
  <LegalDoc
    title="Activity Insight Notice"
    description="How Kidzopedia turns the data you enter into growth charts, milestones and memories — and our binding commitment never to track, profile or advertise to a child."
    intro={
      <>
        Read this if you want to know whether a product that watches your child grow is also watching your child. It is
        not.
      </>
    }
    sections={sections}
  />
);

export default ActivityInsight;
