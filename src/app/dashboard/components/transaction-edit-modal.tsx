"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Tag as TagIcon, LayoutGrid, CreditCard, CircleDollarSign, Save, Trash2 } from "lucide-react";
import { updateTransaction, deleteTransaction, type Transaction } from "@/lib/actions/transactions";
import type { Category } from "@/lib/actions/categories";
import type { Tag as TagType } from "@/lib/actions/tags";
import type { CreditCard as CreditCardType } from "@/lib/actions/credit-cards";

interface TransactionEditModalProps {
  transaction: Transaction;
  categories: Category[];
  tags: TagType[];
  cards: CreditCardType[];
  onClose: () => void;
}

export function TransactionEditModal({
  transaction,
  categories,
  tags,
  cards,
  onClose,
}: TransactionEditModalProps) {
  console.log("TransactionEditModal montado para:", transaction.id);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState((Math.abs(transaction.amount_cents) / 100).toString());
  const [date, setDate] = useState(transaction.transaction_date);
  const [categoryId, setCategoryId] = useState(transaction.category_id);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(transaction.tags?.map(t => t.id) || []);
  const [creditCardId, setCreditCardId] = useState<string | null>(transaction.credit_card_id);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const amountCents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
      
      await updateTransaction({
        id: transaction.id,
        description,
        amount_cents: Math.abs(amountCents),
        transaction_date: date,
        category_id: categoryId,
        tag_ids: selectedTagIds,
        credit_card_id: creditCardId,
      });
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
      alert("Falha ao salvar alterações.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    setLoading(true);
    try {
      await deleteTransaction(transaction.id);
      onClose();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Falha ao excluir.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      onClick={onClose} 
      style={{ 
        zIndex: 9999, 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{ 
          padding: "var(--space-6)", 
          maxHeight: "90vh", 
          width: "100%",
          maxWidth: "500px",
          overflowY: "auto",
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)'
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "700" }}>Editar Lançamento</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "var(--space-2)" }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Valor e Data */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div className="form-group">
              <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", fontWeight: "600" }}>Valor</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)" }}>R$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  style={{ paddingLeft: "32px" }}
                />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", fontWeight: "600" }}>Data</label>
              <div style={{ position: "relative" }}>
                <Calendar size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
                <input 
                  type="date" 
                  className="input" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  style={{ paddingLeft: "36px" }}
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="form-group">
            <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", fontWeight: "600" }}>Descrição</label>
            <input 
              type="text" 
              className="input" 
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              placeholder="Ex: Mercado"
            />
          </div>

          {/* Categoria */}
          <div className="form-group">
            <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", fontWeight: "600" }}>Categoria</label>
            <div style={{ position: "relative" }}>
              <LayoutGrid size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
              <select 
                className="input" 
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                style={{ paddingLeft: "36px", appearance: "none" }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type === 'income' ? 'Receita' : 'Despesa'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pagamento */}
          <div className="form-group">
            <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", fontWeight: "600" }}>Forma de Pagamento</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <button
                type="button"
                className={`btn ${creditCardId === null ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCreditCardId(null)}
                style={{ flex: 1, minWidth: "120px" }}
              >
                <CircleDollarSign size={16} />
                Débito/Dinheiro
              </button>
              {cards.map(card => (
                <button
                  key={card.id}
                  type="button"
                  className={`btn ${creditCardId === card.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCreditCardId(card.id)}
                  style={{ flex: 1, minWidth: "120px" }}
                >
                  <CreditCard size={16} />
                  {card.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", fontWeight: "600" }}>Tags</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {tags.map(tag => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`badge ${isSelected ? 'badge-income' : 'badge-neutral'}`}
                    style={{ cursor: "pointer", padding: "6px 12px" }}
                  >
                    <TagIcon size={12} />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ações */}
          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
            <button 
              type="button" 
              onClick={handleDelete}
              className="btn btn-danger" 
              style={{ flex: 1 }}
              disabled={loading}
            >
              <Trash2 size={18} />
              Excluir
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 2 }}
              disabled={loading}
            >
              <Save size={18} />
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
