/**
 * Single source of truth for every legal document.
 *
 * Edit the entity details here once and all policies update. Fields left as an
 * empty string are simply not rendered, so nothing shows a placeholder to users.
 */

export const LEGAL = {
  /** Product name used throughout the policies. */
  product: "Kidzopedia",
  /** Legal entity that operates the product (the "Data Fiduciary" under the DPDP Act). */
  entity: "UniMisk ERP Solutions",
  /** Registered office. Leave "" until confirmed — it is omitted from the pages when empty. */
  registeredAddress: "",
  /** CIN / GSTIN etc. Optional. */
  registrationNo: "",

  /** Primary contact for support and legal notices. */
  contactEmail: "byteosaurus.01@gmail.com",
  /** Grievance Officer (IT Rules 2021 + DPDP s.13). Name optional; the role + email is what's required. */
  grievanceOfficerName: "",
  grievanceEmail: "byteosaurus.01@gmail.com",
  /** Data Protection Officer / person able to answer questions about processing (DPDP s.8(9)). */
  dpoEmail: "byteosaurus.01@gmail.com",

  /** Governing law. */
  jurisdiction: "the courts of India",

  /** Shown as "Last updated" on every document. */
  lastUpdated: "14 July 2026",
  effectiveFrom: "14 July 2026",
} as const;

/** Where the app's data actually lives — kept accurate so the policies never lie. */
export const SUBPROCESSORS: {
  name: string;
  purpose: string;
  data: string;
  location: string;
}[] = [
  {
    name: "Self-hosted Supabase (PostgreSQL, Auth, Storage)",
    purpose: "Core application database, sign-in, and file storage",
    data: "Account details, child profiles, memories, milestones, documents",
    location: "Our own servers in India",
  },
  {
    name: "Self-hosted MinIO (S3-compatible object storage)",
    purpose: "Stores photos, documents and exported keepsake books",
    data: "Photos, scanned records, PDFs you upload",
    location: "Our own servers in India",
  },
  {
    name: "Razorpay Software Private Limited",
    purpose: "Payment processing for paid plans",
    data: "Name, email, payment identifiers. We never see or store your full card number",
    location: "India",
  },
  {
    name: "Resend (delivered via Amazon SES)",
    purpose: "Transactional email — verification codes, password resets, receipts",
    data: "Email address and the contents of that email",
    location: "Japan (Amazon SES, ap-northeast-1) — a transfer outside India",
  },
  {
    name: "WhatsApp (Meta) via our self-hosted OpenWA gateway",
    purpose: "Delivers your one-time login code if you choose phone sign-in",
    data: "Mobile number and the one-time code",
    location: "Gateway on our servers in India; WhatsApp delivery by Meta",
  },
  {
    name: "Cloudflare",
    purpose: "Secure network tunnel and TLS termination for traffic to our servers",
    data: "Traffic metadata in transit (IP address, request headers)",
    location: "Global edge network",
  },
  {
    name: "Self-hosted GlitchTip",
    purpose: "Error and crash diagnostics so we can fix bugs",
    data: "Technical error reports. Configured with sendDefaultPii disabled",
    location: "Our own servers in India",
  },
];

/** The documents that make up the Company & Legal centre. */
export const LEGAL_DOCS: {
  slug: string;
  title: string;
  summary: string;
}[] = [
  {
    slug: "/legal/terms",
    title: "Terms & Conditions",
    summary: "The agreement between you and us — your account, your plan, acceptable use, and liability.",
  },
  {
    slug: "/legal/privacy",
    title: "Privacy Policy",
    summary: "What personal data we collect, why, how long we keep it, and your rights under the DPDP Act.",
  },
  {
    slug: "/legal/data-processing",
    title: "Data Processing Policy",
    summary: "Where your data physically lives, every sub-processor we use, and how we secure it.",
  },
  {
    slug: "/legal/data-rights",
    title: "Data Rights & Grievance Redressal",
    summary: "How to access, correct, erase or nominate — and how to escalate a complaint.",
  },
  {
    slug: "/legal/activity-insight",
    title: "Activity Insight Notice",
    summary: "How we turn your activity into insights — and our promise never to profile or advertise to children.",
  },
  {
    slug: "/legal/cookies",
    title: "Cookie Policy",
    summary: "Every cookie and storage key we set, what it does, and how long it lasts.",
  },
  {
    slug: "/legal/cookie-preferences",
    title: "Cookie Preferences",
    summary: "Turn optional cookies and diagnostics on or off. Your choice is saved on this device.",
  },
  {
    slug: "/legal/disclaimer",
    title: "Disclaimer",
    summary: "The limits of what Kidzopedia is — not medical, legal or financial advice.",
  },
];
