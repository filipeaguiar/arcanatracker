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

export interface TagBreakdown {
  name: string;
  total_cents: number;
  count: number;
}

export type ReportingInterval = "month" | "year";

export interface CategorySpendingData {
  period: string; // ISO date string (YYYY-MM-DD) normalized to start of period
  [category: string]: string | number; // Category name -> amount_cents (number) or period (string)
}

export interface SpendingTrendsResult {
  data: CategorySpendingData[];
  categories: string[]; // List of categories found in the period
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

export async function getTagBreakdown(
  from: string,
  to: string
): Promise<TagBreakdown[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch expense transactions only
  const { data: txRaw, error: txError } = await supabase
    .from("transactions")
    .select("id, amount_cents, category:categories!inner(type)")
    .eq("user_id", user.id)
    .eq("categories.type", "expense")
    .gte("transaction_date", from)
    .lte("transaction_date", to);

  const txData = txRaw as { id: string; amount_cents: number }[] | null;

  if (txError) throw new Error(txError.message);
  if (!txData || txData.length === 0) return [];

  const txIds = txData.map((tx: { id: string }) => tx.id);
  const txAmountMap = new Map(txData.map((tx: { id: string; amount_cents: number }) => [tx.id, tx.amount_cents]));

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
    existing.count += 1;
    map.set(tagName, existing);
  }

  return Array.from(map.values()).sort(
    (a, b) => b.total_cents - a.total_cents
  );
}

/**
 * Aggregates spending by category and period.
 * Groups low-volume categories (< 5% of total) into "Others".
 */
export async function getCategorySpendingTrends(
  interval: ReportingInterval = "month",
  from?: string,
  to?: string
): Promise<SpendingTrendsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  let query = supabase
    .from("transactions")
    .select(`
      amount_cents,
      transaction_date,
      category:categories(name, type)
    `)
    .eq("user_id", user.id);

  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const expenses = (data ?? []).filter(tx => {
    const cat = Array.isArray(tx.category) ? tx.category[0] : tx.category;
    return (cat as any)?.type === "expense";
  });

  if (expenses.length === 0) {
    return { data: [], categories: [] };
  }

  const categoryTotals: Record<string, number> = {};
  let totalVolume = 0;

  expenses.forEach(tx => {
    const catName = (tx.category as any)?.name || "outros";
    categoryTotals[catName] = (categoryTotals[catName] || 0) + tx.amount_cents;
    totalVolume += tx.amount_cents;
  });

  const threshold = totalVolume * 0.05;
  const mainCategories = Object.keys(categoryTotals).filter(cat => categoryTotals[cat] >= threshold);
  const hasOthers = mainCategories.length < Object.keys(categoryTotals).length;

  const groupedData: Record<string, Record<string, number>> = {};

  expenses.forEach(tx => {
    const date = new Date(tx.transaction_date + "T12:00:00");
    let periodKey: string;

    if (interval === "month") {
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    } else {
      periodKey = `${date.getFullYear()}-01-01`;
    }

    const catName = (tx.category as any)?.name || "outros";
    const finalCatName = mainCategories.includes(catName) ? catName : "Outros";

    if (!groupedData[periodKey]) {
      groupedData[periodKey] = {};
    }

    groupedData[periodKey][finalCatName] = (groupedData[periodKey][finalCatName] || 0) + tx.amount_cents;
  });

  const periods = Object.keys(groupedData).sort();
  const resultData: CategorySpendingData[] = periods.map(period => ({
    period,
    ...groupedData[period],
  }));

  const finalCategories = [...mainCategories];
  if (hasOthers && !finalCategories.includes("Outros")) {
    finalCategories.push("Outros");
  }

  return {
    data: resultData,
    categories: finalCategories,
  };
}
