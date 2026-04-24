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

    // 5. Determine if this is a single or installment transaction
    const isInstallment =
      parsed.installment_total !== null && parsed.installment_total > 1;
    const installmentCount = parsed.installment_total ?? 1;
    const groupId = isInstallment ? crypto.randomUUID() : null;

    // 6. Calculate invoice dates for each installment (if credit card exists)
    let invoiceIds: (string | null)[] = Array(installmentCount).fill(null);

    if (card) {
      const invoiceDatesList = isInstallment
        ? calculateInstallmentInvoiceDates(
            txDate,
            installmentCount,
            card.closing_day,
            card.due_day
          )
        : [calculateInvoiceDates(txDate, card.closing_day, card.due_day)];

      // Get or create invoice records
      invoiceIds = await Promise.all(
        invoiceDatesList.map((dates) =>
          getOrCreateInvoice(
            supabase,
            card.id,
            dates.referenceMonth,
            dates.closingDate,
            dates.dueDate
          )
        )
      );
    }

    // 7. Build transaction rows
    const rows = parsed.installments.map((amountCents, index) => {
      // Calculate the transaction date for this installment
      let installmentTxDate = txDate;
      if (isInstallment && index > 0) {
        const date = new Date(txDate + "T12:00:00");
        date.setMonth(date.getMonth() + index);
        installmentTxDate = date.toISOString().split("T")[0];
      }

      return {
        user_id: user.id,
        transaction_date: installmentTxDate,
        amount_cents: amountCents,
        description: parsed.description || parsed.category,
        category_id: category.id,
        credit_card_id: card?.id ?? null,
        invoice_id: invoiceIds[index],
        installment_group_id: groupId,
        installment_current: isInstallment ? index + 1 : null,
        installment_total: isInstallment ? installmentCount : null,
      };
    });

    // 8. Insert transactions
    const { data: inserted, error: insertError } = await supabase
      .from("transactions")
      .insert(rows)
      .select("id");

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // 9. Link tags to all transactions
    if (tags.length > 0 && inserted) {
      const tagLinks = inserted.flatMap((tx) =>
        tags.map((tag) => ({
          transaction_id: tx.id,
          tag_id: tag.id,
        }))
      );

      const { error: tagError } = await supabase
        .from("transaction_tags")
        .insert(tagLinks);

      if (tagError) {
        console.error("Failed to link tags:", tagError);
      }
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
  let tagsMap: Map<string, { id: string; name: string }[]> = new Map();

  if (transactionIds.length > 0) {
    const { data: tagData } = await supabase
      .from("transaction_tags")
      .select("transaction_id, tag:tags(id, name)")
      .in("transaction_id", transactionIds);

    if (tagData) {
      for (const row of tagData) {
        const existing = tagsMap.get(row.transaction_id) ?? [];
        if (row.tag) {
          const tagObj = row.tag as unknown as { id: string; name: string };
          existing.push(tagObj);
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

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

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
    const categoryType = (row.category as unknown as { type: string })?.type;
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
  supabase: Awaited<ReturnType<typeof createClient>>,
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
