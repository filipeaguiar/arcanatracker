"use client";

import { useEffect, useState } from "react";
import { listCreditCards, deleteCreditCard, CreditCard } from "@/lib/actions/credit-cards";

export default function CardList({ refreshKey }: { refreshKey: number }) {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCards() {
    setLoading(true);
    try {
      const data = await listCreditCards();
      setCards(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadCards();
  }, [refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este cartão? Todas as transações vinculadas a ele ficarão sem cartão.")) return;
    await deleteCreditCard(id);
    loadCards();
  }

  if (loading) {
    return (
      <div className="glass card" style={{ padding: "var(--space-8)", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Carregando cartões...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-6)" }}>
      {cards.length === 0 ? (
        <div className="glass card" style={{ padding: "var(--space-10)", textAlign: "center", gridColumn: "1 / -1" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>Você ainda não tem cartões cadastrados.</p>
        </div>
      ) : (
        cards.map((card) => (
          <div key={card.id} className="glass card" style={{ padding: "var(--space-6)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
              <div>
                <h4 style={{ fontSize: "var(--text-lg)", fontWeight: "700" }}>{card.name}</h4>
                {card.is_default && (
                  <span className="badge badge-income" style={{ fontSize: "10px", marginTop: "var(--space-1)" }}>
                    Padrão
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(card.id)}
                className="btn btn-ghost"
                style={{ color: "var(--color-expense)", padding: "var(--space-1) var(--space-2)", fontSize: "var(--text-xs)" }}
              >
                Remover
              </button>
            </div>

            <div style={{ display: "flex", gap: "var(--space-8)", fontSize: "var(--text-sm)" }}>
              <div>
                <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", marginBottom: "2px" }}>Fechamento</div>
                <div style={{ fontWeight: "600" }}>Dia {card.closing_day}</div>
              </div>
              <div>
                <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", marginBottom: "2px" }}>Vencimento</div>
                <div style={{ fontWeight: "600" }}>Dia {card.due_day}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
