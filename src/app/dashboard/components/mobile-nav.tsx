"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, FileText, Repeat, Menu, Settings, LogOut, User, X, Moon, Sun, PieChart } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { useTheme } from "next-themes";

export function MobileNav({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Força o scroll para o topo sempre que a rota mudar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <nav className="mobile-bottom-nav glass-blur">
        <Link href="/dashboard" title="Início" className={pathname === "/dashboard" ? "active" : ""}>
          <Home size={24} />
        </Link>
        <Link href="/dashboard/cards" title="Cartões" className={pathname?.startsWith("/dashboard/cards") ? "active" : ""}>
          <CreditCard size={24} />
        </Link>
        <Link href="/dashboard/invoices" title="Faturas" className={pathname?.startsWith("/dashboard/invoices") ? "active" : ""}>
          <FileText size={24} />
        </Link>
        <Link href="/dashboard/subscriptions" title="Assinaturas" className={pathname?.startsWith("/dashboard/subscriptions") ? "active" : ""}>
          <Repeat size={24} />
        </Link>
        <button onClick={() => setMenuOpen(true)} title="Mais" className={menuOpen ? "active" : ""} style={{ cursor: "pointer", background: "none", border: "none", color: "inherit", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Menu size={24} />
        </button>
      </nav>

      {/* Overlay Menu */}
      {menuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-content glass-blur animate-scale-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-6)", borderBottom: "1px solid var(--color-border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)", flexShrink: 0 }}>
                  <User size={16} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", lineHeight: 1 }}>
                    Conectado como
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--color-text-primary)" }}>
                    {userEmail || "Usuário"}
                  </div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="btn btn-ghost" style={{ padding: "var(--space-2)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {mounted && (
                <button 
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
                  className="btn btn-ghost" 
                  style={{ width: "100%", justifyContent: "flex-start", padding: "var(--space-4)", fontSize: "16px" }}
                >
                  {theme === "dark" ? (
                    <><Sun size={20} style={{ marginRight: "var(--space-3)" }} /> Modo Claro</>
                  ) : (
                    <><Moon size={20} style={{ marginRight: "var(--space-3)" }} /> Modo Escuro</>
                  )}
                </button>
              )}
              <Link href="/dashboard/reports" onClick={() => setMenuOpen(false)} className="btn btn-ghost" style={{ justifyContent: "flex-start", padding: "var(--space-4)", fontSize: "16px" }}>
                <PieChart size={20} style={{ marginRight: "var(--space-3)" }} />
                Relatórios
              </Link>
              <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} className="btn btn-ghost" style={{ justifyContent: "flex-start", padding: "var(--space-4)", fontSize: "16px" }}>
                <Settings size={20} style={{ marginRight: "var(--space-3)" }} />
                Configurações
              </Link>
              <form action={logout}>
                <button type="submit" className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start", padding: "var(--space-4)", fontSize: "16px", color: "var(--color-expense)" }}>
                  <LogOut size={20} style={{ marginRight: "var(--space-3)" }} />
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
