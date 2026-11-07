import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  amountsEqual, buildRequestPlaintext, CcavProtocolError, decrypt, encrypt, formatAmount, generateOrderId,
  normalizeGatewayStatus, ORDER_ID_RE, parseResponse,
} from "../../../supabase/functions/_shared/ccavenue";

const KEY128 = "0123456789abcdef0123456789abcdef";
const KEY256 = "abcdefghijklmnopqrstuvwxyz012345"; // exactly 32 bytes
const PLAIN = "merchant_id=123&order_id=KZ1&amount=10.00&currency=INR&redirect_url=https%3A%2F%2Fx.test%2Fcb";

// Reference implementations of the algorithms in CCAvenue's NodeJS_Integration_Kit (ccavutil.js).
// AES-128: key = MD5(workingKey), fixed IV 00..0f, CBC, hex. (The kit passes the digest as a binary
// string, which modern Node would re-encode as UTF-8; the raw digest bytes are what is meant.)
const kitIv = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
const kit128 = {
  enc: (p: string, k: string) => {
    const c = createCipheriv("aes-128-cbc", createHash("md5").update(k).digest(), kitIv);
    return c.update(p, "utf8", "hex") + c.final("hex");
  },
  dec: (e: string, k: string) => {
    const d = createDecipheriv("aes-128-cbc", createHash("md5").update(k).digest(), kitIv);
    return d.update(e, "hex", "utf8") + d.final("utf8");
  },
};
// AES-256: aes-256-gcm, random 12-byte IV, output hex(iv) + hex(ciphertext||tag).
const kit256 = {
  enc: (p: string, k: string) => {
    const iv = randomBytes(12);
    const c = createCipheriv("aes-256-gcm", k, iv);
    const e = Buffer.concat([c.update(p, "utf8"), c.final()]);
    return iv.toString("hex") + Buffer.concat([e, c.getAuthTag()]).toString("hex");
  },
  dec: (t: string, k: string) => {
    const b = Buffer.from(t, "hex");
    const d = createDecipheriv("aes-256-gcm", k, b.subarray(0, 12));
    d.setAuthTag(b.subarray(-16));
    return Buffer.concat([d.update(b.subarray(12, -16)), d.final()]).toString("utf8");
  },
};

describe("AES-128 (CBC / MD5 key) matches the kit", () => {
  it("is byte-identical to the kit (fixed IV)", () => {
    expect(encrypt(PLAIN, KEY128, "aes128")).toBe(kit128.enc(PLAIN, KEY128));
  });
  it("round-trips with the kit", () => {
    expect(decrypt(kit128.enc(PLAIN, KEY128), KEY128, "aes128")).toBe(PLAIN);
    expect(kit128.dec(encrypt(PLAIN, KEY128, "aes128"), KEY128)).toBe(PLAIN);
  });
  it("rejects the wrong working key", () => {
    expect(() => decrypt(encrypt(PLAIN, KEY128, "aes128"), "another-key", "aes128")).toThrow(CcavProtocolError);
  });
});

describe("AES-256 (GCM) matches the kit", () => {
  it("interoperates in both directions", () => {
    expect(decrypt(kit256.enc(PLAIN, KEY256), KEY256, "aes256")).toBe(PLAIN);
    expect(kit256.dec(encrypt(PLAIN, KEY256, "aes256"), KEY256)).toBe(PLAIN);
  });
  it("uses a fresh IV every time", () => {
    expect(encrypt(PLAIN, KEY256, "aes256")).not.toBe(encrypt(PLAIN, KEY256, "aes256"));
  });
  it("rejects tampered ciphertext", () => {
    const enc = encrypt(PLAIN, KEY256, "aes256");
    const flipped = enc.slice(0, 30) + (enc[30] === "0" ? "1" : "0") + enc.slice(31);
    expect(() => decrypt(flipped, KEY256, "aes256")).toThrow(CcavProtocolError);
  });
  it("rejects the wrong key and a key that is not 32 bytes", () => {
    expect(() => decrypt(encrypt(PLAIN, KEY256, "aes256"), "z".repeat(32), "aes256")).toThrow(CcavProtocolError);
    expect(() => encrypt(PLAIN, "short", "aes256")).toThrow();
  });
});

describe("the two schemes are never interchangeable", () => {
  it("one mode cannot read the other's output", () => {
    expect(() => decrypt(encrypt(PLAIN, KEY256, "aes256"), KEY256, "aes128")).toThrow(CcavProtocolError);
    expect(() => decrypt(encrypt(PLAIN, KEY128, "aes128"), KEY256, "aes256")).toThrow(CcavProtocolError);
  });
});

describe("malformed input", () => {
  it.each(["", "zz", "abc", "  "])("rejects %j", (bad) => {
    expect(() => decrypt(bad, KEY128, "aes128")).toThrow(CcavProtocolError);
    expect(() => decrypt(bad, KEY256, "aes256")).toThrow(CcavProtocolError);
  });
});

describe("request / response format", () => {
  it("URL-encodes values and skips empty ones", () => {
    expect(buildRequestPlaintext({ a: "1", b: "", c: undefined, d: "x y&z" })).toBe("a=1&d=x+y%26z");
  });
  it("parses the decrypted response", () => {
    expect(parseResponse("order_id=KZ1&order_status=Success&failure_message=&bank_ref_no=A=B")).toEqual({
      order_id: "KZ1", order_status: "Success", failure_message: "", bank_ref_no: "A=B",
    });
  });
  it("formats amounts and refuses nonsense", () => {
    expect(formatAmount(1499)).toBe("1499.00");
    expect(formatAmount(1769.82)).toBe("1769.82");
    for (const bad of [0, -5, NaN, Infinity]) expect(() => formatAmount(bad)).toThrow();
  });
  it("compares amounts in paise", () => {
    expect(amountsEqual("1769.8200", 1769.82)).toBe(true);
    expect(amountsEqual("1769.83", 1769.82)).toBe(false);
    expect(amountsEqual(undefined, 10)).toBe(false);
  });
});

describe("order ids", () => {
  it("are unique, alphanumeric and at most 30 chars", () => {
    const ids = new Set(Array.from({ length: 2000 }, () => generateOrderId()));
    expect(ids.size).toBe(2000);
    for (const id of ids) {
      expect(id).toMatch(ORDER_ID_RE);
      expect(id.length).toBeLessThanOrEqual(30);
    }
  });
  it("the validator rejects injection-style values", () => {
    for (const bad of ["", "KZ", "kzabc", "KZ12345678901'; DROP", "XX1234567890ABC", "KZ" + "A".repeat(40)]) {
      expect(ORDER_ID_RE.test(bad)).toBe(false);
    }
  });
});

describe("gateway status mapping fails closed", () => {
  it.each([
    ["Success", "success"], ["Successful", "success"], ["Failure", "failure"], ["Invalid", "failure"],
    ["Timeout", "failure"], ["Aborted", "cancelled"], ["Initiated", "pending"], ["Refunded", "refunded"],
    ["", "unknown"], [undefined, "unknown"], ["SomethingNew", "unknown"],
  ])("%j -> %s", (raw, expected) => {
    expect(normalizeGatewayStatus(raw as string | undefined)).toBe(expected);
  });
});
