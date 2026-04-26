"use client";

import { useState, useTransition } from "react";
import {
  createSubscription,
  updateSubscription,
  deleteSubscription,
  Subscription,
} from "@/lib/actions/subscriptions";
import { Category } from "@/lib/actions/categories";
import { formatCurrency } from "@/lib/utils/currency";
import { Repeat, Plus, Pencil, Trash2, Check, X, ArrowUpRight, ArrowDownRight, CalendarDays, Play, Pause } from "lucide-react";
import { getCategoryColor } from "@/lib/utils/category-colors";

export default function SubscriptionsClient({
  initialSubscriptions,
  categories,
}: {
  initialSubscriptions: Subscription[];
  categories: Category[];
}) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
  const [isPending, startTransition] = useTransition();

  // Create Form State
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newType, setNewType] = useState<"income" | "expense">("expense");
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  // Sync client state with server data (optimistic UI simplified)
  // Real apps would use SWR or React Query, but since Next App Router revalidates,
  // we just trigger a refresh or update our local state to reflect the action instantly.
  const refresh = () => {
    window.location.reload(); // Simple hard refresh to get fresh server data
  };

  async function handleCreate() {
    if (!newName || !newAmount || !newCategoryId) return;
    const amountCents = Math.round(parseFloat(newAmount.replace(",", ".")) * 100);
    
    startTransition(async () => {
      await createSubscription({
        name: newName,
        amount_cents: amountCents,
        category_id: newCategoryId,
        type: newType,
        start_date: newStartDate,
      });
      refresh();
    });
  }

  function startEditing(sub: Subscription) {
    setEditingId(sub.id);
    setEditName(sub.name);
    setEditAmount((sub.amount_cents / 100).toString());
  }

  async function handleSaveEdit(id: string) {
    const amountCents = Math.round(parseFloat(editAmount.replace(",", ".")) * 100);
    startTransition(async () => {
      await updateSubscription(id, { name: editName, amount_cents: amountCents });
      refresh();
    });
  }

  async function handleToggleStatus(sub: Subscription) {
    const newStatus = sub.status === "active" ? "paused" : "active";
    const msg = newStatus === "paused" 
      ? "Pausar irá remover os lançamentos futuros não pagos. Confirmar?" 
      : "Reativar a assinatura (ela não vai gerar os retroativos, você precisará ajustar manualmente se necessário)?";
      
    if (!confirm(msg)) return;

    startTransition(async () => {
      await updateSubscription(sub.id, { status: newStatus });
      refresh();
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir a assinatura "${name}"? Os lançamentos passados serão mantidos, mas os do futuro serão apagados.`)) return;
    startTransition(async () => {
      await deleteSubscription(id);
      refresh();
    });
  }

  const activeCount = subscriptions.filter(s => s.status === "active").length;
  const totalMonthlyExpense = subscriptions
    .filter(s => s.status === "active" && s.type === "expense")
    .reduce((acc, s) => acc + s.amount_cents, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: "800", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Repeat size={28} /> Assinaturas
          </h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>
            Gerencie seus gastos fixos mensais, como aluguel, streaming e salários.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Custo Fixo Ativo</div>
          <div style={{ fontSize: "var(--text-2xl)", fontWeight: "700", color: "var(--color-expense)" }}>
            {formatCurrency(totalMonthlyExpense)}
          </div>
        </div>
      </header>

      {/* Formulário de Criação */}
      <div className="glass" style={{ padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "600", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Plus size={18} /> Nova Assinatura
        </h3>
        
        <div className="form-grid-responsive">
          <div>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>Nome</label>
            <input className="input" placeholder="Ex: Aluguel" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={isPending} />
          </div>
          <div>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>Valor (R$)</label>
            <input className="input" placeholder="0.00" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} disabled={isPending} type="number" step="0.01" />
          </div>
          <div>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>Categoria</label>
            <select className="input" value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} disabled={isPending} style={{ background: "var(--color-bg-secondary)" }}>
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>Tipo</label>
            <select className="input" value={newType} onChange={(e) => setNewType(e.target.value as any)} disabled={isPending} style={{ background: "var(--color-bg-secondary)" }}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>
          <div>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>Início</label>
            <input className="input" type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} disabled={isPending} />
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={isPending || !newName || !newAmount || !newCategoryId}>
            Adicionar
          </button>
        </div>
      </div>

      {/* Lista de Assinaturas */}
      <div className="glass" style={{ overflow: "hidden" }}>
        <div style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--color-border-subtle)" }}>
          <h3 style={{ fontSize: "var(--text-sm)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)" }}>
            Ativas e Pausadas ({subscriptions.length})
          </h3>
        </div>
        
        {/* Tabela — Desktop */}
        <div className="tx-table">
          <div className="table-responsive">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--color-text-secondary)", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "var(--space-4) var(--space-6)" }}>Status</th>
                  <th style={{ padding: "var(--space-4) var(--space-6)" }}>Nome</th>
                  <th style={{ padding: "var(--space-4) var(--space-6)" }}>Categoria</th>
                  <th style={{ padding: "var(--space-4) var(--space-6)" }}>Data Base</th>
                  <th style={{ padding: "var(--space-4) var(--space-6)", textAlign: "right" }}>Valor</th>
                  <th style={{ padding: "var(--space-4) var(--space-6)", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "var(--space-10)", textAlign: "center", color: "var(--color-text-tertiary)" }}>
                      Nenhuma assinatura cadastrada.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const isIncome = sub.type === "income";
                    const isEditing = editingId === sub.id;
                    const isPaused = sub.status === "paused";

                    if (isEditing) {
                      return (
                        <tr key={sub.id} style={{ background: "rgba(99, 102, 241, 0.05)", borderTop: "1px solid var(--color-border-subtle)" }}>
                          <td colSpan={6} style={{ padding: "var(--space-3) var(--space-6)" }}>
                            <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                              <input className="input" value={editName} onChange={e => setEditName(e.target.value)} style={{ flex: 1 }} />
                              <input className="input" type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} style={{ width: "120px" }} />
                              <button onClick={() => handleSaveEdit(sub.id)} className="btn btn-ghost" style={{ color: "var(--color-income)" }}><Check size={16} /></button>
                              <button onClick={() => setEditingId(null)} className="btn btn-ghost"><X size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={sub.id} className="hover-row" style={{ borderTop: "1px solid var(--color-border-subtle)", opacity: isPaused ? 0.5 : 1 }}>
                        <td style={{ padding: "var(--space-4) var(--space-6)" }}>
                          <button 
                            onClick={() => handleToggleStatus(sub)} 
                            className={`badge badge-${isPaused ? 'neutral' : (isIncome ? 'income' : 'expense')}`}
                            style={{ cursor: "pointer" }}
                            disabled={isPending}
                            title={isPaused ? "Reativar" : "Pausar"}
                          >
                            {isPaused ? <Play size={12} /> : <Pause size={12} />}
                            {isPaused ? "Pausada" : "Ativa"}
                          </button>
                        </td>
                        <td style={{ padding: "var(--space-4) var(--space-6)", fontWeight: "500" }}>
                          {sub.name}
                        </td>
                        <td style={{ padding: "var(--space-4) var(--space-6)" }}>
                          <span className={`badge badge-neutral`} style={{ borderLeft: `2px solid ${getCategoryColor(sub.category?.name || '')}` }}>
                            {sub.category?.name}
                          </span>
                        </td>
                        <td style={{ padding: "var(--space-4) var(--space-6)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          Dia {new Date(sub.start_date + "T12:00:00").getDate()}
                        </td>
                        <td style={{ padding: "var(--space-4) var(--space-6)", textAlign: "right", fontWeight: "600", color: isIncome ? "var(--color-income)" : "var(--color-expense)" }}>
                          {isIncome ? "+" : "-"}{formatCurrency(sub.amount_cents)}
                        </td>
                        <td style={{ padding: "var(--space-4) var(--space-6)", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "var(--space-1)", justifyContent: "flex-end" }}>
                            <button onClick={() => startEditing(sub)} className="btn btn-ghost" style={{ padding: "var(--space-2)" }} disabled={isPending}>
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(sub.id, sub.name)} className="btn btn-ghost" style={{ padding: "var(--space-2)", color: "var(--color-expense)" }} disabled={isPending}>
                              <Trash2 size={14} />
                            </button>
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

        {/* Cards de Assinaturas — Mobile */}
        <div className="tx-card-list">
          {subscriptions.length === 0 ? (
            <div style={{ padding: "var(--space-10)", textAlign: "center", color: "var(--color-text-tertiary)" }}>
              Nenhuma assinatura cadastrada.
            </div>
          ) : (
            subscriptions.map((sub) => {
              const isIncome = sub.type === "income";
              const isEditing = editingId === sub.id;
              const isPaused = sub.status === "paused";

              if (isEditing) {
                return (
                  <div key={sub.id} className="tx-card" style={{ background: "rgba(99, 102, 241, 0.05)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                      <input className="input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome" />
                      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                        <input className="input" type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} placeholder="Valor" style={{ flex: 1 }} />
                        <button onClick={() => handleSaveEdit(sub.id)} className="btn btn-ghost" style={{ color: "var(--color-income)", padding: "var(--space-2)" }}><Check size={18} /></button>
                        <button onClick={() => setEditingId(null)} className="btn btn-ghost" style={{ padding: "var(--space-2)" }}><X size={18} /></button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={sub.id} className="tx-card" style={{ opacity: isPaused ? 0.5 : 1 }}>
                  <div className="tx-card-top">
                    <div className="tx-card-desc">
                      <span>{sub.name}</span>
                    </div>
                    <div className="tx-card-amount" style={{ color: isIncome ? "var(--color-income)" : "var(--color-expense)" }}>
                      {isIncome ? "+" : "-"}{formatCurrency(sub.amount_cents)}
                    </div>
                  </div>
                  <div className="tx-card-meta">
                    <button 
                      onClick={() => handleToggleStatus(sub)} 
                      className={`badge badge-${isPaused ? 'neutral' : (isIncome ? 'income' : 'expense')}`}
                      style={{ cursor: "pointer" }}
                      disabled={isPending}
                    >
                      {isPaused ? <Play size={10} /> : <Pause size={10} />}
                      {isPaused ? "Pausada" : "Ativa"}
                    </button>
                    <span className="badge badge-neutral" style={{ borderLeft: `2px solid ${getCategoryColor(sub.category?.name || '')}` }}>
                      {sub.category?.name}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <CalendarDays size={12} />
                      Dia {new Date(sub.start_date + "T12:00:00").getDate()}
                    </span>
                    <div className="tx-card-actions">
                      <button onClick={() => startEditing(sub)} className="btn btn-ghost" style={{ padding: "var(--space-2)" }} disabled={isPending}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(sub.id, sub.name)} className="btn btn-ghost" style={{ padding: "var(--space-2)", color: "var(--color-expense)" }} disabled={isPending}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
