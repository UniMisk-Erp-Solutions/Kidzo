import { describe, expect, it } from "vitest";
import { CcavConfigError, cancelUrl, loadConfig, redirectUrl, resultPageUrl } from "../../../supabase/functions/_shared/ccavenue";

const base: Record<string, string> = {
  CCAVENUE_MERCHANT_ID: "12345", CCAVENUE_ACCESS_CODE: "AVXX", CCAVENUE_WORKING_KEY: "k".repeat(32),
  CCAVENUE_AES_MODE: "aes256", CCAVENUE_ENV: "production",
  CCAVENUE_CALLBACK_BASE_URL: "https://api.example.com/functions/v1/", SITE_URL: "https://kidzopedia.byteosaurus.com/",
};
const cfg = (over: Record<string, string | undefined> = {}) => loadConfig((k) => ({ ...base, ...over })[k]);

describe("loadConfig", () => {
  it("picks the AES-256 endpoint for aes256 and the AES-128 endpoint for aes128 (never mixed)", () => {
    expect(cfg().initiateUrl).toBe("https://secure.ccavenue.com/gTransaction.do?command=initiateTransaction");
    expect(cfg({ CCAVENUE_AES_MODE: "aes128" }).initiateUrl).toBe(
      "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction");
  });
  it("has no default AES mode", () => {
    expect(() => cfg({ CCAVENUE_AES_MODE: undefined })).toThrow(CcavConfigError);
    expect(() => cfg({ CCAVENUE_AES_MODE: "aes512" })).toThrow(CcavConfigError);
  });
  it("requires every credential", () => {
    for (const k of ["CCAVENUE_MERCHANT_ID", "CCAVENUE_ACCESS_CODE", "CCAVENUE_WORKING_KEY", "CCAVENUE_CALLBACK_BASE_URL", "SITE_URL"]) {
      expect(() => cfg({ [k]: "" })).toThrow(CcavConfigError);
    }
  });
  it("AES-256 needs a 32-byte working key", () => {
    expect(() => cfg({ CCAVENUE_WORKING_KEY: "tooshort" })).toThrow(CcavConfigError);
  });
  it("AES-256 test mode needs an explicit endpoint", () => {
    expect(() => cfg({ CCAVENUE_ENV: "test" })).toThrow(CcavConfigError);
    expect(cfg({ CCAVENUE_ENV: "test", CCAVENUE_INITIATE_URL: "https://test.ccavenue.com/gTransaction.do?command=initiateTransaction" }).env).toBe("test");
  });
  it("only accepts https *.ccavenue.com endpoint overrides", () => {
    for (const bad of ["http://secure.ccavenue.com/x", "https://evil.com/x", "https://ccavenue.com.evil.com/x", "nonsense"]) {
      expect(() => cfg({ CCAVENUE_INITIATE_URL: bad })).toThrow(CcavConfigError);
    }
  });
  it("requires https callbacks in production", () => {
    expect(() => cfg({ CCAVENUE_CALLBACK_BASE_URL: "http://api.example.com/functions/v1" })).toThrow(CcavConfigError);
  });
  it("builds callback and result URLs from config only", () => {
    const c = cfg();
    expect(redirectUrl(c)).toBe("https://api.example.com/functions/v1/ccavenue-callback?o=redirect");
    expect(cancelUrl(c)).toBe("https://api.example.com/functions/v1/ccavenue-callback?o=cancel");
    expect(resultPageUrl(c, "KZABC")).toBe("https://kidzopedia.byteosaurus.com/payment/result?order=KZABC");
    expect(resultPageUrl(c)).toBe("https://kidzopedia.byteosaurus.com/payment/result?error=invalid");
  });
});
