import { describe, it, expect } from "vitest";
import { formatCategoryName } from "@/lib/utils/format";

describe("formatCategoryName", () => {
  it("replaces hyphens with spaces", () => {
    expect(formatCategoryName("alimentacao-fora")).toBe("alimentacao fora");
  });

  it("replaces underscores with spaces", () => {
    expect(formatCategoryName("alimentacao_fora")).toBe("alimentacao fora");
  });

  it("replaces both hyphens and underscores with spaces", () => {
    expect(formatCategoryName("tag-name_extra")).toBe("tag name extra");
  });

  it("returns the same string if there are no hyphens or underscores", () => {
    expect(formatCategoryName("alimentacao")).toBe("alimentacao");
  });

  it("returns an empty string when input is an empty string", () => {
    expect(formatCategoryName("")).toBe("");
  });

  it("returns an empty string when input is undefined", () => {
    expect(formatCategoryName(undefined)).toBe("");
  });
});
