import { getTransactionSummary } from "@/lib/actions/transactions";
import { formatCurrency } from "@/lib/utils/currency";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

export default async function SummaryCards() {
  // Configura a data inicial e final do mês corrente
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Formata para YYYY-MM-DD local, para a query
  const startStr = startOfMonth.toISOString().split("T")[0];
  const endStr = endOfMonth.toISOString().split("T")[0];

  const summary = await getTransactionSummary(startStr, endStr);

  const cards = [
    {
      title: "Saldo do Mês",
      value: summary.balance_cents,
      type: "neutral",
      icon: <Wallet size={20} color="var(--color-text-secondary)" />,
    },
    {
      title: "Receitas",
      value: summary.total_income_cents,
      type: "income",
      icon: <TrendingUp size={20} color="var(--color-income)" />,
    },
    {
      title: "Despesas",
      value: summary.total_expense_cents,
      type: "expense",
      icon: <TrendingDown size={20} color="var(--color-expense)" />,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-10)" }}>
      {cards.map((card) => (
        <div key={card.title} className="glass card" style={{ padding: "var(--space-6)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              {card.icon}
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontWeight: "500" }}>
                {card.title}
              </span>
            </div>
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
  );
}
