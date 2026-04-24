/**
 * Tracker DSL Parser — Type Definitions
 *
 * Types for the financial DSL parser output.
 * All monetary values are in cents (integers) to avoid floating-point errors.
 */

/** Type of installment operation */
export type InstallmentType = "fixed" | "division";

/** Successfully parsed transaction */
export interface ParsedTransaction {
  /** Total amount in cents (for single transactions or total of division) */
  amount_cents: number;
  /** Number of installments, null if single transaction */
  installment_total: number | null;
  /** How installments are calculated */
  installment_type: InstallmentType | null;
  /** Amount in cents for each installment (handles remainder distribution) */
  installments: number[];
  /** Transaction description (free text tokens) */
  description: string;
  /** Category name (last word token) */
  category: string;
  /** Tags (tokens prefixed with #) */
  tags: string[];
}

/** Parse error details */
export interface ParseError {
  code:
    | "INVALID_VALUE"
    | "DIVISION_BY_ZERO"
    | "INVALID_INSTALLMENT"
    | "EMPTY_DESCRIPTION"
    | "MISSING_CATEGORY"
    | "EMPTY_INPUT"
    | "INVALID_SYNTAX";
  message: string;
  position?: number;
}

/** Discriminated union for parse results */
export type ParseResult =
  | { success: true; data: ParsedTransaction }
  | { success: false; error: ParseError };

/** Token types produced by the lexer */
export type TokenType = "NUMBER" | "OPERATOR" | "TAG" | "WORD";

/** A single token from the lexer */
export interface Token {
  type: TokenType;
  value: string;
  position: number;
}
