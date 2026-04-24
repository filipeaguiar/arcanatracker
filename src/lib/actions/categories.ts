"use server";

/**
 * Server Actions — Categories
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  created_at: string;
}

export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCategory(
  name: string,
  type: "income" | "expense"
): Promise<Category> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("categories")
    .insert({ user_id: user.id, name: name.toLowerCase(), type })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  return data;
}

/**
 * Find a category by name, or create it if it doesn't exist.
 * Used by the transaction creation flow to auto-resolve parser output.
 */
export async function findOrCreateCategory(
  name: string,
  type: "expense" | "income" = "expense"
): Promise<Category> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const normalizedName = name.toLowerCase();

  // Try to find existing
  const { data: existing } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .eq("name", normalizedName)
    .single();

  if (existing) return existing;

  // Create new
  const { data: created, error } = await supabase
    .from("categories")
    .insert({ user_id: user.id, name: normalizedName, type })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created;
}

export async function updateCategory(
  id: string,
  data: { name?: string; type?: "income" | "expense" }
): Promise<Category> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const updateData: Record<string, string> = {};
  if (data.name) updateData.name = data.name.toLowerCase();
  if (data.type) updateData.type = data.type;

  const { data: updated, error } = await supabase
    .from("categories")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}
