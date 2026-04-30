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
    const catRaw = row.category;
    const cat = Array.isArray(catRaw) ? catRaw[0] : catRaw as unknown as { name: string; type: string };
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
    const catRaw = row.category;
    const cat = Array.isArray(catRaw) ? catRaw[0] : catRaw as unknown as { type: string };
    const catType = cat?.type;
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

export interface TagBreakdown {
  name: string;
  total_cents: number;
  count: number;
}

export async function getTagBreakdown(
  from: string,
  to: string
): Promise<TagBreakdown[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch expense transactions only (usually tags are used for expenses, or we can fetch all and filter by expense)
  const { data: txRaw, error: txError } = await supabase
    .from("transactions")
    .select("id, amount_cents, category:categories!inner(type)")
    .eq("user_id", user.id)
    .eq("categories.type", "expense")
    .gte("transaction_date", from)
    .lte("transaction_date", to);

  const txData = txRaw as any;

  if (txError) throw new Error(txError.message);
  if (!txData || txData.length === 0) return [];

  const txIds = txData.map((tx) => tx.id);
  const txAmountMap = new Map(txData.map((tx) => [tx.id, tx.amount_cents]));

  // Fetch tags for these transactions
  const { data: tagData, error: tagError } = await supabase
    .from("transaction_tags")
    .select("transaction_id, tag:tags(name)")
    .in("transaction_id", txIds);

  if (tagError) throw new Error(tagError.message);

  const map = new Map<string, TagBreakdown>();

  for (const row of tagData ?? []) {
    const tagName = (row.tag as any)?.name;
    if (!tagName) continue;

    const amount = txAmountMap.get(row.transaction_id) || 0;
    const existing = map.get(tagName) || {
      name: tagName,
      total_cents: 0,
      count: 0,
    };
    
    existing.total_cents += amount;
    // Note: This count is the number of transactions with this tag
    existing.count += 1;
    map.set(tagName, existing);
  }

  return Array.from(map.values()).sort(
    (a, b) => b.total_cents - a.total_cents
  );
}
