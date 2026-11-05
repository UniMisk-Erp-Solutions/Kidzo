// CCAvenue protocol helpers (hosted checkout): encryption, request/response formats, config,
// and the Order Status Tracker call. Pure functions + `node:crypto`, so it runs unchanged in the
// Deno edge runtime and under vitest (Node).
//
// The two AES schemes in CCAvenue's NodeJS kit are DIFFERENT protocols and are never mixed:
//   aes128 : key = MD5(workingKey) (16 raw bytes), AES-128-CBC, fixed IV 00..0f, hex output.
//            Initiate URL: https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction
//   aes256 : key = the 32-byte working key as-is, AES-256-GCM, random 12-byte IV,
//            output = hex(iv) + hex(ciphertext || 16-byte tag).
//            Initiate URL: https://secure.ccavenue.com/gTransaction.do?command=initiateTransaction
// Which one applies is a property of the merchant account, so CCAVENUE_AES_MODE has NO default.
import { Buffer } from "node:buffer";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type AesMode = "aes128" | "aes256";
export type GatewayEnv = "test" | "production";

export class CcavConfigError extends Error {}
export class CcavProtocolError extends Error {}

// ---------------------------------------------------------------------------
// Encryption
// ---------------------------------------------------------------------------
const CBC_IV = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
const HEX = /^[0-9a-fA-F]+$/;

function aes256Key(workingKey: string): Buffer {
  const key = Buffer.from(workingKey, "utf8");
  if (key.length !== 32) throw new CcavConfigError("AES-256 working key must be exactly 32 bytes");
  return key;
}

export function encrypt(plainText: string, workingKey: string, mode: AesMode): string {
  if (mode === "aes128") {
    const key = createHash("md5").update(workingKey, "utf8").digest(); // raw 16 bytes
    const cipher = createCipheriv("aes-128-cbc", key, CBC_IV);
    return cipher.update(plainText, "utf8", "hex") + cipher.final("hex");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", aes256Key(workingKey), iv);
  const body = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return iv.toString("hex") + Buffer.concat([body, cipher.getAuthTag()]).toString("hex");
}

/** Throws CcavProtocolError on malformed / tampered / wrong-key input (never returns garbage). */
export function decrypt(encText: string, workingKey: string, mode: AesMode): string {
  const hex = (encText ?? "").trim();
  if (!hex || hex.length % 2 !== 0 || !HEX.test(hex)) throw new CcavProtocolError("Malformed encrypted payload");
  try {
    if (mode === "aes128") {
      const key = createHash("md5").update(workingKey, "utf8").digest();
      const decipher = createDecipheriv("aes-128-cbc", key, CBC_IV);
      return decipher.update(hex, "hex", "utf8") + decipher.final("utf8");
    }
    const buf = Buffer.from(hex, "hex");
    if (buf.length < 12 + 16) throw new CcavProtocolError("Encrypted payload too short");
    const decipher = createDecipheriv("aes-256-gcm", aes256Key(workingKey), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(buf.length - 16));
    return Buffer.concat([decipher.update(buf.subarray(12, buf.length - 16)), decipher.final()]).toString("utf8");
  } catch (e) {
    if (e instanceof CcavProtocolError || e instanceof CcavConfigError) throw e;
    throw new CcavProtocolError("Could not decrypt payload (wrong key, mode or tampered data)");
  }
}

// ---------------------------------------------------------------------------
// Request / response formats
// ---------------------------------------------------------------------------
/** `k=v&k=v` (URL-encoded values), skipping empty ones — the plaintext CCAvenue expects. */
export function buildRequestPlaintext(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || String(v).trim() === "") continue;
    sp.append(k, String(v));
  }
  return sp.toString();
}

/** Splits the decrypted `k=v&k=v` response. Values are NOT url-decoded (CCAvenue sends them raw). */
export function parseResponse(plain: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of plain.split("&")) {
    const i = pair.indexOf("=");
    if (i > 0) out[pair.slice(0, i)] = pair.slice(i + 1);
  }
  return out;
}

/** Amount as CCAvenue wants it: a positive number with 2 decimals. */
export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) throw new CcavProtocolError("Invalid payment amount");
  return amount.toFixed(2);
}

export function amountsEqual(gatewayAmount: string | number | undefined, expected: number): boolean {
  const g = Number(gatewayAmount);
  return Number.isFinite(g) && Math.round(g * 100) === Math.round(expected * 100);
}

/** Unique, unguessable merchant order id: `KZ` + time + 40 random bits (alphanumeric, 20 chars). */
export function generateOrderId(now = Date.now()): string {
  return ("KZ" + now.toString(36) + randomBytes(5).toString("hex")).toUpperCase();
}
export const ORDER_ID_RE = /^KZ[0-9A-Z]{10,28}$/;

export type GatewayResult = "success" | "failure" | "cancelled" | "pending" | "refunded" | "unknown";

/** Maps CCAvenue's order_status strings (redirect response and status API) to our outcomes. Fails closed. */
export function normalizeGatewayStatus(raw: string | undefined | null): GatewayResult {
  switch ((raw ?? "").trim().toLowerCase()) {
    case "success":
    case "successful":
    case "shipped": // settled / captured
      return "success";
    case "failure":
    case "unsuccessful":
    case "invalid":
    case "timeout":
    case "auto-cancelled":
    case "auto-reversed":
      return "failure";
    case "aborted":
    case "cancelled":
      return "cancelled";
    case "initiated":
    case "awaited":
    case "awaiting":
    case "pending":
      return "pending";
    case "refunded":
      return "refunded";
    default:
      return "unknown";
  }
}

// ---------------------------------------------------------------------------
// Configuration (all values come from backend env vars, never the client)
// ---------------------------------------------------------------------------
export interface CcavConfig {
  merchantId: string;
  accessCode: string;
  workingKey: string;
  mode: AesMode;
  env: GatewayEnv;
  initiateUrl: string;
  /** Public base of the edge functions, e.g. https://api.example.com/functions/v1 */
  callbackBase: string;
  /** Public SPA origin, e.g. https://kidzopedia.byteosaurus.com */
  siteUrl: string;
}

const INITIATE_URLS: Record<AesMode, Partial<Record<GatewayEnv, string>>> = {
  aes128: {
    production: "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction",
    test: "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction",
  },
  // The kit documents only the production AES-256 endpoint; a test one must be supplied explicitly.
  aes256: { production: "https://secure.ccavenue.com/gTransaction.do?command=initiateTransaction" },
};

function gatewayUrl(name: string, value: string): string {
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    throw new CcavConfigError(`${name} is not a valid URL`);
  }
  if (u.protocol !== "https:" || !(u.hostname === "ccavenue.com" || u.hostname.endsWith(".ccavenue.com"))) {
    throw new CcavConfigError(`${name} must be an https://*.ccavenue.com URL`);
  }
  return u.toString();
}

/** Validates and returns the gateway config; throws CcavConfigError with a precise reason. */
export function loadConfig(get: (k: string) => string | undefined): CcavConfig {
  const need = (k: string) => {
    const v = (get(k) ?? "").trim();
    if (!v) throw new CcavConfigError(`${k} is not set`);
    return v;
  };
  const mode = need("CCAVENUE_AES_MODE").toLowerCase();
  if (mode !== "aes128" && mode !== "aes256") throw new CcavConfigError("CCAVENUE_AES_MODE must be 'aes128' or 'aes256'");
  const env = (get("CCAVENUE_ENV") ?? "test").trim().toLowerCase();
  if (env !== "test" && env !== "production") throw new CcavConfigError("CCAVENUE_ENV must be 'test' or 'production'");

  const workingKey = need("CCAVENUE_WORKING_KEY");
  if (mode === "aes256") aes256Key(workingKey); // length check

  const initiateOverride = (get("CCAVENUE_INITIATE_URL") ?? "").trim();
  const initiate = initiateOverride || INITIATE_URLS[mode as AesMode][env as GatewayEnv];
  if (!initiate) {
    throw new CcavConfigError(`No known ${mode} ${env} endpoint — set CCAVENUE_INITIATE_URL from your CCAvenue dashboard`);
  }

  const callbackBase = need("CCAVENUE_CALLBACK_BASE_URL").replace(/\/+$/, "");
  const siteUrl = need("SITE_URL").replace(/\/+$/, "");
  if (env === "production" && (!callbackBase.startsWith("https://") || !siteUrl.startsWith("https://"))) {
    throw new CcavConfigError("Callback and site URLs must be https:// in production");
  }

  return {
    merchantId: need("CCAVENUE_MERCHANT_ID"),
    accessCode: need("CCAVENUE_ACCESS_CODE"),
    workingKey,
    mode: mode as AesMode,
    env: env as GatewayEnv,
    initiateUrl: gatewayUrl("CCAVENUE_INITIATE_URL", initiate),
    callbackBase,
    siteUrl,
  };
}

export const redirectUrl = (cfg: CcavConfig) => `${cfg.callbackBase}/ccavenue-callback?o=redirect`;
export const cancelUrl = (cfg: CcavConfig) => `${cfg.callbackBase}/ccavenue-callback?o=cancel`;
export const resultPageUrl = (cfg: CcavConfig, orderId?: string) =>
  `${cfg.siteUrl}/payment/result${orderId ? `?order=${encodeURIComponent(orderId)}` : "?error=invalid"}`;
