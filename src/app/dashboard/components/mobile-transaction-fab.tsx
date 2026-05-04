"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Mic, Send, X, Hash, LayoutGrid, CreditCard, Check, CircleDollarSign } from "lucide-react";
import { createTransaction } from "@/lib/actions/transactions";
import type { Category } from "@/lib/actions/categories";
import type { Tag } from "@/lib/actions/tags";
import type { CreditCard as CreditCardType } from "@/lib/actions/credit-cards";

interface MobileTransactionFabProps {
  categories: Category[];
  tags: Tag[];
  cards: CreditCardType[];
}

export function MobileTransactionFab({ categories, tags, cards }: MobileTransactionFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "income" | "expense" | "neutral" } | null>(null);
  
  // Credit card state
  const defaultCardId = cards.find(c => c.is_default)?.id || cards[0]?.id || "";
  const [useCard, setUseCard] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string>(defaultCardId);
  const [showCardMenu, setShowCardMenu] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const closeSheet = () => {
    setIsOpen(false);
    setFeedback(null);
    setShowCardMenu(false);
  };

  const openSheet = () => {
    setIsOpen(true);
  };

  const handleCardIconClick = () => {
    if (cards.length === 0) return;

    // Opções: [null (Débito), ...cartões]
    const options = [null, ...cards];
    const currentIndex = useCard 
      ? options.findIndex(c => c?.id === selectedCardId) 
      : 0;
    
    const nextIndex = (currentIndex + 1) % options.length;
    const nextOption = options[nextIndex];

    if (nextOption === null) {
      setUseCard(false);
    } else {
      setUseCard(true);
      setSelectedCardId(nextOption.id);
    }
    
    // Feedback tátil simples (se disponível)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };



  const handleAppend = (text: string) => {
    setInput(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${text} ` : `${text} `;
    });
    inputRef.current?.focus();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setFeedback(null);

    const result = await createTransaction(input, undefined, {
      useCreditCard: useCard,
      creditCardId: useCard ? selectedCardId : null,
    });

    if (result.success) {
      setFeedback({
        message: `Sucesso!`,
        type: "income",
      });
      setInput("");
      setTimeout(() => {
        closeSheet();
      }, 1500);
    } else {
      setFeedback({
        message: result.error || "Erro ao criar transação",
        type: "expense",
      });
    }

    setLoading(false);
  }

  return (
    <div className="mobile-only">
      {/* FAB Button */}
      <button
        onClick={openSheet}
        className="btn btn-primary"
        style={{
          position: "fixed",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
          right: "var(--space-4)",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          padding: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "var(--shadow-lg)",
          zIndex: 40, // Below mobile nav (50) overlay but above content
          transform: isOpen ? "scale(0)" : "scale(1)",
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        }}
      >
        <Plus size={24} />
      </button>

      {/* Overlay & Bottom Sheet */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            onClick={closeSheet}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
              animation: "fadeIn 0.2s ease forwards"
            }}
          />

          {/* Modal */}
          <div 
            className="glass-blur"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100% - var(--space-8))",
              maxWidth: "400px",
              zIndex: 101,
              borderRadius: "var(--radius-xl)",
              padding: "var(--space-6)",
              animation: "popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "600" }}>Nova Transação</h3>
              <button onClick={closeSheet} className="btn btn-ghost" style={{ padding: "var(--space-2)" }}>
                <X size={20} />
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: "var(--space-2)", position: "relative" }}>
              {cards.length > 0 && (
                <button
                  type="button"
                  onClick={handleCardIconClick}
                  className={`btn ${useCard ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    padding: "var(--space-3)",
                    border: useCard ? "1px solid var(--color-brand-primary)" : "1px solid var(--color-border)",
                    background: useCard ? "rgba(var(--color-brand-primary-rgb), 0.1)" : "var(--color-bg-secondary)",
                    color: useCard ? "var(--color-brand-primary)" : "var(--color-text-secondary)",
                    borderRadius: "var(--radius-lg)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "48px"
                  }}
                  title={useCard ? "Pagando com Cartão" : "Pagando no Débito"}
                >
                  {useCard ? <CreditCard size={20} /> : <CircleDollarSign size={20} />}
                </button>
              )}

              <input
                ref={inputRef}
                type="text"
                className="input"
                placeholder="Ex: 50.00 uber #transporte"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ flex: 1, fontSize: "16px", padding: "var(--space-4)", borderRadius: "var(--radius-lg)" }} // 16px prevents iOS zoom
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !input.trim()}
                style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)" }}
              >
                <Send size={20} />
              </button>
            </form>

            {/* Selected Card Indicator Pill */}
            {useCard && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "-var(--space-2)", animation: "fadeIn 0.2s ease" }}>
                <div className="badge badge-primary" style={{ 
                  fontSize: "var(--text-xs)", 
                  padding: "4px 10px", 
                  borderRadius: "100px",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                  background: "var(--color-brand-primary)",
                  color: "white",
                  fontWeight: "600",
                  boxShadow: "var(--shadow-sm)"
                }}>
                  <CreditCard size={12} />
                  {cards.find(c => c.id === selectedCardId)?.name || "Cartão"}
                </div>
              </div>
            )}

            {/* Prominent Audio Button */}
            <button 
              type="button"
              className="btn"
              onClick={() => {
                alert("Gravação de áudio em breve!");
              }}
              style={{
                width: "100%",
                padding: "var(--space-4)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "var(--space-3)",
                background: "var(--color-bg-secondary)",
                border: "2px dashed var(--color-border)",
                color: "var(--color-text-primary)",
                fontSize: "var(--text-md)",
                fontWeight: "600",
                borderRadius: "var(--radius-lg)",
                transition: "all 0.2s"
              }}
            >
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "50%", 
                background: "var(--gradient-brand)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "white"
              }}>
                <Mic size={20} />
              </div>
              Gravar Áudio
            </button>



            {/* Feedback Message */}
            {feedback && (
              <div className={`badge badge-${feedback.type} animate-scale-in`} style={{ textAlign: "center", padding: "var(--space-2)" }}>
                {feedback.message}
              </div>
            )}

            {/* Chips Container (Scrollable) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginTop: "var(--space-2)", overflowY: "auto" }}>
              
              {/* Categories */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>
                  <LayoutGrid size={14} /> Categorias
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto", paddingBottom: "var(--space-2)", WebkitOverflowScrolling: "touch" }}>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleAppend(cat.name)}
                      className="badge badge-neutral"
                      style={{ padding: "8px 12px", whiteSpace: "nowrap", cursor: "pointer", border: "1px solid var(--color-border-subtle)", background: "var(--color-bg-primary)" }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>
                  <Hash size={14} /> Tags
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto", paddingBottom: "var(--space-2)", WebkitOverflowScrolling: "touch" }}>
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleAppend(`#${tag.name}`)}
                      className="badge badge-neutral"
                      style={{ padding: "8px 12px", whiteSpace: "nowrap", cursor: "pointer", border: "1px solid var(--color-border-subtle)", background: "var(--color-bg-primary)" }}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </>
      )}

      {/* Global animations for the modal */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes popIn {
          from { opacity: 0; transform: translate(-50%, -40%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
