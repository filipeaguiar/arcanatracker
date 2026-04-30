"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Database, Loader2 } from "lucide-react";
import { exportData } from "@/lib/actions/export";

interface ReportFilterBarProps {
  currentPeriod: string;
  refDate: string;
}

export default function ReportFilterBar({ currentPeriod, refDate }: ReportFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (period: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleExport = async (format: "csv" | "moneylog") => {
    const year = new Date(refDate).getFullYear();
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;

    const res = await exportData(from, to, format);
    if (res.success && res.data) {
      const blob = new Blob([res.data], { type: "text/plain;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arcanatracker_${format}_${year}.${format === "csv" ? "csv" : "txt"}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      alert("Erro ao exportar: " + res.error);
    }
  };

  return (
    <div className="glass" style={{ padding: "var(--space-4)", display: "flex", flexWrap: "wrap", gap: "var(--space-4)", justifyContent: "space-between", alignItems: "center", opacity: isPending ? 0.7 : 1, transition: "opacity 0.2s" }}>
      
      {/* Period Selector */}
      <div style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto", alignItems: "center" }}>
        {isPending && <Loader2 size={16} className="animate-spin" style={{ color: "var(--color-brand-primary)" }} />}
        
        {[
          { id: "monthly", label: "Mês" },
          { id: "quarterly", label: "Trimestre" },
          { id: "semiannual", label: "Semestre" },
          { id: "annual", label: "Ano" }
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => handlePeriodChange(p.id)}
            disabled={isPending}
            className={`btn ${currentPeriod === p.id ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-full)" }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Export Actions */}
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <button onClick={() => handleExport("csv")} className="btn btn-outline" title="Exportar CSV">
          <Download size={18} /> <span className="desktop-only">CSV</span>
        </button>
        <button onClick={() => handleExport("moneylog")} className="btn btn-outline" title="Exportar MoneyLog">
          <Database size={18} /> <span className="desktop-only">MoneyLog</span>
        </button>
      </div>

    </div>
  );
}
