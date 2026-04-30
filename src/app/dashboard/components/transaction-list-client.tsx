"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatCategoryName } from "@/lib/utils/format";
import { DeleteButton } from "./delete-button";
import { ArrowDownRight, ArrowUpRight, Calendar, CreditCard, Tag, Search, FilterX } from "lucide-react";
import type { Transaction } from "@/lib/actions/transactions";

export default function TransactionListClient({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const [query, setQuery] = useState("");
  const [negate, setNegate] = useState(false);

  // Lógica do MoneyLog: Filtra as transações em tempo real
  const filteredTransactions = useMemo(() => {
    if (!query.trim()) return initialTransactions;

    return initialTransactions.filter((tx) => {
      let match = false;
      const q = query.toLowerCase().trim();

      // Filtro de Valor (prefixo v:)
      if (q.startsWith("v:")) {
        const valQuery = q.substring(2).trim();
        const amount = Math.abs(tx.amount_cents) / 100; // Valor nominal em reais para facilitar a busca
        const isIncome = tx.category?.type === "income";

        if (valQuery === "+") match = isIncome;
        else if (valQuery === "-") match = !isIncome;
        else if (valQuery.startsWith(">=")) match = amount >= parseFloat(valQuery.substring(2));
        else if (valQuery.startsWith("<=")) match = amount <= parseFloat(valQuery.substring(2));
        else if (valQuery.startsWith(">")) match = amount > parseFloat(valQuery.substring(1));
        else if (valQuery.startsWith("<")) match = amount < parseFloat(valQuery.substring(1));
        else if (valQuery.startsWith("=")) match = amount === parseFloat(valQuery.substring(1));
        else match = amount.toString().includes(valQuery);
      } 
      // Filtro de Texto (Regex simplificado ou includes)
      else {
        const searchText = `
          ${tx.description} 
          ${formatCategoryName(tx.category?.name)} 
          ${tx.tags?.map(t => t.name).join(" ")} 
          ${tx.transaction_date}
        `.toLowerCase();

        try {
          // Tenta usar Regex (como no MoneyLog avançado)
          const regex = new RegExp(q, "i");
          match = regex.test(searchText);
        } catch (e) {
          // Fallback para includes simples se o regex for inválido
          match = searchText.includes(q);
        }
      }

      // Se o botão "Inverter" estiver ativo, retorna o oposto
      return negate ? !match : match;
    });
  }, [initialTransactions, query, negate]);

  // Facilita o clique nas tags
  const handleTagClick = (tagName: string) => {
    setQuery(tagName);
    setNegate(false);
  };

  return (
    <div className="glass" style={{ overflow: "hidden" }}>
      {/* Cabeçalho e Barra de Busca (Omnibox) */}
      <div style={{ padding: "var(--space-6)", borderBottom: "1px solid var(--color-border-subtle)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "600", marginBottom: "var(--space-4)" }}>
          Transações Recentes
        </h3>
        
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} color="var(--color-text-tertiary)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              className="input"
              placeholder="Buscar... (Ex: mercado, v:>, #saude)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: "36px", background: "var(--color-bg-primary)" }}
            />
          </div>
          <button
            onClick={() => setNegate(!negate)}
            className={`btn ${negate ? 'btn-primary' : 'btn-ghost'}`}
            title="Inverter filtro (Esconder os resultados)"
            style={{ padding: "var(--space-3)", opacity: negate ? 1 : 0.6 }}
          >
            <FilterX size={20} />
          </button>
        </div>
        
        {/* Sumário do Filtro */}
        {query && (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>
            Exibindo {filteredTransactions.length} de {initialTransactions.length} lançamentos.
          </div>
        )}
      </div>

      {/* Tabela de Transações — Desktop */}
      <div className="tx-table">
        <div className="table-responsive">
          <table style={{ width: "100%", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--color-text-secondary)", letterSpacing: "0.05em" }}>
                <th style={{ padding: "var(--space-4) var(--space-6)" }}>Data</th>
                <th style={{ padding: "var(--space-4) var(--space-6)" }}>Descrição</th>
                <th style={{ padding: "var(--space-4) var(--space-6)" }}>Categoria</th>
                <th style={{ padding: "var(--space-4) var(--space-6)", textAlign: "right" }}>Valor</th>
                <th style={{ padding: "var(--space-4) var(--space-6)", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "var(--space-10)", textAlign: "center", color: "var(--color-text-secondary)" }}>
                    Nenhum lançamento corresponde ao filtro.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.category?.type === "income";
                  return (
                    <tr key={tx.id} style={{ borderTop: "1px solid var(--color-border-subtle)", transition: "background 0.2s" }} className="hover-row">
                      <td style={{ padding: "var(--space-4) var(--space-6)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <Calendar size={14} />
                          {new Date(tx.transaction_date + "T12:00:00").toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                        </div>
                      </td>
                      <td style={{ padding: "var(--space-4) var(--space-6)" }}>
                        <div style={{ fontSize: "var(--text-sm)", fontWeight: "500", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          {isIncome ? <ArrowUpRight size={16} color="var(--color-income)" /> : <ArrowDownRight size={16} color="var(--color-expense)" />}
                          {tx.description}
                        </div>
                        
                        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
                          {tx.installment_total && (
                            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <CreditCard size={12} />
                              Parcela {tx.installment_current}/{tx.installment_total}
                            </div>
                          )}
                          {tx.tags?.map((tag) => (
                            <button 
                              key={tag.id} 
                              onClick={() => handleTagClick(tag.name)}
                              style={{ cursor: "pointer", border: "1px solid var(--color-border-subtle)" }}
                              className="badge badge-neutral"
                            >
                              <Tag size={10} />
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "var(--space-4) var(--space-6)" }}>
                        <button 
                          onClick={() => handleTagClick(formatCategoryName(tx.category?.name) || "")}
                          className={`badge badge-${isIncome ? "income" : "expense"}`} 
                          style={{ fontSize: "10px", cursor: "pointer" }}
                        >
                          {formatCategoryName(tx.category?.name)}
                        </button>
                      </td>
                      <td style={{ padding: "var(--space-4) var(--space-6)", textAlign: "right", fontWeight: "600", color: isIncome ? "var(--color-income)" : "var(--color-text-primary)" }}>
                        {formatCurrency(tx.amount_cents)}
                      </td>
                      <td style={{ padding: "var(--space-4) var(--space-6)", textAlign: "right" }}>
                        <DeleteButton id={tx.id} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards de Transações — Mobile */}
      <div className="tx-card-list">
        {filteredTransactions.length === 0 ? (
          <div style={{ padding: "var(--space-10)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            Nenhum lançamento corresponde ao filtro.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isIncome = tx.category?.type === "income";
            return (
              <div key={tx.id} className="tx-card">
                <div className="tx-card-top">
                  <div className="tx-card-desc">
                    {isIncome ? <ArrowUpRight size={16} color="var(--color-income)" style={{ flexShrink: 0 }} /> : <ArrowDownRight size={16} color="var(--color-expense)" style={{ flexShrink: 0 }} />}
                    <span>{tx.description}</span>
                  </div>
                  <div className="tx-card-amount" style={{ color: isIncome ? "var(--color-income)" : "var(--color-text-primary)" }}>
                    {formatCurrency(tx.amount_cents)}
                  </div>
                </div>
                <div className="tx-card-meta">
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} />
                    {new Date(tx.transaction_date + "T12:00:00").toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                  </span>
                  <button 
                    onClick={() => handleTagClick(formatCategoryName(tx.category?.name) || "")}
                    className={`badge badge-${isIncome ? "income" : "expense"}`} 
                    style={{ cursor: "pointer" }}
                  >
                    {formatCategoryName(tx.category?.name)}
                  </button>
                  {tx.installment_total && (
                    <span className="badge badge-neutral" style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <CreditCard size={10} />
                      {tx.installment_current}/{tx.installment_total}
                    </span>
                  )}
                  {tx.tags?.map((tag) => (
                    <button 
                      key={tag.id} 
                      onClick={() => handleTagClick(tag.name)}
                      style={{ cursor: "pointer", border: "1px solid var(--color-border-subtle)" }}
                      className="badge badge-neutral"
                    >
                      <Tag size={10} />
                      {tag.name}
                    </button>
                  ))}
                  <div className="tx-card-actions">
                    <DeleteButton id={tx.id} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
