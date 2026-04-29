"use client";

import { useState } from "react";
import { createTransactionStructured } from "@/lib/actions/transactions";
import type { Category } from "@/lib/actions/categories";
import type { CreditCard } from "@/lib/actions/credit-cards";
import { Send, Tag as TagIcon, LayoutGrid, FileText, CreditCard as CardIcon, Calendar, Hash, X } from "lucide-react";

interface DesktopTransactionFormProps {
  categories: Category[];
  cards: CreditCard[];
}

export function DesktopTransactionForm({ categories, cards }: DesktopTransactionFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [creditCardId, setCreditCardId] = useState("");
  const [installments, setInstallments] = useState(1);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "income" | "expense" | "neutral" } | null>(null);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !selectedTagNames.includes(newTag)) {
        setSelectedTagNames([...selectedTagNames, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTagNames(selectedTagNames.filter(t => t !== tagToRemove));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || loading) return;

    setLoading(true);
    setFeedback(null);

    // Convert amount to cents
    const cleanAmount = amount.replace(',', '.');
    const amountCents = Math.round(parseFloat(cleanAmount) * 100);

    if (isNaN(amountCents) || amountCents <= 0) {
      setFeedback({ message: "Valor inválido", type: "expense" });
      setLoading(false);
      return;
    }

    // Determine category ID vs Name
    let catId = categoryId;
    let catName = undefined;
    if (categoryId.startsWith("new:")) {
      catId = "";
      catName = categoryName;
    }

    const result = await createTransactionStructured({
      amount_cents: amountCents,
      description,
      category_id: catId,
      category_name: catName,
      tag_names: selectedTagNames,
      credit_card_id: creditCardId || null,
      installment_total: installments,
      transaction_date: transactionDate,
    });

    if (result.success) {
      setFeedback({
        message: `Sucesso! Transação criada.`,
        type: "income",
      });
      // Reset form partially
      setAmount("");
      setDescription("");
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({
        message: result.error || "Erro ao criar transação",
        type: "expense",
      });
    }

    setLoading(false);
  }

  return (
    <div className="glass desktop-only" style={{ padding: "var(--space-8)", marginBottom: "var(--space-10)", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute",
        top: "-50%",
        left: "-20%",
        width: "60%",
        height: "200%",
        background: "var(--gradient-glow)",
        filter: "blur(60px)",
        opacity: 0.1,
        pointerEvents: "none",
        zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "600", marginBottom: "var(--space-6)" }}>
          Nova Transação
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          
          {/* Row 1: Amount and Description */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--space-4)" }}>
            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>Valor</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }}>R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ paddingLeft: "var(--space-10)", fontSize: "var(--text-lg)", fontWeight: "600" }}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>Descrição</label>
              <div style={{ position: "relative" }}>
                <FileText size={16} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
                <input
                  type="text"
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Almoço restaurante"
                  style={{ paddingLeft: "var(--space-10)" }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Category and Tags */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--space-4)" }}>
            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>Categoria</label>
              <div style={{ position: "relative" }}>
                <LayoutGrid size={16} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
                {categoryId.startsWith("new:") ? (
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Nome da categoria" 
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    style={{ paddingLeft: "var(--space-10)" }}
                    autoFocus
                  />
                ) : (
                  <select
                    required
                    className="input"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    style={{ paddingLeft: "var(--space-10)", appearance: "none" }}
                    disabled={loading}
                  >
                    <option value="" disabled>Selecione...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type === 'income' ? '+' : '-'})</option>)}
                    <option value="new:true">+ Criar nova</option>
                  </select>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>Tags (Pressione Enter)</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-1) var(--space-2)" }}>
                <TagIcon size={16} style={{ color: "var(--color-text-tertiary)", marginLeft: "var(--space-1)" }} />
                
                {selectedTagNames.map(tag => (
                  <span key={tag} className="badge badge-neutral" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px" }}>
                    #{tag}
                    <X size={12} style={{ cursor: "pointer" }} onClick={() => removeTag(tag)} />
                  </span>
                ))}

                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={selectedTagNames.length === 0 ? "Adicionar tags..." : ""}
                  style={{ border: "none", background: "transparent", outline: "none", color: "var(--color-text-primary)", flex: 1, minWidth: "120px", fontSize: "var(--text-sm)", padding: "var(--space-1)" }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Card, Installments, Date */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "var(--space-4)" }}>
            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>Cartão de Crédito</label>
              <div style={{ position: "relative" }}>
                <CardIcon size={16} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
                <select
                  className="input"
                  value={creditCardId}
                  onChange={(e) => setCreditCardId(e.target.value)}
                  style={{ paddingLeft: "var(--space-10)", appearance: "none" }}
                  disabled={loading}
                >
                  <option value="">Nenhum (Débito/Dinheiro)</option>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>Parcelas</label>
              <div style={{ position: "relative" }}>
                <Hash size={16} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="input"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                  style={{ paddingLeft: "var(--space-10)" }}
                  disabled={loading || !creditCardId}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>Data</label>
              <div style={{ position: "relative" }}>
                <Calendar size={16} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
                <input
                  type="date"
                  required
                  className="input"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  style={{ paddingLeft: "var(--space-10)" }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ marginTop: "var(--space-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              {feedback && (
                <div className={`badge badge-${feedback.type} animate-scale-in`} style={{ fontWeight: "600", padding: "6px 12px", fontSize: "var(--text-sm)" }}>
                  {feedback.message}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !amount || !categoryId}
              style={{ padding: "var(--space-3) var(--space-8)" }}
            >
              {loading ? "Salvando..." : <><Send size={16} /> Salvar Lançamento</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
