/**
 * Cookie / storage consent.
 *
 * Under the DPDP Act consent must be a clear affirmative action and must be as
 * easy to withdraw as it is to give — so nothing optional runs until the user
 * opts in, and the preferences page can turn it back off at any time.
 *
 * Stored on the device only (localStorage). No consent data leaves the browser.
 */

export type ConsentCategory = "essential" | "diagnostics" | "preferences";

export type Consent = {
  /** Always true — the app cannot function without these. Not a choice. */
  essential: true;
  /** Error & crash diagnostics (self-hosted GlitchTip). */
  diagnostics: boolean;
  /** Remembering UI choices such as theme and the last child you viewed. */
  preferences: boolean;
  /** ISO timestamp of when this choice was recorded. */
  decidedAt: string;
  /** Schema version, so a future change can re-ask rather than silently assume. */
  version: 1;
};

const KEY = "kidzo_consent_v1";
export const CONSENT_EVENT = "kidzo:consent-changed";

const DEFAULTS: Omit<Consent, "decidedAt"> = {
  essential: true,
  diagnostics: false, // opt-in, never opt-out
  preferences: false,
  version: 1,
};

/** The stored choice, or null if the user has not decided yet. */
export const getConsent = (): Consent | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Consent;
    if (parsed?.version !== 1) return null; // schema changed → ask again
    return { ...parsed, essential: true };
  } catch {
    return null;
  }
};

/** Consent for a category, treating "not yet decided" as "no". */
export const hasConsent = (category: ConsentCategory): boolean => {
  if (category === "essential") return true;
  return getConsent()?.[category] === true;
};

export const saveConsent = (choice: { diagnostics: boolean; preferences: boolean }): Consent => {
  const consent: Consent = {
    ...DEFAULTS,
    ...choice,
    essential: true,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(consent));
  } catch {
    /* storage blocked — the app still works, we just re-ask next time */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
  return consent;
};

export const acceptAll = () => saveConsent({ diagnostics: true, preferences: true });
export const rejectOptional = () => saveConsent({ diagnostics: false, preferences: false });

/** Withdraw everything and forget the decision — the next visit asks again. */
export const resetConsent = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
};
