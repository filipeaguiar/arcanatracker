"use server";

import { createClient } from "@/lib/supabase/server";

export async function exportData(
  from: string,
  to: string,
  format: "csv" | "moneylog"
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Buscamos todas as transações do período, com categorias e tags
    const { data: txData, error } = await supabase
      .from("transactions")
      .select(`
        id,
        transaction_date,
        amount_cents,
        description,
        category:categories(name, type)
      `)
      .eq("user_id", user.id)
      .gte("transaction_date", from)
      .lte("transaction_date", to)
      .order("transaction_date", { ascending: true });

    if (error) throw new Error(error.message);

    // Buscar tags
    const txIds = (txData ?? []).map((t) => t.id);
    const tagsMap = new Map<string, string[]>();

    if (txIds.length > 0) {
      const { data: tagData } = await supabase
        .from("transaction_tags")
        .select("transaction_id, tag:tags(name)")
        .in("transaction_id", txIds);

      for (const row of tagData ?? []) {
        const tagName = (row.tag as any)?.name;
        if (tagName) {
          const existing = tagsMap.get(row.transaction_id) || [];
          existing.push(tagName);
          tagsMap.set(row.transaction_id, existing);
        }
      }
    }

    // Gerar o conteúdo baseado no formato
    if (format === "moneylog") {
      // MoneyLog txt format (Data | Valor | Categoria | Tags/Descrição)
      // O delimitador padrão geralmente é a tabulação (\t)
      let content = "";
      for (const tx of txData ?? []) {
        const date = tx.transaction_date;
        const cat = tx.category as any;
        // MoneyLog trata despesas como negativas ou apenas o contexto.
        // Assumindo que despesas são positivas na base, mas no txt costumam ter sinal.
        // Vamos colocar o sinal negativo para despesas
        const isExpense = cat?.type === "expense";
        const val = tx.amount_cents / 100;
        const sign = isExpense ? "-" : "+";
        const formattedVal = `${sign}${val.toFixed(2)}`;
        
        const catName = cat?.name || "Sem Categoria";
        
        const tags = tagsMap.get(tx.id) || [];
        const tagsStr = tags.length > 0 ? tags.map(t => `#${t}`).join(" ") + " " : "";
        const desc = `${tagsStr}${tx.description || ""}`.trim();

        content += `${date}\t${formattedVal}\t${catName}\t${desc}\n`;
      }
      return { success: true, data: content };
    }

    if (format === "csv") {
      let content = "Data,Tipo,Valor,Categoria,Tags,Descricao\n";
      for (const tx of txData ?? []) {
        const date = tx.transaction_date;
        const cat = tx.category as any;
        const type = cat?.type === "income" ? "Receita" : "Despesa";
        const val = (tx.amount_cents / 100).toFixed(2).replace(".", ",");
        const catName = `"${cat?.name || ""}"`;
        
        const tags = tagsMap.get(tx.id) || [];
        const tagsStr = `"${tags.join(", ")}"`;
        const desc = `"${tx.description || ""}"`;

        content += `${date},${type},${val},${catName},${tagsStr},${desc}\n`;
      }
      return { success: true, data: content };
    }

    throw new Error("Formato inválido");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}
