"use client";

import { useState, useEffect } from "react";
import { 
  getOrCreateTelegramLink, 
  approveTelegramConnection, 
  disconnectTelegram,
  type TelegramConnection 
} from "@/lib/actions/telegram";
import { createClient } from "@/lib/supabase/client";
import { Send, CheckCircle2, XCircle, Loader2, ExternalLink, ShieldCheck } from "lucide-react";

export function TelegramIntegration() {
  const [connection, setConnection] = useState<TelegramConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const supabase = createClient();

  // Busca conexão inicial e assina mudanças em tempo real
  useEffect(() => {
    async function loadConnection() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("telegram_connections")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      setConnection(data);
      setLoading(false);

      // Assina mudanças para detectar quando o usuário clica no Telegram
      const channel = supabase
        .channel('telegram_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'telegram_connections' },
          (payload) => {
            const newData = payload.new as TelegramConnection;
            const oldData = payload.old as TelegramConnection;
            
            if (newData && newData.user_id === user.id) {
              setConnection(newData);
            } else if (payload.eventType === 'DELETE' && oldData && oldData.user_id === user.id) {
              setConnection(null);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    loadConnection();
  }, [supabase]);

  async function handleConnect() {
    setActionLoading(true);
    try {
      const { url } = await getOrCreateTelegramLink();
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar link do Telegram.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!connection) return;
    setActionLoading(true);
    try {
      await approveTelegramConnection(connection.id);
    } catch (error) {
      console.error(error);
      alert("Erro ao aprovar conexão.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Deseja realmente desconectar o Telegram?")) return;
    setActionLoading(true);
    try {
      await disconnectTelegram();
      setConnection(null);
    } catch (error) {
      console.error(error);
      alert("Erro ao desconectar.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return null;

  return (
    <div className="glass" style={{ padding: "var(--space-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
        <div>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "600", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Send size={18} color="#0088cc" /> Integração Telegram
          </h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginTop: "4px" }}>
            Lance transações rapidamente enviando mensagens para o nosso bot.
          </p>
        </div>
        
        {connection?.status === 'linked' && (
          <span className="badge badge-income" style={{ gap: "4px" }}>
            <CheckCircle2 size={12} /> Conectado
          </span>
        )}
      </div>

      {/* ESTADO 1: Sem conexão */}
      {!connection && (
        <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
          <button className="btn btn-primary" onClick={handleConnect} disabled={actionLoading}>
            {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            Conectar Bot do Telegram
          </button>
        </div>
      )}

      {/* ESTADO 2: Aguardando clique no Telegram */}
      {connection?.status === 'awaiting_telegram' && (
        <div style={{ 
          background: "var(--color-bg-tertiary)", 
          padding: "var(--space-4)", 
          borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--color-border)"
        }}>
          <p style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>
            <strong>Passo 1:</strong> Clique no botão abaixo para abrir o bot e clique em <strong>"Iniciar"</strong>.
          </p>
          <button className="btn btn-secondary" onClick={handleConnect} style={{ width: "100%", gap: "var(--space-2)" }}>
            <ExternalLink size={16} /> Abrir Telegram
          </button>
        </div>
      )}

      {/* ESTADO 3: Aguardando aprovação (Handshake) */}
      {connection?.status === 'awaiting_approval' && (
        <div style={{ 
          background: "rgba(99, 102, 241, 0.1)", 
          padding: "var(--space-4)", 
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-brand-primary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
            <ShieldCheck size={24} color="var(--color-brand-primary)" />
            <div>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: "600" }}>Solicitação de Vínculo</p>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                O usuário <strong>@{connection.telegram_username}</strong> quer se conectar à sua conta.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button className="btn btn-primary" onClick={handleApprove} disabled={actionLoading} style={{ flex: 1 }}>
              {actionLoading ? <Loader2 className="animate-spin" size={16} /> : "Sim, sou eu (Aprovar)"}
            </button>
            <button className="btn btn-ghost" onClick={handleDisconnect} disabled={actionLoading} style={{ color: "var(--color-expense)" }}>
              Rejeitar
            </button>
          </div>
        </div>
      )}

      {/* ESTADO 4: Conectado */}
      {connection?.status === 'linked' && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          background: "var(--color-bg-tertiary)", 
          padding: "var(--space-4)", 
          borderRadius: "var(--radius-lg)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div style={{ 
              background: "#0088cc", 
              color: "white", 
              width: "32px", 
              height: "32px", 
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Send size={16} style={{ transform: "translate(-1px, 1px)" }} />
            </div>
            <div>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: "600" }}>@{connection.telegram_username}</p>
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>Vinculado em {new Date(connection.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={handleDisconnect} disabled={actionLoading} style={{ color: "var(--color-expense)" }}>
            <XCircle size={16} /> Desconectar
          </button>
        </div>
      )}
    </div>
  );
}
