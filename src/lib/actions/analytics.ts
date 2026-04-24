"use server";

import { createClient } from "@/lib/supabase/server";

export interface CategoryBreakdown {
  name: string;
  type: string;
  total_cents: number;
  count: number;
}

export interface DailySpending {
  date: string;
  expense_cents: number;
  income_cents: number;
}

export async function getCategoryBreakdown(
  from: string,
  to: string
): Promise<CategoryBreakdown[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("transactions")
    .select("amount_cents, category:categories(name, type)")
    .eq("user_id", user.id)
    .gte("transaction_date", from)
    .lte("transaction_date", to);

  if (error) throw new Error(error.message);

  // Agregar por categoria
  const map = new Map<string, CategoryBreakdown>();
  for (const row of data ?? []) {
    const cat = row.category as unknown as { name: string; type: string };
    if (!cat) continue;
    const key = cat.name;
    const existing = map.get(key) || {
      name: cat.name,
      type: cat.type,
      total_cents: 0,
      count: 0,
    };
    existing.total_cents += row.amount_cents;
    existing.count += 1;
    map.set(key, existing);
  }

  return Array.from(map.values()).sort(
    (a, b) => b.total_cents - a.total_cents
  );
}

export async function getDailySpending(
  from: string,
  to: string
): Promise<DailySpending[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("transactions")
    .select("transaction_date, amount_cents, category:categories(type)")
    .eq("user_id", user.id)
    .gte("transaction_date", from)
    .lte("transaction_date", to)
    .order("transaction_date", { ascending: true });

  if (error) throw new Error(error.message);

  // Agregar por dia
  const map = new Map<string, DailySpending>();
  for (const row of data ?? []) {
    const date = row.transaction_date;
    const catType = (row.category as unknown as { type: string })?.type;
    const existing = map.get(date) || {
      date,
      expense_cents: 0,
      income_cents: 0,
    };
    if (catType === "income") {
      existing.income_cents += row.amount_cents;
    } else {
      existing.expense_cents += row.amount_cents;
    }
    map.set(date, existing);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
