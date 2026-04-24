"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount_cents: number;
  category_id: string;
  type: "income" | "expense";
  status: "active" | "paused";
  start_date: string;
  created_at: string;
  category?: { name: string; type: string };
}

// Helper: Gera transações futuras para os próximos 12 meses
async function generateFutureTransactions(
  supabase: any,
  userId: string,
  subId: string,
  name: string,
  amount_cents: number,
  categoryId: string,
  startDate: string,
  monthsToGenerate: number = 12
) {
  const rows = [];
  const start = new Date(startDate + "T12:00:00");

  for (let i = 0; i < monthsToGenerate; i++) {
    const txDate = new Date(start);
    txDate.setMonth(txDate.getMonth() + i);
    const dateStr = txDate.toISOString().split("T")[0];

    rows.push({
      user_id: userId,
      description: name,
      amount_cents: amount_cents,
      category_id: categoryId,
      transaction_date: dateStr,
      subscription_id: subId,
    });
  }

  const { error } = await supabase.from("transactions").insert(rows);
  if (error) throw new Error("Erro ao gerar transações da assinatura: " + error.message);
}

export async function createSubscription(data: {
  name: string;
  amount_cents: number;
  category_id: string;
  type: "income" | "expense";
  start_date: string;
}): Promise<Subscription> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // 1. Cria a assinatura
  const { data: sub, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      name: data.name,
      amount_cents: data.amount_cents,
      category_id: data.category_id,
      type: data.type,
      start_date: data.start_date,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // 2. Gera transações para os próximos 12 meses
  await generateFutureTransactions(
    supabase,
    user.id,
    sub.id,
    sub.name,
    sub.amount_cents,
    sub.category_id,
    sub.start_date
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
  return sub;
}

export async function updateSubscription(
  id: string,
  data: {
    name?: string;
    amount_cents?: number;
    category_id?: string;
    status?: "active" | "paused";
  }
): Promise<Subscription> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // 1. Atualiza a assinatura
  const { data: updated, error } = await supabase
    .from("subscriptions")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // 2. Atualiza transações FUTURAS (>= hoje)
  const todayStr = new Date().toISOString().split("T")[0];
  const updatePayload: any = {};
  if (data.name) updatePayload.description = data.name;
  if (data.amount_cents) updatePayload.amount_cents = data.amount_cents;
  if (data.category_id) updatePayload.category_id = data.category_id;

  if (Object.keys(updatePayload).length > 0) {
    const { error: txError } = await supabase
      .from("transactions")
      .update(updatePayload)
      .eq("subscription_id", id)
      .gte("transaction_date", todayStr); // A MÁGICA: Só afeta hoje em diante

    if (txError) throw new Error("Erro ao atualizar transações futuras: " + txError.message);
  }

  // 3. Se foi pausada, exclui as futuras. Se foi reativada, poderíamos recriar (simplificado por enquanto).
  if (data.status === "paused") {
    await supabase
      .from("transactions")
      .delete()
      .eq("subscription_id", id)
      .gte("transaction_date", todayStr);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
  return updated;
}

export async function deleteSubscription(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Apaga apenas as transações futuras, mantendo o histórico de que a pessoa pagou isso no passado
  const todayStr = new Date().toISOString().split("T")[0];
  await supabase
    .from("transactions")
    .delete()
    .eq("subscription_id", id)
    .gte("transaction_date", todayStr);

  // Apaga a assinatura
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
}

export async function listSubscriptions(): Promise<Subscription[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, category:categories(name, type)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
