"use client";

import { useState } from "react";
import { createCreditCard } from "@/lib/actions/credit-cards";

export default function CardForm({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await createCreditCard({
        name: formData.get("name") as string,
        closing_day: parseInt(formData.get("closing_day") as string),
        due_day: parseInt(formData.get("due_day") as string),
        is_default: formData.get("is_default") === "on",
      });
      onCreated();
      (document.getElementById("add-card-form") as HTMLFormElement)?.reset();
    } catch (error) {
      console.error(error);
      alert("Erro ao criar cartão.");
    }
    setLoading(false);
  }

  return (
    <div className="glass" style={{ padding: "var(--space-6)" }}>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "600", marginBottom: "var(--space-4)" }}>
        Novo Cartão
      </h3>
      <form id="add-card-form" action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div>
          <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>Nome do Cartão</label>
          <input name="name" className="input" placeholder="Ex: Nubank, Inter..." required disabled={loading} />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <div>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>Dia de Fechamento</label>
            <input name="closing_day" type="number" min="1" max="31" className="input" placeholder="10" required disabled={loading} />
          </div>
          <div>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>Dia de Vencimento</label>
            <input name="due_day" type="number" min="1" max="31" className="input" placeholder="17" required disabled={loading} />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "var(--text-sm)" }}>
          <input name="is_default" type="checkbox" disabled={loading} />
          Definir como cartão padrão para lançamentos rápidos
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "var(--space-2)" }}>
          {loading ? "Salvando..." : "Adicionar Cartão"}
        </button>
      </form>
    </div>
  );
}
