"use server";

import { createClient } from "@/lib/supabase/server";
import { Transaction } from "./transactions";

export interface Invoice {
  id: string;
  credit_card_id: string;
  reference_month: string;
  closing_date: string;
  due_date: string;
  created_at: string;
  credit_card?: { name: string };
}

export interface InvoiceWithTransactions extends Invoice {
  transactions: Transaction[];
  total_cents: number;
}

export async function listInvoicesByCard(creditCardId: string): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("invoices")
    .select("*, credit_card:credit_cards(name)")
    .eq("credit_card_id", creditCardId)
    .order("reference_month", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getInvoiceDetails(invoiceId: string): Promise<InvoiceWithTransactions> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Get invoice info
  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .select("*, credit_card:credit_cards(name)")
    .eq("id", invoiceId)
    .single();

  if (invError) throw new Error(invError.message);

  // Get transactions for this invoice
  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("*, category:categories(name, type)")
    .eq("invoice_id", invoiceId)
    .order("transaction_date", { ascending: true });

  if (txError) throw new Error(txError.message);

  const total = (transactions ?? []).reduce((acc, tx) => acc + tx.amount_cents, 0);

  return {
    ...invoice,
    transactions: transactions ?? [],
    total_cents: total,
  };
}
