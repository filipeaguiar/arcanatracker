"use client";

import { useState, useRef } from "react";
import { createTransaction } from "@/lib/actions/transactions";
import { Send, Zap } from "lucide-react";

export default function QuickInput() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "income" | "expense" | "neutral" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setFeedback(null);

    const result = await createTransaction(input);

    if (result.success) {
      setFeedback({
        message: `Sucesso! ${result.data?.created} transação(ões) criada(s).`,
        type: "income",
      });
      setInput("");
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({
        message: result.error || "Erro ao processar entrada.",
        type: "expense",
      });
    }

    setLoading(false);
  }

  return (
    <div className="glass" style={{ padding: "var(--space-8)", marginBottom: "var(--space-10)", position: "relative", overflow: "hidden" }}>
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
        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "600", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Zap size={20} color="var(--color-brand-400)" /> Entrada Rápida
        </h2>
        <form onSubmit={handleSubmit} style={{ position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: 50 mercado compras ou 10*190 tenis compras"
            style={{
              padding: "var(--space-5) var(--space-6)",
              fontSize: "var(--text-lg)",
              borderRadius: "var(--radius-lg)",
              border: loading ? "1px solid var(--color-brand-primary)" : undefined,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
            style={{
              position: "absolute",
              right: "8px",
              top: "8px",
              bottom: "8px",
              borderRadius: "calc(var(--radius-lg) - 4px)",
              padding: "0 var(--space-6)",
            }}
          >
            {loading ? "Processando..." : <><Send size={16} /> Lançar</>}
          </button>
        </form>

        <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Dica: use <code style={{ color: "var(--color-brand-primary)" }}>*</code> para parcelas fixas ou <code style={{ color: "var(--color-brand-primary)" }}>/</code> para dividir um valor.
          </div>
          
          {feedback && (
            <div className={`badge badge-${feedback.type} animate-scale-in`} style={{ fontWeight: "600" }}>
              {feedback.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
