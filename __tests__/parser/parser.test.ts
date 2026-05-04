/**
 * Tracker DSL Parser — Test Suite
 *
 * Tests all cases from the specification document (Documento 3).
 * These tests form the behavioral contract of the parser.
 */

import { describe, it, expect } from "vitest";
import { parse } from "@/lib/parser";
import { tokenize } from "@/lib/parser/lexer";

// ─── Lexer Tests ─────────────────────────────────────────────────────

describe("Lexer", () => {
  it("tokenizes a simple input", () => {
    const tokens = tokenize("50 mercado compras");
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toMatchObject({ type: "NUMBER", value: "50" });
    expect(tokens[1]).toMatchObject({ type: "WORD", value: "mercado" });
    expect(tokens[2]).toMatchObject({ type: "WORD", value: "compras" });
  });

  it("tokenizes installments with operator", () => {
    const tokens = tokenize("10*190 tenis compras");
    expect(tokens).toHaveLength(5);
    expect(tokens[0]).toMatchObject({ type: "NUMBER", value: "10" });
    expect(tokens[1]).toMatchObject({ type: "OPERATOR", value: "*" });
    expect(tokens[2]).toMatchObject({ type: "NUMBER", value: "190" });
  });

  it("tokenizes tags", () => {
    const tokens = tokenize("100 mercado compras #gabriel #pessoal");
    const tags = tokens.filter((t) => t.type === "TAG");
    expect(tags).toHaveLength(2);
    expect(tags[0].value).toBe("gabriel");
    expect(tags[1].value).toBe("pessoal");
  });

  it("tokenizes decimal numbers", () => {
    const tokens = tokenize("10.50 café compras");
    expect(tokens[0]).toMatchObject({ type: "NUMBER", value: "10.50" });
  });

  it("handles accented characters", () => {
    const tokens = tokenize("50 alimentação");
    expect(tokens[1]).toMatchObject({ type: "WORD", value: "alimentação" });
  });
});

// ─── Parser Tests — Spec Contract ───────────────────────────────────

describe("Parser", () => {
  // Teste 1 — Entrada simples
  it("parses simple entry: 50 mercado compras", () => {
    const result = parse("50 mercado compras");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(5000);
    expect(result.data.category).toBe("compras");
    expect(result.data.description).toBe("mercado");
    expect(result.data.installment_total).toBeNull();
    expect(result.data.installments).toEqual([5000]);
  });

  // Teste 2 — Parcelamento fixo
  it("parses fixed installments: 10*190 tenis compras", () => {
    const result = parse("10*190 tenis compras");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(19000);
    expect(result.data.installment_total).toBe(10);
    expect(result.data.installment_type).toBe("fixed");
    expect(result.data.installments).toHaveLength(10);
    expect(result.data.installments.every((v) => v === 19000)).toBe(true);
    expect(result.data.description).toBe("tenis");
    expect(result.data.category).toBe("compras");
  });

  // Teste 3 — Divisão simples
  it("parses division: 100/3 mercado compras → 3334, 3333, 3333", () => {
    const result = parse("100/3 mercado compras");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(10000);
    expect(result.data.installment_total).toBe(3);
    expect(result.data.installment_type).toBe("division");
    expect(result.data.installments).toEqual([3334, 3333, 3333]);
    expect(result.data.installments.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  // Teste 4 — Divisão com centavos
  it("parses division with cents: 100.01/3 → 3334, 3334, 3333", () => {
    const result = parse("100.01/3 mercado compras");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(10001);
    expect(result.data.installments).toEqual([3334, 3334, 3333]);
    expect(result.data.installments.reduce((a, b) => a + b, 0)).toBe(10001);
  });

  // Teste 5 — Ordem livre + tags
  it("parses with any token order: #gabriel compras 10*190 tenis", () => {
    const result = parse("#gabriel compras 10*190 tenis");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(19000);
    expect(result.data.installment_total).toBe(10);
    expect(result.data.tags).toContain("gabriel");
    // Category should be the last word token after removing installment and tags
    expect(result.data.category).toBe("tenis");
    expect(result.data.description).toBe("compras");
  });

  // Additional: simple entry with tags
  it("parses entry with tags: 50 mercado compras #gabriel", () => {
    const result = parse("50 mercado compras #gabriel");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(5000);
    expect(result.data.category).toBe("compras");
    expect(result.data.description).toBe("mercado");
    expect(result.data.tags).toEqual(["gabriel"]);
  });

  // Additional: decimal value
  it("parses decimal value: 10.50 café alimentação", () => {
    const result = parse("10.50 café alimentação");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(1050);
    expect(result.data.description).toBe("café");
    expect(result.data.category).toBe("alimentação");
  });

  // Additional: category only (no description)
  it("parses category-only entry: 100 compras", () => {
    const result = parse("100 compras");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(10000);
    expect(result.data.category).toBe("compras");
    expect(result.data.description).toBe("");
  });

  // Division with even split
  it("parses even division: 100/2 mercado compras", () => {
    const result = parse("100/2 mercado compras");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.installments).toEqual([5000, 5000]);
  });
});

// ─── Parser Tests — Error Cases ─────────────────────────────────────

describe("Parser — Errors", () => {
  it("rejects empty input", () => {
    const result = parse("");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("EMPTY_INPUT");
  });

  it("rejects whitespace-only input", () => {
    const result = parse("   ");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("EMPTY_INPUT");
  });

  it("rejects division by zero", () => {
    const result = parse("100/0 mercado compras");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("DIVISION_BY_ZERO");
  });

  it("rejects input without amount", () => {
    const result = parse("mercado compras");
    expect(result.success).toBe(false);
  });

  it("rejects input with only a number (no category)", () => {
    const result = parse("100");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("MISSING_CATEGORY");
  });
});

// ─── Currency Precision ─────────────────────────────────────────────

describe("Currency precision", () => {
  it("never produces fractional cents in division", () => {
    // Test many divisions to ensure integer results
    const cases = [
      { input: "100/3", total: 10000 },
      { input: "100/7", total: 10000 },
      { input: "1/3", total: 100 },
      { input: "0.01/3", total: 1 },
      { input: "999.99/7", total: 99999 },
    ];

    for (const { input, total } of cases) {
      const result = parse(`${input} item compras`);
      expect(result.success).toBe(true);
      if (!result.success) continue;

      // All installments must be integers
      for (const amount of result.data.installments) {
        expect(Number.isInteger(amount)).toBe(true);
      }

      // Sum must equal original total
      const sum = result.data.installments.reduce((a, b) => a + b, 0);
      expect(sum).toBe(total);
    }
  });
});

// ─── Comma Decimal Separator ────────────────────────────────────────

describe("Comma decimal separator", () => {
  it("lexer tokenizes comma-decimal numbers", () => {
    const tokens = tokenize("50,00 uber transporte");
    expect(tokens[0]).toMatchObject({ type: "NUMBER", value: "50.00" });
  });

  it("lexer normalizes comma to dot in value", () => {
    const tokens = tokenize("10,5 café alimentação");
    expect(tokens[0]).toMatchObject({ type: "NUMBER", value: "10.5" });
  });

  it("parses simple entry with comma: 50,00 uber transporte", () => {
    const result = parse("50,00 uber transporte");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(5000);
    expect(result.data.description).toBe("uber");
    expect(result.data.category).toBe("transporte");
  });

  it("parses single decimal digit with comma: 10,5 café alimentação → 1050", () => {
    const result = parse("10,5 café alimentação");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(1050);
  });

  it("parses fixed installments with comma value: 10*190,50 tenis compras", () => {
    const result = parse("10*190,50 tenis compras");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(19050);
    expect(result.data.installment_total).toBe(10);
    expect(result.data.installment_type).toBe("fixed");
    expect(result.data.installments.every(v => v === 19050)).toBe(true);
  });

  it("parses division with comma: 100,01/3 mercado compras", () => {
    const result = parse("100,01/3 mercado compras");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(10001);
    expect(result.data.installments).toEqual([3334, 3334, 3333]);
  });

  it("dot still works after adding comma support", () => {
    const result = parse("10.50 café alimentação");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.amount_cents).toBe(1050);
  });
});

