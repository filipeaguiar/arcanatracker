import { type SupabaseClient } from "@supabase/supabase-js";
import { findOrCreateCategoryAdmin, findOrCreateTagsAdmin } from "./db-helpers";
import {
  calculateInvoiceDates,
  calculateInstallmentInvoiceDates,
} from "@/lib/utils/invoice";

// ─── Types ──────────────────────────────────────────────────────────

export interface CreateTransactionCoreParams {
  transactionDate: string;
  amountCentsList: number[];
  description: string;
  categoryName: string;
  tagNames: string[];
  creditCardId: string | null;
}

export interface CreateTransactionCoreResult {
  success: boolean;
  data?: { created: number; group_id: string | null };
  error?: string;
}

// ─── Core Service ───────────────────────────────────────────────────

/**
 * Environment-agnostic transaction creation logic.
 * Works with both authenticated and admin Supabase clients.
 */
export async function createTransactionCore(
  supabase: SupabaseClient,
  userId: string,
  params: CreateTransactionCoreParams
): Promise<CreateTransactionCoreResult> {
  try {
    // 1. Resolve Category
    const category = await findOrCreateCategoryAdmin(
      supabase,
      userId,
      params.categoryName
    );

    // 2. Resolve Tags
    const tags = await findOrCreateTagsAdmin(
      supabase,
      userId,
      params.tagNames
    );
    const tagIds = tags.map(t => t.id);

    // 3. Prepare Installment Data
    const isInstallment = params.amountCentsList.length > 1;
    const installmentCount = params.amountCentsList.length;
    const groupId = isInstallment ? crypto.randomUUID() : null;

    let invoiceIds: (string | null)[] = Array(installmentCount).fill(null);
    let transactionDates: string[] = Array(installmentCount).fill(params.transactionDate);

    // 4. Handle Credit Card / Invoice Logic
    if (params.creditCardId) {
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
        transactionDates = invoiceDataList.map(d => d.dueDate);
      }
    } else if (isInstallment) {
      // 5. Handle Direct Payment Installment Date Distribution (FIX)
      transactionDates = params.amountCentsList.map((_, index) => {
        if (index === 0) return params.transactionDate;
        
        const date = new Date(params.transactionDate + "T12:00:00");
        date.setMonth(date.getMonth() + index);
        return date.toISOString().split("T")[0];
      });
    }

    // 6. Build Rows
    const rows = params.amountCentsList.map((amountCents, index) => ({
      user_id: userId,
      transaction_date: transactionDates[index],
      amount_cents: amountCents,
      description: params.description,
      category_id: category.id,
      credit_card_id: params.creditCardId,
      invoice_id: invoiceIds[index],
      installment_group_id: groupId,
      installment_current: isInstallment ? index + 1 : null,
      installment_total: isInstallment ? installmentCount : null,
    }));

    // 7. Insert Transactions
    const { data: inserted, error: insertError } = await supabase
      .from("transactions")
      .insert(rows)
      .select("id");

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // 8. Link Tags
    if (tagIds.length > 0 && inserted) {
      const tagLinks = inserted.flatMap((tx: { id: string }) =>
        tagIds.map((tagId) => ({
          transaction_id: tx.id,
          tag_id: tagId,
        }))
      );

      const { error: tagError } = await supabase.from("transaction_tags").insert(tagLinks);
      if (tagError) {
        console.error("Failed to link tags:", tagError);
        // We don't fail the whole transaction if tags fail, but we log it
      }
    }

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

// ─── Internal Helper: Invoice get-or-create ─────────────────────────

export async function getOrCreateInvoice(
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
