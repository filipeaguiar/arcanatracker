"use client";

import { useState, useEffect } from "react";
import { listCreditCards, CreditCard } from "@/lib/actions/credit-cards";
import { listInvoicesByCard, getInvoiceDetails, Invoice, InvoiceWithTransactions } from "@/lib/actions/invoices";
import { formatCurrency } from "@/lib/utils/currency";

export default function InvoicesPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithTransactions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listCreditCards().then(data => {
      setCards(data);
      if (data.length > 0) {
        const defaultCard = data.find(c => c.is_default) || data[0];
        setSelectedCardId(defaultCard.id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedCardId) {
      listInvoicesByCard(selectedCardId).then(setInvoices);
      setSelectedInvoice(null);
    }
  }, [selectedCardId]);

  async function handleInvoiceSelect(invoiceId: string) {
    setLoading(true);
    try {
      const details = await getInvoiceDetails(invoiceId);
      setSelectedInvoice(details);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <header>
        <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: "800", letterSpacing: "-0.03em" }}>
          Faturas de Cartão
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Visualize seus gastos por ciclo de fechamento.
        </p>
      </header>

      <div className="invoices-grid">
        <aside style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Card Selection */}
          <div className="glass" style={{ padding: "var(--space-4)" }}>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>Selecione o Cartão</label>
            <select
              className="input"
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              style={{ width: "100%", background: "var(--color-bg-secondary)" }}
            >
              {cards.map(card => (
                <option key={card.id} value={card.id}>{card.name}</option>
              ))}
            </select>
          </div>

          {/* Invoice List */}
          <div className="glass" style={{ padding: "var(--space-4)" }}>
            <h3 style={{ fontSize: "var(--text-sm)", fontWeight: "600", marginBottom: "var(--space-4)", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>
              Ciclos de Fatura
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {invoices.length === 0 ? (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>Nenhuma fatura encontrada.</p>
              ) : (
                invoices.map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => handleInvoiceSelect(inv.id)}
                    className={`btn ${selectedInvoice?.id === inv.id ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ justifyContent: "flex-start", fontSize: "var(--text-sm)", padding: "var(--space-3)" }}
                  >
                    {new Date(inv.reference_month + "T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <section>
          {loading ? (
            <div className="glass card" style={{ padding: "var(--space-20)", textAlign: "center" }}>
              <p style={{ color: "var(--color-text-secondary)" }}>Carregando detalhes da fatura...</p>
            </div>
          ) : selectedInvoice ? (
            <div className="animate-scale-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              {/* Invoice Summary Card */}
              <div className="glass" style={{ padding: "var(--space-8)", background: "var(--gradient-brand)", color: "white", border: "none" }}>
                <div className="invoice-summary-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: "var(--text-xs)", opacity: 0.8, textTransform: "uppercase", fontWeight: "700" }}>Total da Fatura</div>
                    <div style={{ fontSize: "var(--text-4xl)", fontWeight: "900" }}>{formatCurrency(selectedInvoice.total_cents)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "var(--text-xs)", opacity: 0.8, fontWeight: "700" }}>Vencimento</div>
                    <div style={{ fontSize: "var(--text-lg)", fontWeight: "700" }}>
                      {new Date(selectedInvoice.due_date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Table — Desktop */}
              <div className="glass" style={{ overflow: "hidden" }}>
                <div className="tx-table">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--color-text-secondary)", letterSpacing: "0.05em" }}>
                        <th style={{ padding: "var(--space-4) var(--space-6)" }}>Data</th>
                        <th style={{ padding: "var(--space-4) var(--space-6)" }}>Descrição</th>
                        <th style={{ padding: "var(--space-4) var(--space-6)", textAlign: "right" }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.transactions.map(tx => (
                        <tr key={tx.id} style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                          <td style={{ padding: "var(--space-4) var(--space-6)", fontSize: "var(--text-sm)" }}>
                            {new Date(tx.transaction_date).toLocaleDateString("pt-BR")}
                          </td>
                          <td style={{ padding: "var(--space-4) var(--space-6)" }}>
                            <div style={{ fontSize: "var(--text-sm)", fontWeight: "500" }}>{tx.description}</div>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{tx.category?.name}</div>
                          </td>
                          <td style={{ padding: "var(--space-4) var(--space-6)", textAlign: "right", fontWeight: "600" }}>
                            {formatCurrency(tx.amount_cents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards de Transações da Fatura — Mobile */}
                <div className="tx-card-list">
                  {selectedInvoice.transactions.map(tx => (
                    <div key={tx.id} className="tx-card">
                      <div className="tx-card-top">
                        <div className="tx-card-desc">
                          <span>{tx.description}</span>
                        </div>
                        <div className="tx-card-amount">
                          {formatCurrency(tx.amount_cents)}
                        </div>
                      </div>
                      <div className="tx-card-meta">
                        <span>{new Date(tx.transaction_date).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}</span>
                        {tx.category?.name && (
                          <span className="badge badge-expense">{tx.category.name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass card" style={{ padding: "var(--space-20)", textAlign: "center", borderStyle: "dashed" }}>
              <p style={{ color: "var(--color-text-tertiary)" }}>Selecione uma fatura para ver os detalhes.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
