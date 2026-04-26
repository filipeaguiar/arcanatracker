import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Offline | Arcana Tracker",
};

export default function OfflinePage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      padding: "20px",
      textAlign: "center",
      gap: "1rem"
    }}>
      <AlertCircle size={48} color="var(--color-primary)" />
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Você está Offline</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Parece que você perdeu a conexão com a internet. O Arcana Tracker precisa de internet para sincronizar seus dados.
      </p>
      <a 
        href="/"
        style={{
          marginTop: "1rem",
          padding: "10px 20px",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-background)",
          borderRadius: "8px",
          border: "none",
          fontWeight: "bold",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Ir para o Início
      </a>
    </div>
  );
}
