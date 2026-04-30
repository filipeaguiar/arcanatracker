"use client";

import { formatAmount } from "@/lib/utils/currency";
import { Hash } from "lucide-react";
import type { TagBreakdown } from "@/lib/actions/analytics";

interface TagAnalysisProps {
  data: TagBreakdown[];
}

export default function TagAnalysis({ data }: TagAnalysisProps) {
  // Apenas as 15 principais tags para não poluir
  const topTags = data.slice(0, 15);
  const maxTotal = topTags.length > 0 ? Math.max(...topTags.map((t) => t.total_cents)) : 0;

  return (
    <div className="glass card" style={{ padding: "var(--space-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Hash size={20} className="text-brand-500" /> Detalhamento por Tags
          </h3>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)" }}>
            Principais despesas mapeadas (Top 15)
          </p>
        </div>
      </div>

      {topTags.length === 0 ? (
        <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-tertiary)" }}>
          Nenhuma tag encontrada no período.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {topTags.map((tag) => {
            const percentage = maxTotal > 0 ? (tag.total_cents / maxTotal) * 100 : 0;
            
            return (
              <div key={tag.name} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>#{tag.name}</span>
                    <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", background: "var(--color-bg-secondary)", padding: "2px 6px", borderRadius: "10px" }}>
                      {tag.count} tx
                    </span>
                  </div>
                  <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                    R$ {formatAmount(tag.total_cents)}
                  </span>
                </div>
                
                {/* Horizontal Bar */}
                <div style={{ height: "8px", background: "var(--color-bg-secondary)", borderRadius: "4px", overflow: "hidden" }}>
                  <div 
                    style={{ 
                      height: "100%", 
                      width: `${percentage}%`, 
                      background: "var(--gradient-brand)",
                      borderRadius: "4px",
                      transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)"
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
