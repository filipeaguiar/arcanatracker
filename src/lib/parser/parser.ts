/**
 * Tracker DSL — Parser
 *
 * Parses tokenized DSL input into a structured ParsedTransaction.
 *
 * Grammar (EBNF):
 *   entry        = [installment] content ;
 *   installment  = (number "*" number) | (number "/" number) ;
 *   content      = { token } ;
 *   token        = tag | word ;
 *
 * Parsing rules (order):
 *   1. Detect installment block (if present)
 *   2. Extract tags (#tag)
 *   3. Identify category (last word token)
 *   4. Build description from remaining word tokens
 *
 * The parser is deterministic and order-independent for content tokens.
 */

import { tokenize } from "./lexer";
import type {
  ParseResult,
  ParsedTransaction,
  InstallmentType,
  Token,
} from "./types";

/**
 * Convert a decimal string to cents (integer).
 * Uses Math.round to avoid floating-point issues.
 *
 * Examples:
 *   "100"    → 10000
 *   "10.50"  → 1050
 *   "100.01" → 10001
 */
function toCents(value: string): number {
  const parts = value.split(".");
  if (parts.length === 1) {
    return parseInt(parts[0], 10) * 100;
  }
  const intPart = parseInt(parts[0], 10);
  // Pad or truncate decimal part to exactly 2 digits
  let decStr = parts[1];
  if (decStr.length === 1) {
    decStr += "0";
  } else if (decStr.length > 2) {
    decStr = decStr.substring(0, 2);
  }
  const decPart = parseInt(decStr, 10);
  return intPart * 100 + decPart;
}

/**
 * Calculate installment amounts using the Brazilian remainder distribution.
 *
 * For division (valor/N):
 *   base = floor(total_cents / N)
 *   remainder = total_cents % N
 *   First `remainder` installments get base + 1
 *   Remaining installments get base
 *
 * For fixed (N*valor):
 *   All N installments have the same value
 */
function calculateInstallments(
  totalCents: number,
  count: number,
  type: InstallmentType
): number[] {
  if (type === "fixed") {
    return Array(count).fill(totalCents);
  }

  // Division: distribute remainder to first installments
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  const installments: number[] = [];

  for (let i = 0; i < count; i++) {
    installments.push(i < remainder ? base + 1 : base);
  }

  return installments;
}

/**
 * Try to detect and extract an installment pattern from tokens.
 *
 * Patterns:
 *   NUMBER * NUMBER  → fixed installments (N * valor)
 *   NUMBER / NUMBER  → division (valor / N)
 *
 * Returns the installment info and remaining tokens (with installment tokens removed).
 */
function extractInstallment(tokens: Token[]): {
  installmentType: InstallmentType | null;
  installmentTotal: number | null;
  amountCents: number;
  remainingTokens: Token[];
} | null {
  // Look for pattern: NUMBER OPERATOR NUMBER anywhere in tokens
  for (let i = 0; i < tokens.length - 2; i++) {
    if (
      tokens[i].type === "NUMBER" &&
      tokens[i + 1].type === "OPERATOR" &&
      tokens[i + 2].type === "NUMBER"
    ) {
      const left = tokens[i].value;
      const op = tokens[i + 1].value;
      const right = tokens[i + 2].value;

      const remaining = [...tokens.slice(0, i), ...tokens.slice(i + 3)];

      if (op === "*") {
        // N * valor → fixed installments
        const count = parseInt(left, 10);
        const valueCents = toCents(right);

        if (count <= 0 || isNaN(count)) {
          return null; // Will be caught as error
        }

        return {
          installmentType: "fixed",
          installmentTotal: count,
          amountCents: valueCents,
          remainingTokens: remaining,
        };
      }

      if (op === "/") {
        // valor / N → division
        const valueCents = toCents(left);
        const count = parseInt(right, 10);

        if (count <= 0 || isNaN(count)) {
          return null; // Will be caught as error
        }

        return {
          installmentType: "division",
          installmentTotal: count,
          amountCents: valueCents,
          remainingTokens: remaining,
        };
      }
    }
  }

  // Check for a single number (simple transaction, no installments)
  const numberTokens = tokens.filter((t) => t.type === "NUMBER");
  if (numberTokens.length === 1) {
    const valueCents = toCents(numberTokens[0].value);
    const remaining = tokens.filter((t) => t !== numberTokens[0]);
    return {
      installmentType: null,
      installmentTotal: null,
      amountCents: valueCents,
      remainingTokens: remaining,
    };
  }

  return null;
}

/**
 * Parse a DSL input string into a structured transaction.
 *
 * This is the main entry point — the "source of truth" for all input interpretation.
 *
 * @param input - DSL string (e.g., "10*190 tenis compras #gabriel")
 * @returns ParseResult (success with data, or failure with error)
 */
export function parse(input: string): ParseResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      success: false,
      error: {
        code: "EMPTY_INPUT",
        message: "Input cannot be empty",
      },
    };
  }

  const tokens = tokenize(trimmed);

  if (tokens.length === 0) {
    return {
      success: false,
      error: {
        code: "EMPTY_INPUT",
        message: "No valid tokens found in input",
      },
    };
  }

  // 1. Detect and extract installment block
  const installmentInfo = extractInstallment(tokens);

  if (!installmentInfo) {
    // Check if there's a division by zero
    for (let i = 0; i < tokens.length - 2; i++) {
      if (
        tokens[i].type === "NUMBER" &&
        tokens[i + 1].type === "OPERATOR" &&
        tokens[i + 1].value === "/" &&
        tokens[i + 2].type === "NUMBER" &&
        parseInt(tokens[i + 2].value, 10) === 0
      ) {
        return {
          success: false,
          error: {
            code: "DIVISION_BY_ZERO",
            message: "Cannot divide by zero",
            position: tokens[i + 2].position,
          },
        };
      }
    }

    // Check for invalid installment (e.g., 0*100)
    for (let i = 0; i < tokens.length - 2; i++) {
      if (
        tokens[i].type === "NUMBER" &&
        tokens[i + 1].type === "OPERATOR" &&
        tokens[i + 2].type === "NUMBER"
      ) {
        return {
          success: false,
          error: {
            code: "INVALID_INSTALLMENT",
            message: "Invalid installment values",
            position: tokens[i].position,
          },
        };
      }
    }

    return {
      success: false,
      error: {
        code: "INVALID_VALUE",
        message: "Could not find a valid amount in the input",
      },
    };
  }

  const { installmentType, installmentTotal, amountCents, remainingTokens } =
    installmentInfo;

  if (amountCents <= 0) {
    return {
      success: false,
      error: {
        code: "INVALID_VALUE",
        message: "Amount must be greater than zero",
      },
    };
  }

  // 2. Extract tags
  const tags: string[] = [];
  const nonTagTokens: Token[] = [];

  for (const token of remainingTokens) {
    if (token.type === "TAG") {
      tags.push(token.value.toLowerCase());
    } else {
      nonTagTokens.push(token);
    }
  }

  // 3. Extract word tokens only
  const wordTokens = nonTagTokens.filter((t) => t.type === "WORD");

  if (wordTokens.length === 0) {
    return {
      success: false,
      error: {
        code: "MISSING_CATEGORY",
        message: "At least a category is required",
      },
    };
  }

  // 4. Category = last word token
  const category = wordTokens[wordTokens.length - 1].value.toLowerCase();

  // 5. Description = remaining word tokens (excluding category)
  const descriptionTokens = wordTokens.slice(0, -1);
  const description = descriptionTokens
    .map((t) => t.value.toLowerCase())
    .join(" ");

  // 6. Calculate installments
  let installments: number[];
  if (installmentType && installmentTotal) {
    installments = calculateInstallments(
      amountCents,
      installmentTotal,
      installmentType
    );
  } else {
    installments = [amountCents];
  }

  const data: ParsedTransaction = {
    amount_cents: amountCents,
    installment_total: installmentTotal,
    installment_type: installmentType,
    installments,
    description,
    category,
    tags,
  };

  return { success: true, data };
}
