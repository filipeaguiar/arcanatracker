"use client";

import { useState } from "react";
import { login, signup } from "@/lib/actions/auth";

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
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--gradient-glow), var(--color-bg-primary)",
      }}
    >
      <div
        className="glass animate-scale-in"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "var(--space-10)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "var(--text-4xl)",
            fontWeight: "800",
            marginBottom: "var(--space-2)",
            background: "var(--gradient-brand)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.05em",
          }}
        >
          Tracker
        </div>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "var(--space-8)",
            fontSize: "var(--text-sm)",
          }}
        >
          {isLogin
            ? "Bem-vindo de volta ao seu controle financeiro."
            : "Crie sua conta para começar a economizar."}
        </p>

        <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ textAlign: "left" }}>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>
              E-mail
            </label>
            <input
              name="email"
              type="email"
              className="input"
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div style={{ textAlign: "left" }}>
            <label className="badge badge-neutral" style={{ marginBottom: "var(--space-2)" }}>
              Senha
            </label>
            <input
              name="password"
              type="password"
              className="input"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="badge badge-expense" style={{ padding: "var(--space-3)", width: "100%", justifyContent: "center" }}>
              {error}
            </div>
          )}

          {message && (
            <div className="badge badge-income" style={{ padding: "var(--space-3)", width: "100%", justifyContent: "center" }}>
              {message}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: "var(--space-4)" }}>
            {loading ? "Processando..." : isLogin ? "Entrar" : "Criar Conta"}
          </button>
        </form>

        <div style={{ marginTop: "var(--space-8)" }}>
          <button
            className="btn btn-ghost"
            onClick={() => setIsLogin(!isLogin)}
            style={{ fontSize: "var(--text-sm)" }}
          >
            {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre aqui"}
          </button>
        </div>
      </div>
    </main>
  );
}
