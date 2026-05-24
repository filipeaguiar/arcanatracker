"use server";

/**
 * Server Actions — Transactions
 *
 * The main entry point that integrates:
 *   Parser → Category resolution → Tag resolution → Credit card → Invoice → DB
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parse } from "@/lib/parser";
import { resolveDefaultCard } from "./credit-cards";
import { createTransactionCore, getOrCreateInvoice } from "./transaction-core";

// ─── Types ──────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  user_id: string;
  transaction_date: string;
  amount_cents: number;
  description: string;
  category_id: string;
  credit_card_id: string | null;
  invoice_id: string | null;
  installment_group_id: string | null;
  installment_current: number | null;
  installment_total: number | null;
  created_at: string;
  // Joined fields
  category?: { name: string; type: string };
  tags?: { id: string; name: string }[];
}

export interface CreateTransactionResult {
  success: boolean;
  data?: { created: number; group_id: string | null };
  error?: string;
}

export interface ListTransactionsParams {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: string;
  categoryId?: string;
}

export interface ListTransactionsResult {
  data: Transaction[];
  meta: { page: number; total: number; limit: number };
}

// ─── Create Transaction (via DSL) ───────────────────────────────────

/**
 * Create transaction(s) from a DSL input string.
 *
 * Full pipeline:
 *   1. Parse DSL input
 *   2. Resolve credit card (auto)
 *   3. Delegate to createTransactionCore
 *   4. Revalidate cache
 */
export async function createTransaction(
  input: string,
  transactionDate?: string,
  options?: {
    useCreditCard?: boolean;
    creditCardId?: string | null;
  }
): Promise<CreateTransactionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Não autenticado" };

  // 1. Parse
  const parseResult = parse(input);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.message };
  }

  const parsed = parseResult.data;
  const txDate = transactionDate || new Date().toISOString().split("T")[0];

  try {
    // 2. Resolve credit card
    let finalCreditCardId: string | null = null;

    // Always use credit card if it's an installment format (e.g., 10*30)
    const isInstallment = parsed.installment_type !== null;

    if (isInstallment) {
      if (options?.creditCardId) {
        finalCreditCardId = options.creditCardId;
      } else {
        const defaultCard = await resolveDefaultCard();
        finalCreditCardId = defaultCard?.id ?? null;
      }
    } else if (options?.useCreditCard) {
      if (options.creditCardId) {
        finalCreditCardId = options.creditCardId;
      } else {
        const defaultCard = await resolveDefaultCard();
        finalCreditCardId = defaultCard?.id ?? null;
      }
    }

    // 3. Call Core
    const result = await createTransactionCore(supabase, user.id, {
      transactionDate: txDate,
      amountCentsList: parsed.installments,
      description: parsed.description || parsed.category,
      categoryName: parsed.category,
      tagNames: parsed.tags,
      creditCardId: finalCreditCardId,
    });

    if (result.success) {
      revalidatePath("/dashboard");
      revalidatePath("/transactions");
    }

    return result;

  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}

export interface CreateTransactionStructuredInput {
  transaction_date: string;
  amount_cents: number;
  description: string;
  category_id?: string;
  category_name?: string;
  tag_ids?: string[];
  tag_names?: string[];
  credit_card_id: string | null;
  installment_total: number;
}

export async function createTransactionStructured(
  input: CreateTransactionStructuredInput
): Promise<CreateTransactionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Não autenticado" };

  try {
    const isInstallment = input.installment_total > 1;
    const count = input.installment_total > 0 ? input.installment_total : 1;
    
    let amounts: number[] = [];
    if (isInstallment) {
      const baseAmount = Math.floor(input.amount_cents / count);
      const remainder = input.amount_cents % count;
      amounts = Array(count).fill(baseAmount);
      amounts[0] += remainder;
    } else {
      amounts = [input.amount_cents];
    }

    let finalCreditCardId = input.credit_card_id || null;
    if (isInstallment && !finalCreditCardId) {
      const defaultCard = await resolveDefaultCard();
      finalCreditCardId = defaultCard?.id ?? null;
    }

    // Call Core
    const result = await createTransactionCore(supabase, user.id, {
      transactionDate: input.transaction_date,
      amountCentsList: amounts,
      description: input.description,
      categoryName: input.category_name || "outros", // Fallback if missing
      tagNames: input.tag_names || [],
      creditCardId: finalCreditCardId,
    });

    if (result.success) {
      revalidatePath("/dashboard");
      revalidatePath("/transactions");
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}

// ─── List Transactions ──────────────────────────────────────────────

export async function listTransactions(
  params: ListTransactionsParams = {}
): Promise<ListTransactionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("transactions")
    .select("*, category:categories(name, type)", { count: "exact" })
    .eq("user_id", user.id)
    .range(offset, offset + limit - 1);

  // Filters
  if (params.from) {
    query = query.gte("transaction_date", params.from);
  }
  if (params.to) {
    query = query.lte("transaction_date", params.to);
  }
  if (params.categoryId) {
    query = query.eq("category_id", params.categoryId);
  }

  // Sorting
  const [sortField, sortDir] = (params.sort ?? "transaction_date,desc").split(
    ","
  );
  query = query.order(sortField, { ascending: sortDir === "asc" });

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  // Fetch tags for these transactions
  const transactionIds = (data ?? []).map((t) => t.id);
  const tagsMap: Map<string, { id: string; name: string }[]> = new Map();

  if (transactionIds.length > 0) {
    const { data: tagData } = await supabase
      .from("transaction_tags")
      .select("transaction_id, tag:tags(id, name)")
      .in("transaction_id", transactionIds);

    if (tagData) {
      for (const row of tagData) {
        const existing = tagsMap.get(row.transaction_id) ?? [];
        if (row.tag) {
          // Supabase join results can sometimes be returned as arrays in TypeScript
          const tagObj = (Array.isArray(row.tag) ? row.tag[0] : row.tag) as { id: string; name: string };
          if (tagObj) {
            existing.push(tagObj);
          }
        }
        tagsMap.set(row.transaction_id, existing);
      }
    }
  }

  const transactions = (data ?? []).map((t) => ({
    ...t,
    tags: tagsMap.get(t.id) ?? [],
  }));

  return {
    data: transactions,
    meta: { page, total: count ?? 0, limit },
  };
}

// ─── Update Transaction ─────────────────────────────────────────────

export interface UpdateTransactionInput {
  id: string;
  transaction_date: string;
  amount_cents: number;
  description: string;
  category_id: string;
  credit_card_id: string | null;
  tag_ids: string[];
}

export async function updateTransaction(input: UpdateTransactionInput): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // 1. Resolve Invoice if using credit card
  let invoiceId: string | null = null;
  if (input.credit_card_id) {
    const { data: card } = await supabase
      .from("credit_cards")
      .select("closing_day, due_day")
      .eq("id", input.credit_card_id)
      .single();

    if (card) {
      const dates = calculateInvoiceDates(
        input.transaction_date,
        card.closing_day,
        card.due_day
      );
      invoiceId = await getOrCreateInvoice(
        supabase,
        input.credit_card_id,
        dates.referenceMonth,
        dates.closingDate,
        dates.dueDate
      );
    }
  }

  // 2. Update the transaction
  const { error: txError } = await supabase
    .from("transactions")
    .update({
      transaction_date: input.transaction_date,
      amount_cents: input.amount_cents,
      description: input.description,
      category_id: input.category_id,
      credit_card_id: input.credit_card_id,
      invoice_id: invoiceId,
    })
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (txError) throw new Error(txError.message);

  // 3. Update tags (Sync approach: delete all and re-insert)
  await supabase
    .from("transaction_tags")
    .delete()
    .eq("transaction_id", input.id);

  if (input.tag_ids.length > 0) {
    const { error: tagError } = await supabase.from("transaction_tags").insert(
      input.tag_ids.map((tagId) => ({
        transaction_id: input.id,
        tag_id: tagId,
      }))
    );
    if (tagError) throw new Error(tagError.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

// ─── Delete Transaction ─────────────────────────────────────────────

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // 1. Buscar a transação para verificar se faz parte de um grupo de parcelas
  const { data: tx, error: fetchError } = await supabase
    .from("transactions")
    .select("installment_group_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !tx) {
    throw new Error(fetchError?.message || "Transação não encontrada");
  }

  // 2. Executar a deleção
  let query = supabase.from("transactions").delete().eq("user_id", user.id);

  if (tx.installment_group_id) {
    // Deleta todas as parcelas do grupo
    query = query.eq("installment_group_id", tx.installment_group_id);
  } else {
    // Deleta apenas a transação individual
    query = query.eq("id", id);
  }

  const { error: deleteError } = await query;

  if (deleteError) throw new Error(deleteError.message);

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

// ─── Summary ────────────────────────────────────────────────────────

export interface TransactionSummary {
  total_income_cents: number;
  total_expense_cents: number;
  balance_cents: number;
}

export async function getTransactionSummary(
  from?: string,
  to?: string
): Promise<TransactionSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  let query = supabase
    .from("transactions")
    .select("amount_cents, category:categories(type)")
    .eq("user_id", user.id);

  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of data ?? []) {
    const categoryData = Array.isArray(row.category) ? row.category[0] : row.category;
    const categoryType = (categoryData as { type: string } | null)?.type;
    if (categoryType === "income") {
      totalIncome += row.amount_cents;
    } else {
      totalExpense += row.amount_cents;
    }
  }

  return {
    total_income_cents: totalIncome,
    total_expense_cents: totalExpense,
    balance_cents: totalIncome - totalExpense,
  };
}
