// src/lib/utils/format.ts

/**
 * Formats a category name for display.
 * Replaces hyphens and underscores with spaces.
 * Example: "alimentacao-fora" -> "alimentacao fora"
 */
export function formatCategoryName(name?: string): string {
  if (!name) return "";
  return name.replace(/[-_]/g, " ");
}
