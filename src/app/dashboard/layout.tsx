import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import { Home, CreditCard, FileText, Repeat, Settings, LogOut, User, PieChart } from "lucide-react";
import { MobileNav } from "./components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export const unstable_instant = false;

// Componente para exibir info do usuário (dinâmico)
async function UserInfo() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)", flexShrink: 0 }}>
        <User size={16} />
      </div>
      <div className="desktop-only" style={{ textAlign: "left" }}>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", lineHeight: 1 }}>
          Conectado como
        </div>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--color-text-primary)" }}>
          {user?.email?.split("@")[0] || "Usuário"}
        </div>
      </div>
    </div>
  );
}

// Fallback para o UserInfo
function UserInfoFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", opacity: 0.5 }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-bg-secondary)" }} />
      <div className="desktop-only">
        <div style={{ width: "60px", height: "8px", background: "var(--color-bg-secondary)", borderRadius: "4px", marginBottom: "4px" }} />
        <div style={{ width: "40px", height: "10px", background: "var(--color-bg-secondary)", borderRadius: "4px" }} />
      </div>
    </div>
  );
}

// Wrapper para o MobileNav (dinâmico)
async function MobileNavWithUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <MobileNav userEmail={user?.email} />;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column" }}>
      <header
        className="glass-blur desktop-header-nav"
        style={{
          padding: "var(--space-3) var(--space-6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "var(--shadow-lg)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-8)", minWidth: 0 }}>
          <div
            className="desktop-only"
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: "800",
              background: "var(--gradient-brand)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.05em",
              marginRight: "var(--space-2)",
            }}
          >
            Tracker
          </div>

          <nav className="header-nav" style={{ display: "flex", gap: "var(--space-2)" }}>
            <Link href="/dashboard" className="btn btn-ghost" style={{ fontSize: "var(--text-sm)", display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <Home size={16} /> <span className="desktop-only-inline">Início</span>
            </Link>
            <Link href="/dashboard/cards" className="btn btn-ghost" style={{ fontSize: "var(--text-sm)", display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <CreditCard size={16} /> <span className="desktop-only-inline">Cartões</span>
            </Link>
            <Link href="/dashboard/invoices" className="btn btn-ghost" style={{ fontSize: "var(--text-sm)", display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <FileText size={16} /> <span className="desktop-only-inline">Faturas</span>
            </Link>
            <Link href="/dashboard/subscriptions" className="btn btn-ghost" style={{ fontSize: "var(--text-sm)", display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <Repeat size={16} /> <span className="desktop-only-inline">Assinaturas</span>
            </Link>
            <Link href="/dashboard/reports" className="btn btn-ghost" style={{ fontSize: "var(--text-sm)", display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <PieChart size={16} /> <span className="desktop-only-inline">Relatórios</span>
            </Link>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <Suspense fallback={<UserInfoFallback />}>
            <UserInfo />
          </Suspense>
          
          <div style={{ width: "1px", height: "24px", background: "var(--color-border-subtle)" }}></div>
          
          <div style={{ display: "flex", gap: "var(--space-1)" }}>
            <ThemeToggle />
            <Link href="/dashboard/settings" className="btn btn-ghost" style={{ padding: "var(--space-2)", color: "var(--color-text-secondary)" }} title="Configurações">
              <Settings size={18} />
            </Link>
            <form action={logout}>
              <button className="btn btn-ghost" style={{ padding: "var(--space-2)", color: "var(--color-text-secondary)" }} title="Sair">
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="dashboard-main" style={{ flex: 1, padding: "var(--space-8)", paddingTop: "calc(var(--space-20) + var(--space-8))" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <Suspense fallback={<div style={{ height: "64px" }} />}>
        <MobileNavWithUser />
      </Suspense>
    </div>
  );
}
