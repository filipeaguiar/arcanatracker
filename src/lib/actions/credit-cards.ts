"use server";

/**
 * Server Actions — Credit Cards
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  closing_day: number;
  due_day: number;
  is_default: boolean;
  created_at: string;
}

export async function listCreditCards(): Promise<CreditCard[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCreditCard(input: {
  name: string;
  closing_day: number;
  due_day: number;
  is_default?: boolean;
}): Promise<CreditCard> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // If setting as default, unset any existing default first
  if (input.is_default) {
    await supabase
      .from("credit_cards")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("credit_cards")
    .insert({
      user_id: user.id,
      name: input.name,
      closing_day: input.closing_day,
      due_day: input.due_day,
      is_default: input.is_default ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  return data;
}

export async function deleteCreditCard(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("credit_cards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

/**
 * Resolve the credit card to use for a transaction.
 * Business rules:
 *   - 1 card → use automatically
 *   - Multiple cards → use the default
 *   - No cards → return null (not a credit card transaction)
 */
export async function resolveDefaultCard(): Promise<CreditCard | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: cards } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", user.id);

  if (!cards || cards.length === 0) return null;
  if (cards.length === 1) return cards[0];

  // Multiple cards: return default
  const defaultCard = cards.find((c) => c.is_default);
  return defaultCard ?? cards[0]; // fallback to first if no default set
}
