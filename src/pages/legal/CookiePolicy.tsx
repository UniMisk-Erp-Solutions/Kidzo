import { Link } from "react-router-dom";
import { Callout, H3, LegalDoc, P, Section, Table, UL } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/pages/legal/legalConfig";

const sections: Section[] = [
  {
    id: "what",
    title: "What we actually use",
    body: (
      <>
        <P>
          "Cookies" is the common word, but {LEGAL.product} mostly uses your browser's{" "}
          <strong>local storage</strong> rather than traditional cookies. The privacy question is the same either way —
          something is being kept on your device — so we list every key below, honestly, whatever it is technically
          called.
        </P>
        <Callout>
          There are <strong>no advertising cookies, no social-media pixels and no third-party analytics trackers</strong>{" "}
          in {LEGAL.product}. Not one. The list below is the whole list.
        </Callout>
      </>
    ),
  },
  {
    id: "essential",
    title: "Strictly necessary (cannot be switched off)",
    body: (
      <>
        <P>
          Without these the service cannot work — you could not stay signed in. Because they are strictly necessary for
          the service you have asked for, they do not require separate consent.
        </P>
        <Table
          head={["Key", "Type", "What it does", "Lifetime"]}
          rows={[
            ["sb-*-auth-token", "Local storage", "Keeps you signed in and refreshes your session. Set by Supabase Auth, on our own server", "Until you sign out or it expires"],
            ["kidzo_consent_v1", "Local storage", "Remembers your cookie choice on this page, so we don't ask again", "12 months"],
            ["pendingInviteToken / pendingPlan", "Session storage", "Remembers the invitation or plan you clicked before signing in, so you land in the right place", "Cleared when you close the tab"],
            ["postSignup", "Session storage", "Sends a brand-new account to onboarding instead of the dashboard", "Cleared immediately after use"],
          ]}
        />
      </>
    ),
  },
  {
    id: "preferences",
    title: "Preferences (optional)",
    body: (
      <Table
        head={["Key", "Type", "What it does", "Lifetime"]}
        rows={[
          ["kidzo_theme", "Local storage", "Remembers whether you chose light or dark mode", "Until you clear it"],
          ["activeChildId", "Local storage", "Remembers which child you were last viewing, so the app opens where you left off", "Until you clear it"],
        ]}
      />
    ),
  },
  {
    id: "diagnostics",
    title: "Diagnostics (optional, off by default)",
    body: (
      <>
        <Table
          head={["Key", "Type", "What it does", "Lifetime"]}
          rows={[
            ["Error monitoring (GlitchTip)", "In-memory + network", "Sends a technical crash report so we can fix the bug. Self-hosted on our servers, with personal-information capture disabled", "Reports deleted after 90 days"],
          ]}
        />
        <P>
          This is <strong>off unless you turn it on</strong>, and turning it off again takes effect immediately. See{" "}
          <Link to="/legal/activity-insight" className="font-medium text-primary-deep hover:underline">
            Activity Insight Notice
          </Link>
          .
        </P>
      </>
    ),
  },
  {
    id: "third-party",
    title: "Third parties that may set their own cookies",
    body: (
      <>
        <UL>
          <li>
            <strong>Razorpay</strong> — only on the checkout page, and only when you are actually paying. Razorpay sets
            cookies it needs for fraud prevention and to complete the transaction, under its own privacy policy. We do
            not control them, and they are not present anywhere else in the app.
          </li>
          <li>
            <strong>Cloudflare</strong> — may set a security cookie to protect our infrastructure from attack, as part
            of routing traffic to our servers.
          </li>
        </UL>
        <P>
          That is the complete list of third parties. No Google Analytics, no Meta pixel, no advertising network.
        </P>
      </>
    ),
  },
  {
    id: "control",
    title: "How to control them",
    body: (
      <>
        <H3>In the app</H3>
        <P>
          Use the{" "}
          <Link to="/legal/cookie-preferences" className="font-medium text-primary-deep hover:underline">
            Cookie Preferences
          </Link>{" "}
          page. You can turn optional categories on or off at any time, or withdraw everything — withdrawal is exactly
          one click, the same as consent.
        </P>
        <H3>In your browser</H3>
        <P>
          Every browser lets you block or clear cookies and site data. If you clear ours, you will simply be signed out
          and asked for your preferences again. Nothing is lost — your memories live on the server, not in your browser.
        </P>
      </>
    ),
  },
];

const CookiePolicy = () => (
  <LegalDoc
    title="Cookie Policy"
    description="Every cookie and storage key Kidzopedia sets, what each one does, how long it lasts, and how to switch off the optional ones."
    intro={<>A short document, because there is genuinely not much to declare. That is the point.</>}
    sections={sections}
  />
);

export default CookiePolicy;
