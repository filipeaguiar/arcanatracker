"use client";

import { useState } from "react";
import { login, signup } from "@/lib/actions/auth";
import { Mail, Lock, ShieldCheck, ArrowRight, Activity, Wallet } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    setLoading(true);

    const result = isLogin ? await login(formData) : await signup(formData);

    if (result && 'error' in result) {
      setError(result.error as string);
    } else if (result && 'message' in result) {
      setMessage(result.message as string);
    }

    setLoading(false);
  }

  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
      }}
    >
      {/* Left Column: Branding / Image */}
      <div
        style={{
          flex: "1",
          display: "none",
          position: "relative",
          overflow: "hidden",
        }}
        className="login-hero-section"
      >
        <Image
          src="/login-bg.png"
          alt="Abstract 3D shapes"
          fill
          style={{ objectFit: "cover", zIndex: 0 }}
          priority
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(10,10,12,0.2) 0%, rgba(10,10,12,0.9) 100%)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            padding: "var(--space-12)",
            zIndex: 2,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            <div className="badge badge-neutral" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Activity size={14} style={{ marginRight: "var(--space-1)" }} />
              Rápido
            </div>
            <div className="badge badge-neutral" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Wallet size={14} style={{ marginRight: "var(--space-1)" }} />
              Inteligente
            </div>
          </div>
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: "800",
              lineHeight: "1.1",
              marginBottom: "var(--space-4)",
              color: "white",
              letterSpacing: "-0.03em",
            }}
          >
            Domine suas finanças<br />
            com o <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Arcana Tracker</span>.
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              color: "rgba(255,255,255,0.7)",
              maxWidth: "480px",
              lineHeight: "1.6",
            }}
          >
            A plataforma mágica desenhada para velocidade, flexibilidade e baixo atrito cognitivo. Transforme a maneira como você lida com seu dinheiro.
          </p>
        </div>
      </div>

      {/* Right Column: Form */}
      <div
        style={{
          flex: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-6)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          className="animate-scale-in"
          style={{
            width: "100%",
            maxWidth: "420px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: "var(--space-8)", textAlign: "left" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-xl)",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                marginBottom: "var(--space-6)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
              }}
            >
              <ShieldCheck size={24} style={{ color: "var(--color-primary)" }} />
            </div>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "700",
                marginBottom: "var(--space-2)",
                color: "var(--color-text)",
                letterSpacing: "-0.03em",
              }}
            >
              {isLogin ? "Bem-vindo de volta" : "Criar nova conta"}
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "1rem" }}>
              {isLogin
                ? "Insira suas credenciais para acessar seu controle."
                : "Preencha os dados abaixo para iniciar sua jornada."}
            </p>
          </div>

          <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--color-text)", marginLeft: "var(--space-1)" }}>
                E-mail
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }}>
                  <Mail size={18} />
                </div>
                <input
                  name="email"
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  style={{ paddingLeft: "44px", height: "52px", fontSize: "1rem" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--color-text)", marginLeft: "var(--space-1)" }}>
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }}>
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  style={{ paddingLeft: "44px", height: "52px", fontSize: "1rem", letterSpacing: "2px" }}
                />
              </div>
            </div>

            {isLogin && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "-4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <input
                    type="checkbox"
                    name="remember"
                    id="remember"
                    defaultChecked
                    style={{ 
                      cursor: "pointer", 
                      width: "16px", 
                      height: "16px", 
                      accentColor: "var(--color-primary)",
                      borderRadius: "4px"
                    }}
                  />
                  <label htmlFor="remember" style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                    Lembrar de mim
                  </label>
                </div>
                <a href="#" style={{ fontSize: "0.875rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: "500" }}>
                  Esqueceu a senha?
                </a>
              </div>
            )}

            {error && (
              <div className="badge badge-expense" style={{ padding: "var(--space-3)", width: "100%", justifyContent: "center", fontSize: "0.875rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                {error}
              </div>
            )}

            {message && (
              <div className="badge badge-income" style={{ padding: "var(--space-3)", width: "100%", justifyContent: "center", fontSize: "0.875rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                {message}
              </div>
            )}

            <button 
              className="btn btn-primary" 
              type="submit" 
              disabled={loading} 
              style={{ 
                marginTop: "var(--space-2)", 
                height: "52px", 
                fontSize: "1rem", 
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-2)"
              }}
            >
              {loading ? "Processando..." : isLogin ? "Acessar Plataforma" : "Criar Minha Conta"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: "var(--space-8)", textAlign: "center", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-6)" }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
              {isLogin ? "Ainda não tem uma conta?" : "Já possui uma conta?"}{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsLogin(!isLogin);
                  setError(null);
                  setMessage(null);
                }}
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "var(--color-text)", 
                  fontWeight: "600", 
                  cursor: "pointer", 
                  padding: 0,
                  fontSize: "0.875rem",
                  textDecoration: "underline",
                  textUnderlineOffset: "4px"
                }}
              >
                {isLogin ? "Cadastre-se grátis" : "Faça login"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
