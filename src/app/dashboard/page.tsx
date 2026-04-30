import { Suspense } from "react";
import { SummarySkeleton } from "@/app/components/ui/skeleton";
import { DesktopTransactionForm } from "./components/desktop-transaction-form";
import { MobileTransactionFab } from "./components/mobile-transaction-fab";
import TransactionList from "./components/transaction-list";
import MonthSelector from "./components/month-selector";
import CategoryDonut from "./components/category-donut";
import DailyChart from "./components/daily-chart";
import { getCategoryBreakdown, getDailySpending } from "@/lib/actions/analytics";
import { getTransactionSummary } from "@/lib/actions/transactions";
import { listCategories } from "@/lib/actions/categories";
import { listTags } from "@/lib/actions/tags";
import { listCreditCards } from "@/lib/actions/credit-cards";
import { formatAmount } from "@/lib/utils/currency";
import { Wallet, TrendingUp, TrendingDown, Layers } from "lucide-react";

interface DashboardProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export const unstable_instant = { 
  prefetch: 'static',
  samples: [
    { searchParams: { year: null, month: null } }
  ]
};

// Componente interno que lida com os dados dinâmicos
async function DashboardContent({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month !== undefined ? parseInt(params.month) : now.getMonth();

  // Calcula o intervalo do mês selecionado
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const startStr = startOfMonth.toISOString().split("T")[0];
  const endStr = endOfMonth.toISOString().split("T")[0];

  // Busca todos os dados em paralelo
  const [summary, totalSummary, categoryData, dailyData, categories, tags, cards] = await Promise.all([
    getTransactionSummary(startStr, endStr),
    getTransactionSummary(undefined, endStr), 
    getCategoryBreakdown(startStr, endStr),
    getDailySpending(startStr, endStr),
    listCategories(),
    listTags(),
    listCreditCards(),
  ]);

  const summaryCards = [
    {
      title: "Saldo Geral",
      value: Math.abs(totalSummary.balance_cents),
      type: totalSummary.balance_cents >= 0 ? ("income" as const) : ("expense" as const),
      icon: <Layers size={20} color="var(--color-text-secondary)" />,
    },
    {
      title: "Saldo do Mês",
      value: Math.abs(summary.balance_cents),
      type: summary.balance_cents >= 0 ? ("income" as const) : ("expense" as const),
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
    <>
      {/* Header com seletor de mês */}
      <header className="dashboard-page-header">
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
      <div className="summary-cards-grid">
        {summaryCards.map((card) => (
          <div key={card.title} className="glass card summary-card">
            <div className="summary-card-header">
              {card.icon}
              <span className="summary-card-title">
                {card.title}
              </span>
            </div>
            <div
              className="summary-card-value"
              style={{
                color: card.type === "expense" ? "var(--color-expense)" : card.type === "income" ? "var(--color-income)" : "var(--color-text-primary)",
              }}
            >
              <div className="summary-card-value-container">
                <span className="summary-card-currency">R$</span>
                <span className="summary-card-amount">{formatAmount(card.value)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid-cols-responsive" style={{ marginBottom: "var(--space-8)" }}>
        <CategoryDonut data={categoryData} type="expense" title="Despesas por Categoria" />
        <DailyChart data={dailyData} year={year} month={month} />
      </div>

      {/* Input de Transações */}
      <DesktopTransactionForm categories={categories} cards={cards} />
      <MobileTransactionFab categories={categories} tags={tags} />

      {/* Transaction List */}
      <Suspense fallback={<SummarySkeleton />}>
        <TransactionList from={startStr} to={endStr} />
      </Suspense>
    </>
  );
}

export default function DashboardPage({ searchParams }: DashboardProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <Suspense fallback={<SummarySkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
