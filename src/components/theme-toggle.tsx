"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="btn btn-ghost" style={{ padding: "var(--space-2)", color: "var(--color-text-secondary)" }} aria-label="Alternar tema">
        <div style={{ width: 18, height: 18 }} />
      </button>
    );
  }

  return (
    <button
      className="btn btn-ghost"
      style={{ padding: "var(--space-2)", color: "var(--color-text-secondary)" }}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label="Alternar tema"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
