"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from "lucide-react";

interface MonthSelectorProps {
  year: number;
  month: number; // 0-indexed (0 = Janeiro)
}

export default function MonthSelector({ year, month }: MonthSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const label = new Date(year, month, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  const navigate = (y: number, m: number) => {
    startTransition(() => {
      router.push(`/dashboard?year=${y}&month=${m}`);
    });
  };

  const prevDate = new Date(year, month - 1, 1);
  const nextDate = new Date(year, month + 1, 1);

  return (
    <div className="month-selector-container" style={{ opacity: isPending ? 0.7 : 1, transition: "opacity 0.2s" }}>
      <button 
        onClick={() => navigate(prevDate.getFullYear(), prevDate.getMonth())} 
        className="btn btn-ghost" 
        style={{ padding: "var(--space-2)" }} 
        title="Mês anterior"
        disabled={isPending}
      >
        <ChevronLeft size={20} />
      </button>

      <div className="month-selector-label" style={{ minWidth: "180px", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)", justifyContent: "center", width: "100%" }}>
          {isPending && (
            <Loader2 size={16} className="animate-spin" style={{ position: "absolute", left: "-24px", color: "var(--color-brand-primary)" }} />
          )}
          
          <span style={{ fontSize: "var(--text-lg)", fontWeight: "700", textTransform: "capitalize" }}>
            {label}
          </span>
          
          {!isCurrentMonth && (
            <button 
              onClick={() => navigate(now.getFullYear(), now.getMonth())} 
              className="badge badge-neutral month-selector-today" 
              style={{ padding: "4px 8px", cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: "4px" }}
              title="Ir para hoje"
              disabled={isPending}
            >
              <Calendar size={12} /> Hoje
            </button>
          )}
        </div>
      </div>

      <button 
        onClick={() => navigate(nextDate.getFullYear(), nextDate.getMonth())} 
        className="btn btn-ghost" 
        style={{ padding: "var(--space-2)" }} 
        title="Próximo mês"
        disabled={isPending}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
