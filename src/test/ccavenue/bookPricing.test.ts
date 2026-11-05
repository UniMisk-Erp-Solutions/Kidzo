import { describe, expect, it } from "vitest";
import { calculatePrice, type BindingType, type BookSize, type PaperQuality } from "@/lib/bookPricing";
import { hasValidOptions, parseAddress, priceBook, validQuantity } from "../../../supabase/functions/_shared/bookPricing";

describe("server book price equals client book price", () => {
  const sizes: BookSize[] = ["8x10", "10x12", "12x14"];
  const papers: PaperQuality[] = ["matte", "glossy", "premium"];
  const bindings: BindingType[] = ["soft", "hard", "leather"];
  it("matches for every option and quantity", () => {
    for (const size of sizes) for (const paper of papers) for (const binding of bindings) for (const quantity of [1, 2, 3, 7, 10]) {
      expect(priceBook({ size, paper, binding, quantity }).total).toBe(calculatePrice({ size, paper, binding, quantity }).total);
    }
  });
});

describe("input validation", () => {
  it("clamps quantity", () => {
    expect([validQuantity(0), validQuantity(99), validQuantity("3"), validQuantity("x")]).toEqual([1, 10, 3, 1]);
  });
  it("rejects unknown and prototype option names", () => {
    expect(hasValidOptions({ size: "8x10", paper: "matte", binding: "soft" })).toBe(true);
    expect(hasValidOptions({ size: "constructor", paper: "matte", binding: "soft" })).toBe(false);
    expect(hasValidOptions({ size: "8x10", paper: "gold", binding: "soft" })).toBe(false);
  });
  const good = { name: "A B", phone: "9876543210", street: "1 Main", city: "Pune", state: "MH", zip: "411001" };
  it("accepts a valid address and forces country to India", () => {
    expect(parseAddress({ ...good, country: "US" }).address?.country).toBe("India");
  });
  it("rejects bad PIN, phone and missing fields", () => {
    expect(parseAddress({ ...good, zip: "01234" }).error).toBeTruthy();
    expect(parseAddress({ ...good, phone: "12345" }).error).toBeTruthy();
    expect(parseAddress({ ...good, city: "" }).error).toBeTruthy();
  });
});
