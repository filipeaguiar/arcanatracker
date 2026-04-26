import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        background: `
          radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 40%),
          var(--color-bg-primary)
        `,
        padding: "var(--space-8)",
        position: "relative",
      }}
    >
      {/* Teste Frosted Glass — Movido para o final do main para garantir que fique por cima */}
      <div 
        className="glass-blur" 
        style={{ 
          position: "fixed", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)", 
          zIndex: 10000, 
          padding: "var(--space-10)", 
          borderRadius: "var(--radius-2xl)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.15)",
          width: "320px",
          color: "white"
        }}
      >
        <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: "800", marginBottom: "var(--space-2)" }}>Glass Test</h2>
        <p style={{ opacity: 0.9 }}>Este elemento DEVE borrar os gradientes coloridos atrás dele.</p>
      </div>
      <div className="animate-scale-in" style={{ maxWidth: "800px" }}>
        <div
          className="hero-title"
          style={{
            fontSize: "var(--text-6xl)",
            fontWeight: "900",
            marginBottom: "var(--space-4)",
            background: "var(--gradient-brand)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.06em",
          }}
        >
          Tracker
        </div>
        <h2 className="hero-subtitle" style={{ fontSize: "var(--text-2xl)", fontWeight: "600", marginBottom: "var(--space-8)", color: "var(--color-text-secondary)" }}>
          O controle financeiro que não atrapalha sua vida.
        </h2>
        
        <p className="hero-description" style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-12)", lineHeight: "1.6", color: "var(--color-text-tertiary)" }}>
          Lançamentos em segundos via linguagem natural. <br/>
          Inteligente, rápido e totalmente focado em baixa fricção.
        </p>

        <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center" }}>
          {user ? (
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: "var(--space-4) var(--space-8)" }}>
              Ir para o Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-primary" style={{ padding: "var(--space-4) var(--space-8)" }}>
                Começar Agora
              </Link>
              <Link href="/login" className="btn btn-ghost" style={{ padding: "var(--space-4) var(--space-8)" }}>
                Entrar
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features-grid" style={{ marginTop: "var(--space-20)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-12)", width: "100%", maxWidth: "1000px" }}>
        {[
          { title: "Ultra Rápido", desc: "Digite '50 cafe' e pronto. O Tracker faz o resto." },
          { title: "Parcelamentos", desc: "Lide com faturas brasileiras e parcelas de forma nativa." },
          { title: "Multimodal", desc: "Voz, texto ou formulários avançados. Você escolhe." }
        ].map(feature => (
          <div key={feature.title} className="glass card" style={{ padding: "var(--space-6)" }}>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "700", marginBottom: "var(--space-2)" }}>{feature.title}</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)" }}>{feature.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
