"use client";

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface MonthSelectorProps {
  year: number;
  month: number; // 0-indexed (0 = Janeiro)
}

export default function MonthSelector({ year, month }: MonthSelectorProps) {
  const label = new Date(year, month, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  // Build URLs for prev/next month
  const prevDate = new Date(year, month - 1, 1);
  const nextDate = new Date(year, month + 1, 1);

  const prevParams = `?year=${prevDate.getFullYear()}&month=${prevDate.getMonth()}`;
  const nextParams = `?year=${nextDate.getFullYear()}&month=${nextDate.getMonth()}`;
  const todayParams = `?year=${now.getFullYear()}&month=${now.getMonth()}`;

  return (
    <div className="month-selector-container" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
      <a href={`/dashboard${prevParams}`} className="btn btn-ghost" style={{ padding: "var(--space-2)" }}>
        <ChevronLeft size={20} />
      </a>

      <div className="month-selector-label" style={{ minWidth: "200px", textAlign: "center" }}>
        <div style={{ fontSize: "var(--text-lg)", fontWeight: "700", textTransform: "capitalize" }}>
          {label}
        </div>
      </div>

      <a href={`/dashboard${nextParams}`} className="btn btn-ghost" style={{ padding: "var(--space-2)" }}>
        <ChevronRight size={20} />
      </a>

      {!isCurrentMonth && (
        <a href={`/dashboard${todayParams}`} className="btn btn-ghost" style={{ fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
          <Calendar size={14} /> <span className="desktop-only-inline">Hoje</span>
        </a>
      )}
    </div>
  );
}
