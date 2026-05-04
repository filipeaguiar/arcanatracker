/**
 * Sistema de cores determinísticas para categorias.
 *
 * Agora separa despesas e receitas.
 */

// Cores para Despesas (sem tons de verde)
const EXPENSE_PALETTE = [
  "#f43f5e", // rose
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#ec4899", // pink
  "#d946ef", // fuchsia
  "#8b5cf6", // violet
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#0ea5e9", // sky
  "#06b6d4", // cyan
];

// Cores para Receitas (tons de verde, azul e neutros)
const INCOME_PALETTE = [
  "#22c55e", // green
  "#10b981", // emerald
  "#84cc16", // lime
  "#14b8a6", // teal
];

const colorCache = new Map<string, string>();

/**
 * Retorna uma cor determinística para o nome da categoria,
 * baseada no tipo (income/expense).
 */
export function getCategoryColor(name: string, type: "income" | "expense" = "expense"): string {
  const cacheKey = `${type}:${name}`;
  if (colorCache.has(cacheKey)) return colorCache.get(cacheKey)!;

  const palette = type === "income" ? INCOME_PALETTE : EXPENSE_PALETTE;

  // Hash simples
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % palette.length;
  const color = palette[index];
  colorCache.set(cacheKey, color);
  return color;
}

/**
 * Retorna a cor com opacidade.
 */
export function getCategoryBgColor(name: string, type: "income" | "expense" = "expense", opacity = 0.15): string {
  const hex = getCategoryColor(name, type);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
