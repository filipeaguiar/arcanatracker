"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatCategoryName } from "@/lib/utils/format";
import { DeleteButton } from "./delete-button";
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar, 
  CreditCard as CreditCardIcon, 
  Tag as TagIcon, 
  Search, 
  FilterX,
  Pencil,
  Trash2
} from "lucide-react";
import type { Transaction } from "@/lib/actions/transactions";
import type { Category } from "@/lib/actions/categories";
import type { Tag } from "@/lib/actions/tags";
import type { CreditCard } from "@/lib/actions/credit-cards";

// Swipe List imports
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
  LeadingActions,
  Type as SwipeType
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';

import { TransactionEditModal } from "./transaction-edit-modal";
import { deleteTransaction } from "@/lib/actions/transactions";

interface TransactionListClientProps {
  initialTransactions: Transaction[];
  categories: Category[];
  tags: Tag[];
  cards: CreditCard[];
}

export default function TransactionListClient({ 
  initialTransactions,
  categories,
  tags,
  cards
}: TransactionListClientProps) {
  const [query, setQuery] = useState("");
  const [negate, setNegate] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
        } catch {
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

  if (editingTransaction) {
    console.log("Tentando renderizar modal para:", editingTransaction.description);
  }

  return (
    <div className="glass" style={{ overflow: "hidden", position: "relative" }}>
      {/* Edit Modal */}
      {editingTransaction && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <TransactionEditModal
            transaction={editingTransaction}
            categories={categories}
            tags={tags}
            cards={cards}
            onClose={() => setEditingTransaction(null)}
          />
        </div>
      )}

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
                              <CreditCardIcon size={12} />
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
                              <TagIcon size={10} />
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
                        <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
                          <button 
                            onClick={() => {
                              console.log("Clicou no lápis para editar:", tx.id);
                              setEditingTransaction(tx);
                            }}
                            className="btn btn-ghost" 
                            style={{ padding: "var(--space-1)" }}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <DeleteButton id={tx.id} />
                        </div>
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
          <SwipeableList fullSwipe={false} type={SwipeType.IOS}>
            {filteredTransactions.map((tx) => {
              const isIncome = tx.category?.type === "income";
              
              const leadingActions = () => (
                <LeadingActions>
                  <SwipeAction onClick={() => setEditingTransaction(tx)}>
                    <div style={{ 
                      backgroundColor: 'var(--color-info)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '0 var(--space-6)',
                      height: '100%',
                      gap: 'var(--space-2)'
                    }}>
                      <Pencil size={20} />
                      <span style={{ fontWeight: '600' }}>Editar</span>
                    </div>
                  </SwipeAction>
                </LeadingActions>
              );

              const trailingActions = () => (
                <TrailingActions>
                  <SwipeAction
                    destructive={true}
                    onClick={() => {
                      if (confirm("Excluir transação?")) {
                        deleteTransaction(tx.id);
                      }
                    }}
                  >
                    <div style={{ 
                      backgroundColor: 'var(--color-expense)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '0 var(--space-6)',
                      height: '100%',
                      gap: 'var(--space-2)'
                    }}>
                      <Trash2 size={20} />
                      <span style={{ fontWeight: '600' }}>Apagar</span>
                    </div>
                  </SwipeAction>
                </TrailingActions>
              );

              return (
                <SwipeableListItem
                  key={tx.id}
                  leadingActions={leadingActions()}
                  trailingActions={trailingActions()}
                >
                  <div className="tx-card" style={{ width: '100%', background: 'var(--color-bg-secondary)' }}>
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
                          <CreditCardIcon size={10} />
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
                          <TagIcon size={10} />
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </SwipeableListItem>
              );
            })}
          </SwipeableList>
        )}
      </div>
    </div>
  );
}
