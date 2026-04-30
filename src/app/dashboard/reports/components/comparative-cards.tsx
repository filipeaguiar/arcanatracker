"use client";

import { formatAmount } from "@/lib/utils/currency";
import { TrendingUp, TrendingDown, Layers, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { TransactionSummary } from "@/lib/actions/transactions";

interface ComparativeCardsProps {
  current: TransactionSummary;
  previous: TransactionSummary;
  periodName: string;
}

export default function ComparativeCards({ current, previous, periodName }: ComparativeCardsProps) {
  
  const calculateDelta = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0; // Se não tinha antes, assumimos 100% de aumento se tiver agora
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  const renderDelta = (delta: number, inverseGood = false) => {
    if (delta === 0) return <span style={{ color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", fontSize: "12px" }}><Minus size={14} /> 0%</span>;
    
    // Para despesas, aumento é ruim (inverseGood = true)
    const isGood = inverseGood ? delta < 0 : delta > 0;
    const color = isGood ? "var(--color-income)" : "var(--color-expense)";
    const Icon = delta > 0 ? ArrowUpRight : ArrowDownRight;

    return (
      <span style={{ color, display: "flex", alignItems: "center", fontSize: "12px", fontWeight: "600", background: "color-mix(in srgb, currentColor 10%, transparent)", padding: "2px 6px", borderRadius: "12px" }}>
        <Icon size={14} /> {Math.abs(delta).toFixed(1)}%
      </span>
    );
  };

  const cards = [
    {
      title: "Saldo do Período",
      value: current.balance_cents,
      prevValue: previous.balance_cents,
      icon: <Layers size={20} color="var(--color-text-secondary)" />,
      inverseGood: false
    },
    {
      title: "Receitas",
      value: current.total_income_cents,
      prevValue: previous.total_income_cents,
      icon: <TrendingUp size={20} color="var(--color-income)" />,
      inverseGood: false
    },
    {
      title: "Despesas",
      value: current.total_expense_cents,
      prevValue: previous.total_expense_cents,
      icon: <TrendingDown size={20} color="var(--color-expense)" />,
      inverseGood: true
    }
  ];

  return (
    <div className="summary-cards-grid">
      {cards.map((card) => {
        const delta = calculateDelta(card.value, card.prevValue);
        const typeColor = card.value >= 0 && card.title !== "Despesas" ? "var(--color-income)" : "var(--color-expense)";
        if (card.title === "Saldo do Período") {
          // Saldo usa a cor baseada no fato de ser positivo ou negativo
        }

        return (
          <div key={card.title} className="glass card summary-card">
            <div className="summary-card-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                {card.icon}
                <span className="summary-card-title" style={{ marginBottom: 0 }}>
                  {card.title}
                </span>
              </div>
              {renderDelta(delta, card.inverseGood)}
            </div>
            <div
              className="summary-card-value"
              style={{
                color: card.title === "Despesas" ? "var(--color-expense)" : card.title === "Receitas" ? "var(--color-income)" : (card.value >= 0 ? "var(--color-text-primary)" : "var(--color-expense)"),
              }}
            >
              <div className="summary-card-value-container">
                <span className="summary-card-currency">R$</span>
                <span className="summary-card-amount">{formatAmount(Math.abs(card.value))}</span>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "right", marginTop: "4px" }}>
              vs R$ {formatAmount(Math.abs(card.prevValue))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
