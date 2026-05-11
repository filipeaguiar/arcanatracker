"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getCategoryColor } from "@/lib/utils/category-colors";
import { formatCurrency } from "@/lib/utils/currency";
import { formatCategoryName } from "@/lib/utils/format";
import type { CategorySpendingData } from "@/lib/actions/analytics";

interface CategorySpendingChartProps {
  data: CategorySpendingData[];
  categories: string[];
  isLoading?: boolean;
}

export default function CategorySpendingChart({
  data,
  categories,
  isLoading = false,
}: CategorySpendingChartProps) {
  const [chartType, setChartType] = useState<"line" | "area">("area");

  if (isLoading) {
    return (
      <div className="glass card" style={{ padding: "var(--space-6)", minHeight: "400px" }}>
        <div className="skeleton" style={{ height: "24px", width: "200px", marginBottom: "var(--space-6)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass card" style={{ padding: "var(--space-6)", minHeight: "400px" }}>
        <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "var(--space-6)" }}>
          Tendência de Gastos por Categoria
        </h4>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "var(--color-text-tertiary)" }}>
          Sem dados suficientes para gerar o gráfico.
        </div>
      </div>
    );
  }

  // Helper to format date in XAxis
  const formatDate = (tickItem: string) => {
    const date = new Date(tickItem + "T12:00:00");
    return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  };

  const chartData = data.map(d => {
    const entry: any = { ...d };
    categories.forEach(cat => {
      entry[cat] = (entry[cat] as number || 0) / 100; // Convert to float for display
    });
    return entry;
  });

  return (
    <div className="glass card" style={{ padding: "var(--space-6)", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Tendência de Gastos por Categoria
        </h4>
        
        <div style={{ display: "flex", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-md)", padding: "2px" }}>
          <button
            onClick={() => setChartType("area")}
            style={{
              padding: "var(--space-1) var(--space-3)",
              fontSize: "var(--text-xs)",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              background: chartType === "area" ? "var(--color-bg-primary)" : "transparent",
              color: chartType === "area" ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              boxShadow: chartType === "area" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Área
          </button>
          <button
            onClick={() => setChartType("line")}
            style={{
              padding: "var(--space-1) var(--space-3)",
              fontSize: "var(--text-xs)",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              background: chartType === "line" ? "var(--color-bg-primary)" : "transparent",
              color: chartType === "line" ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              boxShadow: chartType === "line" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Linha
          </button>
        </div>
      </div>

      <div style={{ width: "100%", height: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatDate} 
                tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(val) => `R$ ${val}`} 
                tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}
                formatter={(val: any) => [formatCurrency(Math.round(Number(val) * 100)), ""]}
                labelFormatter={(label) => formatDate(label as string)}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", paddingTop: "20px" }} />
              {categories.map((cat) => (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  name={formatCategoryName(cat)}
                  stackId="1"
                  stroke={cat === "Outros" ? "#94a3b8" : getCategoryColor(cat)}
                  fill={cat === "Outros" ? "#94a3b8" : getCategoryColor(cat)}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatDate} 
                tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(val) => `R$ ${val}`} 
                tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}
                formatter={(val: any) => [formatCurrency(Math.round(Number(val) * 100)), ""]}
                labelFormatter={(label) => formatDate(label as string)}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", paddingTop: "20px" }} />
              {categories.map((cat) => (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  name={formatCategoryName(cat)}
                  stroke={cat === "Outros" ? "#94a3b8" : getCategoryColor(cat)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
