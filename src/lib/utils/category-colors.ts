/**
 * Sistema de cores determinísticas para categorias.
 *
 * Cada categoria recebe uma cor fixa baseada em seu nome,
 * garantindo consistência visual em todos os gráficos e badges.
 */

// Paleta curada — cores vibrantes que funcionam bem em dark mode
const CATEGORY_PALETTE = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a78bfa", // purple light
  "#ec4899", // pink
  "#f43f5e", // rose
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo alt
  "#d946ef", // fuchsia
  "#f472b6", // pink light
  "#fb923c", // orange light
];

// Cache de cores atribuídas por nome de categoria
const colorCache = new Map<string, string>();

/**
 * Retorna uma cor determinística para o nome da categoria.
 * O mesmo nome sempre produz a mesma cor.
 */
export function getCategoryColor(name: string): string {
  if (colorCache.has(name)) return colorCache.get(name)!;

  // Gera um hash simples do nome
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % CATEGORY_PALETTE.length;
  const color = CATEGORY_PALETTE[index];
  colorCache.set(name, color);
  return color;
}

/**
 * Retorna a cor com opacidade (para backgrounds).
 */
export function getCategoryBgColor(name: string, opacity = 0.15): string {
  const hex = getCategoryColor(name);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
