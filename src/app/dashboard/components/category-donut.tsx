"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getCategoryColor } from "@/lib/utils/category-colors";
import { formatCurrency } from "@/lib/utils/currency";
import { formatCategoryName } from "@/lib/utils/format";
import type { CategoryBreakdown } from "@/lib/actions/analytics";

interface CategoryDonutProps {
  data: CategoryBreakdown[];
  type: "expense" | "income";
  title: string;
}

export default function CategoryDonut({ data, type, title }: CategoryDonutProps) {
  const filtered = data.filter((d) => d.type === type);
  const total = filtered.reduce((acc, d) => acc + d.total_cents, 0);

  if (filtered.length === 0) {
    return (
      <div className="glass card" style={{ padding: "var(--space-6)", height: "100%" }}>
        <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-4)" }}>
          {title}
        </h4>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--color-text-tertiary)", fontSize: "var(--text-sm)" }}>
          Sem dados no período.
        </div>
      </div>
    );
  }

  const chartData = filtered.map((d) => ({
    name: formatCategoryName(d.name),
    value: d.total_cents / 100,
    count: d.count,
    color: getCategoryColor(d.name, d.type as "income" | "expense"),
  }));

  return (
    <div className="glass card" style={{ padding: "var(--space-6)", height: "100%" }}>
      <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-4)" }}>
        {title}
      </h4>

      <div className="donut-layout" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        {/* Chart */}
        <div style={{ width: "160px", height: "160px", position: "relative", flexShrink: 0 }}>
          <PieChart width={160} height={160}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-primary)",
              }}
              formatter={(value: any) => [formatCurrency(Math.round(Number(value) * 100)), ""]}
              labelFormatter={(label: any) => String(label)}
            />
          </PieChart>
          {/* Centro */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "var(--text-lg)", fontWeight: "700", color: type === "income" ? "var(--color-income)" : "var(--color-expense)" }}>
              {formatCurrency(total)}
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="donut-legend" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", overflow: "hidden" }}>
          {chartData.slice(0, 6).map((entry) => {
            const pct = ((entry.value / (total / 100)) * 100).toFixed(0);
            return (
              <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-xs)" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: entry.color, flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-text-secondary)" }}>
                  {entry.name}
                </span>
                <span style={{ fontWeight: "600", whiteSpace: "nowrap", color: "var(--color-text-primary)" }}>
                  {formatCurrency(Math.round(entry.value * 100))}
                </span>
                <span style={{ whiteSpace: "nowrap", color: "var(--color-text-tertiary)", minWidth: "32px", textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
          {chartData.length > 6 && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
              +{chartData.length - 6} categorias
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
