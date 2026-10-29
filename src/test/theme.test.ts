import { beforeEach, describe, expect, it } from "vitest";
import { applyTheme, isTheme, THEMES, DEFAULT_THEME } from "@/hooks/useTheme";

describe("themes", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-palette");
    document.documentElement.style.cssText = "";
  });

  it("offers the three themes; Timeless Tales is the default", () => {
    expect(THEMES.map((t) => t.name)).toEqual(["Colorful Daydream", "Little Explorer", "Timeless Tales"]);
    expect(DEFAULT_THEME).toBe("tales");
  });

  it("rejects retired ids so they fall back to the default", () => {
    expect(isTheme("legacy")).toBe(false);
    expect(isTheme("dream")).toBe(false);
    expect(isTheme("explorer")).toBe(true);
  });

  it("applyTheme sets data-palette and clears stale inline tokens", () => {
    document.documentElement.style.setProperty("--primary", "153 19% 72%");
    applyTheme("tales");
    expect(document.documentElement.getAttribute("data-palette")).toBe("tales");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("");
  });
});
