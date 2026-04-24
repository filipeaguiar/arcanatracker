"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import type { DailySpending } from "@/lib/actions/analytics";

interface DailyChartProps {
  data: DailySpending[];
  year: number;
  month: number; // 0-indexed
}

export default function DailyChart({ data, year, month }: DailyChartProps) {
  // Gera todos os dias do mês, preenchendo com zero os que não têm dados
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dataMap = new Map(data.map((d) => [d.date, d]));

  const chartData = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const entry = dataMap.get(dateStr);
    chartData.push({
      date: String(day),
      Despesas: (entry?.expense_cents ?? 0) / 100,
      Receitas: (entry?.income_cents ?? 0) / 100,
    });
  }

  return (
    <div className="glass card" style={{ padding: "var(--space-6)" }}>
      <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-4)" }}>
        Gastos Diários
      </h4>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-primary)",
            }}
            formatter={(value: any) => [formatCurrency(Math.round(Number(value) * 100)), ""]}
            labelFormatter={(day: any) => `Dia ${day}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}
          />
          <Bar dataKey="Despesas" fill="#fb7185" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Receitas" fill="#34d399" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
