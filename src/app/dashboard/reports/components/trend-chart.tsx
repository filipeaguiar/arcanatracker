"use client";

import { useTheme } from "next-themes";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DailySpending } from "@/lib/actions/analytics";

interface TrendChartProps {
  data: DailySpending[];
  period: string; // "monthly", "quarterly", "semiannual", "annual"
}

export default function TrendChart({ data, period }: TrendChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const textColor = isDark ? "#9ca3af" : "#6b7280";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  // Se for "annual" ou "semiannual", vamos agrupar por mês
  let chartData: any[] = [];

  if (period === "annual" || period === "semiannual") {
    const monthlyMap = new Map<string, { name: string; despesas: number; receitas: number }>();
    
    // Inicializar mapa para garantir que todos os meses apareçam na ordem correta se quisermos, 
    // mas vamos agrupar o que tem dados primeiro.
    data.forEach(d => {
      // d.date is YYYY-MM-DD
      const [year, month] = d.date.split("-");
      const key = `${year}-${month}`;
      const existing = monthlyMap.get(key) || { name: `${month}/${year}`, despesas: 0, receitas: 0 };
      existing.despesas += d.expense_cents / 100;
      existing.receitas += d.income_cents / 100;
      monthlyMap.set(key, existing);
    });

    chartData = Array.from(monthlyMap.values());
  } else {
    // Para mensal ou trimestral, agrupar por dia ou semana? Vamos manter por dia.
    chartData = data.map(d => {
      const [_, month, day] = d.date.split("-");
      return {
        name: `${day}/${month}`,
        despesas: d.expense_cents / 100,
        receitas: d.income_cents / 100,
      };
    });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass" style={{ padding: "12px", border: "1px solid var(--color-glass-border)", borderRadius: "8px", fontSize: "12px" }}>
          <p style={{ fontWeight: 600, marginBottom: "8px", color: "var(--color-text-primary)" }}>{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", gap: "16px", color: entry.color }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 600 }}>R$ {entry.value.toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass card" style={{ padding: "var(--space-6)" }}>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Tendência de Gastos
        </h3>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)" }}>
          Evolução de receitas e despesas no período
        </p>
      </div>

      {chartData.length === 0 ? (
        <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)" }}>
          Sem dados para exibir
        </div>
      ) : (
        <div style={{ height: "300px", width: "100%", minHeight: "300px" }}>
          <ResponsiveContainer width="99%" height="100%">
            {(period === "monthly") ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: textColor, fontSize: 10 }} 
                  dy={10}
                  minTickGap={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: textColor, fontSize: 10 }}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="receitas" name="Receitas" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="despesas" name="Despesas" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: textColor, fontSize: 10 }} 
                  dy={10}
                  minTickGap={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: textColor, fontSize: 10 }}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Area 
                  type="monotone" 
                  dataKey="receitas" 
                  name="Receitas" 
                  stroke="var(--color-income)" 
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="despesas" 
                  name="Despesas" 
                  stroke="var(--color-expense)" 
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
