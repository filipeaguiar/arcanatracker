/**
 * Tracker DSL — Lexer
 *
 * Tokenizes a DSL input string into a stream of typed tokens.
 * Handles: numbers (with decimals), operators (* /), tags (#word), and words.
 */

import type { Token, TokenType } from "./types";

/**
 * Tokenize a DSL input string.
 *
 * Examples:
 *   "10*190 tenis compras #gabriel" →
 *   [NUMBER:10, OP:*, NUMBER:190, WORD:tenis, WORD:compras, TAG:gabriel]
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Tag: #word
    if (char === "#") {
      const start = i;
      i++; // skip #
      let value = "";
      while (i < input.length && /[a-zA-ZÀ-ÿ0-9_-]/.test(input[i])) {
        value += input[i];
        i++;
      }
      if (value.length > 0) {
        tokens.push({ type: "TAG", value, position: start });
      }
      continue;
    }

    // Number: digits with optional decimal point (accepts both . and ,)
    if (/[0-9]/.test(char)) {
      const start = i;
      let value = "";
      while (i < input.length && /[0-9]/.test(input[i])) {
        value += input[i];
        i++;
      }
      // Check for decimal part (dot or comma)
      if (i < input.length && (input[i] === "." || input[i] === ",") && i + 1 < input.length && /[0-9]/.test(input[i + 1])) {
        value += "."; // normalize comma to dot
        i++;
        while (i < input.length && /[0-9]/.test(input[i])) {
          value += input[i];
          i++;
        }
      }
      tokens.push({ type: "NUMBER", value, position: start });
      continue;
    }

    // Operators: * /
    if (char === "*" || char === "/") {
      tokens.push({ type: "OPERATOR", value: char, position: i });
      i++;
      continue;
    }

    // Word: letters (including accented), digits, hyphens
    if (/[a-zA-ZÀ-ÿ]/.test(char)) {
      const start = i;
      let value = "";
      while (i < input.length && /[a-zA-ZÀ-ÿ0-9_-]/.test(input[i])) {
        value += input[i];
        i++;
      }
      tokens.push({ type: "WORD", value, position: start });
      continue;
    }

    // Unknown character — skip
    i++;
  }

  return tokens;
}
