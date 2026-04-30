"use server";

/**
 * Server Actions — Transactions
 *
 * The main entry point that integrates:
 *   Parser → Category resolution → Tag resolution → Credit card → Invoice → DB
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type SupabaseClient } from "@supabase/supabase-js";
import { parse } from "@/lib/parser";
import { findOrCreateCategory } from "./categories";
import { findOrCreateTags } from "./tags";
import { resolveDefaultCard } from "./credit-cards";
import {
  calculateInvoiceDates,
  calculateInstallmentInvoiceDates,
} from "@/lib/utils/invoice";

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
 *   2. Resolve category (find or create)
 *   3. Resolve tags (find or create)
 *   4. Resolve credit card (auto)
 *   5. Calculate invoice dates (if credit card)
 *   6. Insert transaction(s) into DB
 *   7. Link tags
 */
export async function createTransaction(
  input: string,
  transactionDate?: string
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
    // 2. Resolve category
    const category = await findOrCreateCategory(parsed.category);

    // 3. Resolve tags
    const tags = await findOrCreateTags(parsed.tags);

    // 4. Resolve credit card
    const card = await resolveDefaultCard();

    // 5. Build the params for internal insertion
    return await insertTransactionRecords(supabase, user.id, {
      transactionDate: txDate,
      amountCentsList: parsed.installments,
      description: parsed.description || parsed.category,
      categoryId: category.id,
      creditCardId: card?.id ?? null,
      tagIds: tags.map(t => t.id),
    });

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
    let categoryId = input.category_id;
    if (!categoryId && input.category_name) {
      const cat = await findOrCreateCategory(input.category_name);
      categoryId = cat.id;
    }
    if (!categoryId) throw new Error("Categoria é obrigatória");

    let tagIds = input.tag_ids || [];
    if (input.tag_names && input.tag_names.length > 0) {
      const tags = await findOrCreateTags(input.tag_names);
      tagIds = [...tagIds, ...tags.map(t => t.id)];
    }

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

    return await insertTransactionRecords(supabase, user.id, {
      transactionDate: input.transaction_date,
      amountCentsList: amounts,
      description: input.description,
      categoryId: categoryId,
      creditCardId: input.credit_card_id,
      tagIds: tagIds,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}

// ─── Internal Helper: Insert Records ─────────────────────────────────

async function insertTransactionRecords(
  supabase: SupabaseClient,
  userId: string,
  params: {
    transactionDate: string;
    amountCentsList: number[];
    description: string;
    categoryId: string;
    creditCardId: string | null;
    tagIds: string[];
  }
): Promise<CreateTransactionResult> {
  const isInstallment = params.amountCentsList.length > 1;
  const installmentCount = params.amountCentsList.length;
  const groupId = isInstallment ? crypto.randomUUID() : null;

  let invoiceIds: (string | null)[] = Array(installmentCount).fill(null);

  if (params.creditCardId) {
    // Fetch card details for closing/due day
    const { data: card } = await supabase
      .from("credit_cards")
      .select("id, closing_day, due_day")
      .eq("id", params.creditCardId)
      .single();

    if (card) {
      const invoiceDatesList = isInstallment
        ? calculateInstallmentInvoiceDates(
            params.transactionDate,
            installmentCount,
            card.closing_day,
            card.due_day
          )
        : [calculateInvoiceDates(params.transactionDate, card.closing_day, card.due_day)];

      const invoiceDataList = await Promise.all(
        invoiceDatesList.map(async (dates: { referenceMonth: string; closingDate: string; dueDate: string }) => {
          const id = await getOrCreateInvoice(
            supabase,
            card.id,
            dates.referenceMonth,
            dates.closingDate,
            dates.dueDate
          );
          return { id, dueDate: dates.dueDate };
        })
      );
      
      invoiceIds = invoiceDataList.map(d => d.id);
      // We'll use these due dates for the transaction dates
      const invoiceDueDates = invoiceDataList.map(d => d.dueDate);

      // Build rows using invoice due dates
      const rows = params.amountCentsList.map((amountCents, index) => {
        return {
          user_id: userId,
          transaction_date: invoiceDueDates[index],
          amount_cents: amountCents,
          description: params.description,
          category_id: params.categoryId,
          credit_card_id: params.creditCardId,
          invoice_id: invoiceIds[index],
          installment_group_id: groupId,
          installment_current: isInstallment ? index + 1 : null,
          installment_total: isInstallment ? installmentCount : null,
        };
      });

      const { data: inserted, error: insertError } = await supabase
        .from("transactions")
        .insert(rows)
        .select("id");

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      if (params.tagIds.length > 0 && inserted) {
        const tagLinks = inserted.flatMap((tx: { id: string }) =>
          params.tagIds.map((tagId) => ({
            transaction_id: tx.id,
            tag_id: tagId,
          }))
        );

        const { error: tagError } = await supabase.from("transaction_tags").insert(tagLinks);
        if (tagError) console.error("Failed to link tags:", tagError);
      }

      revalidatePath("/dashboard");
      revalidatePath("/transactions");

      return {
        success: true,
        data: {
          created: inserted?.length ?? 0,
          group_id: groupId,
        },
      };
    }
  }

  // Fallback for non-credit card transactions (Direct payments)
  const rows = params.amountCentsList.map((amountCents, index) => {
    let installmentTxDate = params.transactionDate;
    if (isInstallment && index > 0) {
      const date = new Date(params.transactionDate + "T12:00:00");
      date.setMonth(date.getMonth() + index);
      installmentTxDate = date.toISOString().split("T")[0];
    }

    return {
      user_id: userId,
      transaction_date: installmentTxDate,
      amount_cents: amountCents,
      description: params.description,
      category_id: params.categoryId,
      credit_card_id: null,
      invoice_id: null,
      installment_group_id: groupId,
      installment_current: isInstallment ? index + 1 : null,
      installment_total: isInstallment ? installmentCount : null,
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from("transactions")
    .insert(rows)
    .select("id");

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  if (params.tagIds.length > 0 && inserted) {
    const tagLinks = inserted.flatMap((tx: { id: string }) =>
      params.tagIds.map((tagId) => ({
        transaction_id: tx.id,
        tag_id: tagId,
      }))
    );

    const { error: tagError } = await supabase.from("transaction_tags").insert(tagLinks);
    if (tagError) console.error("Failed to link tags:", tagError);
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");

  return {
    success: true,
    data: {
      created: inserted?.length ?? 0,
      group_id: groupId,
    },
  };
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

// ─── Internal: Invoice get-or-create ────────────────────────────────

async function getOrCreateInvoice(
  supabase: SupabaseClient,
  creditCardId: string,
  referenceMonth: string,
  closingDate: string,
  dueDate: string
): Promise<string> {
  // Try to find existing invoice
  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("credit_card_id", creditCardId)
    .eq("reference_month", referenceMonth)
    .single();

  if (existing) return existing.id;

  // Create new invoice
  const { data: created, error } = await supabase
    .from("invoices")
    .insert({
      credit_card_id: creditCardId,
      reference_month: referenceMonth,
      closing_date: closingDate,
      due_date: dueDate,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create invoice: ${error.message}`);
  return created.id;
}
