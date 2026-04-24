import { Suspense } from "react";
import { SummarySkeleton } from "@/app/components/ui/skeleton";
import SummaryCards from "./components/summary-cards";
import QuickInput from "./components/quick-input";
import TransactionList from "./components/transaction-list";
import MonthSelector from "./components/month-selector";
import CategoryDonut from "./components/category-donut";
import DailyChart from "./components/daily-chart";
import { getCategoryBreakdown, getDailySpending } from "@/lib/actions/analytics";
import { getTransactionSummary } from "@/lib/actions/transactions";
import { formatCurrency } from "@/lib/utils/currency";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface DashboardProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month !== undefined ? parseInt(params.month) : now.getMonth();

  // Calcula o intervalo do mês selecionado
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const startStr = startOfMonth.toISOString().split("T")[0];
  const endStr = endOfMonth.toISOString().split("T")[0];

  // Busca todos os dados do mês em paralelo
  const [summary, categoryData, dailyData] = await Promise.all([
    getTransactionSummary(startStr, endStr),
    getCategoryBreakdown(startStr, endStr),
    getDailySpending(startStr, endStr),
  ]);

  const summaryCards = [
    {
      title: "Saldo do Mês",
      value: summary.balance_cents,
      type: "neutral" as const,
      icon: <Wallet size={20} color="var(--color-text-secondary)" />,
    },
    {
      title: "Receitas",
      value: summary.total_income_cents,
      type: "income" as const,
      icon: <TrendingUp size={20} color="var(--color-income)" />,
    },
    {
      title: "Despesas",
      value: summary.total_expense_cents,
      type: "expense" as const,
      icon: <TrendingDown size={20} color="var(--color-expense)" />,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {/* Header com seletor de mês */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: "800", letterSpacing: "-0.03em" }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Panorama financeiro do mês.
          </p>
        </div>
        <MonthSelector year={year} month={month} />
      </header>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        {summaryCards.map((card) => (
          <div key={card.title} className="glass card" style={{ padding: "var(--space-6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
              {card.icon}
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: "500" }}>
                {card.title}
              </span>
            </div>
            <div
              style={{
                fontSize: "var(--text-3xl)",
                fontWeight: "700",
                color: card.type === "expense" ? "var(--color-expense)" : card.type === "income" ? "var(--color-income)" : "var(--color-text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {formatCurrency(card.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid-cols-responsive" style={{ marginBottom: "var(--space-8)" }}>
        <CategoryDonut data={categoryData} type="expense" title="Despesas por Categoria" />
        <DailyChart data={dailyData} year={year} month={month} />
      </div>

      {/* Quick Input */}
      <QuickInput />

      {/* Transaction List */}
      <Suspense fallback={<SummarySkeleton />}>
        <TransactionList from={startStr} to={endStr} />
      </Suspense>
    </div>
  );
}
