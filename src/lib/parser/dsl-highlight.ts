/**
 * Tracker DSL — Highlight Utility
 *
 * Segments a DSL input string into typed parts for colorized rendering.
 * Preserves the original characters (including spaces) so the output
 * can be rendered as an overlay on top of a transparent-text input.
 *
 * This does NOT reuse the server parser — it's a lightweight, client-safe
 * version focused on presentation, not validation.
 */

export type SegmentType =
  | "value"
  | "operator"
  | "description"
  | "category"
  | "tag"
  | "space"
  | "unknown";

export interface DslSegment {
  text: string;
  type: SegmentType;
}

/**
 * Internal token with position tracking for reconstruction.
 */
interface PositionedToken {
  type: "NUMBER" | "OPERATOR" | "TAG" | "WORD";
  value: string;
  /** Start index in original string (inclusive) */
  start: number;
  /** End index in original string (exclusive) */
  end: number;
}

/**
 * Tokenize with full position tracking.
 * Accepts comma as decimal separator (same as the real lexer).
 */
function tokenizeWithPositions(input: string): PositionedToken[] {
  const tokens: PositionedToken[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    // Skip whitespace (handled separately in segment reconstruction)
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
        tokens.push({ type: "TAG", value: `#${value}`, start, end: i });
      }
      continue;
    }

    // Number: digits with optional decimal (. or ,)
    if (/[0-9]/.test(char)) {
      const start = i;
      let value = "";
      while (i < input.length && /[0-9]/.test(input[i])) {
        value += input[i];
        i++;
      }
      // Decimal part
      if (
        i < input.length &&
        (input[i] === "." || input[i] === ",") &&
        i + 1 < input.length &&
        /[0-9]/.test(input[i + 1])
      ) {
        value += input[i]; // keep original char for display
        i++;
        while (i < input.length && /[0-9]/.test(input[i])) {
          value += input[i];
          i++;
        }
      }
      tokens.push({ type: "NUMBER", value, start, end: i });
      continue;
    }

    // Operators: * /
    if (char === "*" || char === "/") {
      tokens.push({ type: "OPERATOR", value: char, start: i, end: i + 1 });
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
      tokens.push({ type: "WORD", value, start, end: i });
      continue;
    }

    // Unknown character — skip
    i++;
  }

  return tokens;
}

/**
 * Determine the semantic role of each token, then reconstruct
 * the full string as an array of typed segments (including spaces).
 */
export function highlightDsl(input: string): DslSegment[] {
  if (!input) return [];

  const tokens = tokenizeWithPositions(input);
  if (tokens.length === 0) {
    // All spaces or unknown chars
    return input.length > 0 ? [{ text: input, type: "unknown" }] : [];
  }

  // ─── Step 1: Classify tokens ───────────────────────────────────────

  // Detect installment pattern: NUMBER OPERATOR NUMBER
  let installmentEnd = -1; // index into tokens[] of last installment token
  let hasInstallment = false;

  for (let idx = 0; idx < tokens.length - 2; idx++) {
    if (
      tokens[idx].type === "NUMBER" &&
      tokens[idx + 1].type === "OPERATOR" &&
      tokens[idx + 2].type === "NUMBER"
    ) {
      installmentEnd = idx + 2;
      hasInstallment = true;
      break;
    }
  }

  // Simple value: single NUMBER if no installment
  let simpleValueIdx = -1;
  if (!hasInstallment) {
    const numberTokens = tokens
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t.type === "NUMBER");
    if (numberTokens.length === 1) {
      simpleValueIdx = numberTokens[0].i;
    }
  }

  // Separate content tokens (non-value, non-operator)
  const contentTokenIndices: number[] = [];
  for (let idx = 0; idx < tokens.length; idx++) {
    if (hasInstallment && idx <= installmentEnd) continue;
    if (!hasInstallment && idx === simpleValueIdx) continue;
    if (tokens[idx].type !== "OPERATOR") {
      contentTokenIndices.push(idx);
    }
  }

  // Tags
  const tagIndices = new Set(
    contentTokenIndices.filter((idx) => tokens[idx].type === "TAG")
  );

  // Words (non-tag content)
  const wordIndices = contentTokenIndices.filter(
    (idx) => tokens[idx].type === "WORD"
  );

  // Category = last word
  const categoryIdx = wordIndices.length > 0 ? wordIndices[wordIndices.length - 1] : -1;

  // Description = remaining words
  const descriptionIndices = new Set(
    wordIndices.filter((idx) => idx !== categoryIdx)
  );

  // ─── Step 2: Build role map ────────────────────────────────────────

  type TokenRole = SegmentType;
  const roleMap = new Map<number, TokenRole>();

  for (let idx = 0; idx < tokens.length; idx++) {
    if (hasInstallment && idx <= installmentEnd) {
      roleMap.set(idx, tokens[idx].type === "OPERATOR" ? "operator" : "value");
    } else if (!hasInstallment && idx === simpleValueIdx) {
      roleMap.set(idx, "value");
    } else if (tagIndices.has(idx)) {
      roleMap.set(idx, "tag");
    } else if (idx === categoryIdx) {
      roleMap.set(idx, "category");
    } else if (descriptionIndices.has(idx)) {
      roleMap.set(idx, "description");
    } else {
      roleMap.set(idx, "unknown");
    }
  }

  // ─── Step 3: Reconstruct string with segments ──────────────────────

  const segments: DslSegment[] = [];
  let cursor = 0;

  for (let idx = 0; idx < tokens.length; idx++) {
    const token = tokens[idx];

    // Emit any gap (spaces/unknown chars) before this token
    if (cursor < token.start) {
      const gap = input.substring(cursor, token.start);
      // Attach space to preceding segment's type for smoother coloring,
      // or use "space" if it's the first segment
      segments.push({ text: gap, type: "space" });
    }

    // Emit the token itself
    const role = roleMap.get(idx) || "unknown";
    segments.push({ text: token.value, type: role });

    cursor = token.end;
  }

  // Trailing characters (spaces etc.)
  if (cursor < input.length) {
    segments.push({ text: input.substring(cursor), type: "space" });
  }

  return segments;
}

/**
 * Extract a human-readable summary of parsed parts for the pill display.
 * Returns null for parts that weren't detected.
 */
export interface DslParsedParts {
  value: string | null;
  description: string | null;
  category: string | null;
  tags: string[];
}

export function extractParts(input: string): DslParsedParts {
  const tokens = tokenizeWithPositions(input);

  let value: string | null = null;
  let hasInstallment = false;
  let installmentEnd = -1;

  // Detect installment
  for (let idx = 0; idx < tokens.length - 2; idx++) {
    if (
      tokens[idx].type === "NUMBER" &&
      tokens[idx + 1].type === "OPERATOR" &&
      tokens[idx + 2].type === "NUMBER"
    ) {
      value = `${tokens[idx].value}${tokens[idx + 1].value}${tokens[idx + 2].value}`;
      installmentEnd = idx + 2;
      hasInstallment = true;
      break;
    }
  }

  // Simple value
  if (!hasInstallment) {
    const numberTokens = tokens.filter((t) => t.type === "NUMBER");
    if (numberTokens.length === 1) {
      value = numberTokens[0].value;
    }
  }

  // Content tokens
  const contentTokens = tokens.filter((t, idx) => {
    if (hasInstallment && idx <= installmentEnd) return false;
    if (
      !hasInstallment &&
      t.type === "NUMBER" &&
      tokens.filter((tt) => tt.type === "NUMBER").length === 1
    )
      return false;
    return t.type !== "OPERATOR";
  });

  const tags = contentTokens
    .filter((t) => t.type === "TAG")
    .map((t) => t.value);

  const words = contentTokens.filter((t) => t.type === "WORD");
  const category = words.length > 0 ? words[words.length - 1].value : null;
  const descriptionWords = words.slice(0, -1);
  const description =
    descriptionWords.length > 0
      ? descriptionWords.map((t) => t.value).join(" ")
      : null;

  return { value, description, category, tags };
}
