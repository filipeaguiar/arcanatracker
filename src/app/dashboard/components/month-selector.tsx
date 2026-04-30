"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, Loader2, ChevronDown } from "lucide-react";

interface MonthSelectorProps {
  year: number;
  month: number; // 0-indexed (0 = Janeiro)
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function MonthSelector({ year, month }: MonthSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const label = new Date(year, month, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  const navigate = (y: number, m: number) => {
    setShowPicker(false);
    startTransition(() => {
      router.push(`/dashboard?year=${y}&month=${m}`);
    });
  };

  const prevDate = new Date(year, month - 1, 1);
  const nextDate = new Date(year, month + 1, 1);

  // Close picker on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      <div className="month-selector-label" style={{ minWidth: "180px", position: "relative" }} ref={pickerRef}>
        <button 
          onClick={() => !isPending && setShowPicker(!showPicker)}
          className="btn btn-ghost"
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "var(--space-2)", 
            justifyContent: "center", 
            width: "100%",
            fontSize: "var(--text-lg)",
            fontWeight: "700",
            textTransform: "capitalize",
            cursor: isPending ? "wait" : "pointer"
          }}
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" style={{ color: "var(--color-brand-primary)" }} />
          ) : (
            <ChevronDown size={16} style={{ transform: showPicker ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
          )}
          {label}
        </button>

        {showPicker && (
          <div className="month-picker-popover animate-scale-in">
            <div style={{ gridColumn: "span 3", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)", padding: "0 4px" }}>
              <button onClick={() => navigate(year - 1, month)} className="btn btn-ghost" style={{ padding: "4px" }}><ChevronLeft size={16} /></button>
              <span style={{ fontWeight: "bold" }}>{year}</span>
              <button onClick={() => navigate(year + 1, month)} className="btn btn-ghost" style={{ padding: "4px" }}><ChevronRight size={16} /></button>
            </div>
            {MONTHS.map((mName, idx) => (
              <div 
                key={mName}
                onClick={() => navigate(year, idx)}
                className={`month-picker-item ${idx === month ? "active" : ""}`}
              >
                {mName.substring(0, 3)}
              </div>
            ))}
          </div>
        )}
        
        {!isCurrentMonth && !showPicker && (
          <button 
            onClick={() => navigate(now.getFullYear(), now.getMonth())} 
            className="badge badge-neutral month-selector-today" 
            style={{ 
              position: "absolute",
              bottom: "-24px",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "2px 8px", 
              cursor: "pointer", 
              border: "none", 
              display: "flex", 
              alignItems: "center", 
              gap: "4px",
              fontSize: "10px",
              whiteSpace: "nowrap"
            }}
            title="Ir para hoje"
            disabled={isPending}
          >
            <Calendar size={10} /> Voltar para Hoje
          </button>
        )}
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
