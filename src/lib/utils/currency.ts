/**
 * Currency utilities
 *
 * All monetary operations use integers (cents) to avoid floating-point errors.
 */

/**
 * Format cents as a display string (e.g., 10050 → "R$ 100,50")
 */
export function formatCurrency(cents: number, locale = "pt-BR"): string {
  const value = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Format cents as a compact number without currency symbol (e.g., 10050 → "100,50")
 */
export function formatAmount(cents: number, locale = "pt-BR"): string {
  const value = cents / 100;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parse a user-entered decimal string to cents.
 * Uses string manipulation to avoid float precision issues.
 *
 * "100"    → 10000
 * "10.50"  → 1050
 * "100.01" → 10001
 */
export function parseToCents(value: string): number {
  const parts = value.split(".");
  if (parts.length === 1) {
    return parseInt(parts[0], 10) * 100;
  }
  const intPart = parseInt(parts[0], 10);
  let decStr = parts[1];
  if (decStr.length === 1) {
    decStr += "0";
  } else if (decStr.length > 2) {
    decStr = decStr.substring(0, 2);
  }
  return intPart * 100 + parseInt(decStr, 10);
}
