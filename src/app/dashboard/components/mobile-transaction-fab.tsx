"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Mic, Send, X, Hash, LayoutGrid } from "lucide-react";
import { createTransaction } from "@/lib/actions/transactions";
import type { Category } from "@/lib/actions/categories";
import type { Tag } from "@/lib/actions/tags";

interface MobileTransactionFabProps {
  categories: Category[];
  tags: Tag[];
}

export function MobileTransactionFab({ categories, tags }: MobileTransactionFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "income" | "expense" | "neutral" } | null>(null);
  
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
  };

  const openSheet = () => {
    setIsOpen(true);
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

    const result = await createTransaction(input);

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

          {/* Sheet */}
          <div 
            className="glass"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 101,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              padding: "var(--space-6)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + var(--space-6))",
              animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
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
                style={{ padding: "var(--space-4)" }}
              >
                <Send size={20} />
              </button>
            </form>

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

      {/* Global animations for the bottom sheet */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
