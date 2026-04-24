"use client";

import { useTransition } from "react";
import { deleteTransaction } from "@/lib/actions/transactions";
import { Trash2 } from "lucide-react";

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    
    startTransition(async () => {
      await deleteTransaction(id);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="btn btn-ghost"
      style={{
        padding: "var(--space-2)",
        color: "var(--color-expense)",
        opacity: isPending ? 0.5 : 1,
      }}
      title="Excluir transação"
    >
      <Trash2 size={16} />
    </button>
  );
}
