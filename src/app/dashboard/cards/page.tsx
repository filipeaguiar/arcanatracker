"use client";

import { useState } from "react";
import CardForm from "./components/card-form";
import CardList from "./components/card-list";

export default function CardsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <header>
        <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: "800", letterSpacing: "-0.03em" }}>
          Meus Cartões
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Gerencie seus cartões de crédito e configure as datas de fatura.
        </p>
      </header>

      <div className="cards-page-grid">
        <aside>
          <CardForm onCreated={() => setRefreshKey(prev => prev + 1)} />
        </aside>
        
        <section>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "600", marginBottom: "var(--space-4)" }}>
            Cartões Ativos
          </h2>
          <CardList refreshKey={refreshKey} />
        </section>
      </div>
    </div>
  );
}
