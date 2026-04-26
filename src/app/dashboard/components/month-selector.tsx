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
    <div className="month-selector-container">
      <a href={`/dashboard${prevParams}`} className="btn btn-ghost" style={{ padding: "var(--space-2)" }} title="Mês anterior">
        <ChevronLeft size={20} />
      </a>

      <div className="month-selector-label">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)", justifyContent: "center" }}>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: "700", textTransform: "capitalize" }}>
            {label}
          </span>
          
          {!isCurrentMonth && (
            <a 
              href={`/dashboard${todayParams}`} 
              className="badge badge-neutral month-selector-today" 
              style={{ padding: "4px 8px", cursor: "pointer", textDecoration: "none" }}
              title="Ir para hoje"
            >
              <Calendar size={12} /> Hoje
            </a>
          )}
        </div>
      </div>

      <a href={`/dashboard${nextParams}`} className="btn btn-ghost" style={{ padding: "var(--space-2)" }} title="Próximo mês">
        <ChevronRight size={20} />
      </a>
    </div>
  );
}
