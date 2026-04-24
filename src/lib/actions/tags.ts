"use server";

/**
 * Server Actions — Tags
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export async function listTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTag(name: string): Promise<Tag> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("tags")
    .insert({ user_id: user.id, name: name.toLowerCase() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Find or create multiple tags by name.
 * Used by the transaction creation flow to auto-resolve parser output.
 */
export async function findOrCreateTags(names: string[]): Promise<Tag[]> {
  if (names.length === 0) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const normalizedNames = names.map((n) => n.toLowerCase());
  const result: Tag[] = [];

  // Find existing tags
  const { data: existing } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", user.id)
    .in("name", normalizedNames);

  const existingMap = new Map(
    (existing ?? []).map((t) => [t.name, t])
  );

  // Identify tags that need to be created
  const toCreate = normalizedNames.filter((n) => !existingMap.has(n));

  if (toCreate.length > 0) {
    const { data: created, error } = await supabase
      .from("tags")
      .insert(toCreate.map((name) => ({ user_id: user.id, name })))
      .select();

    if (error) throw new Error(error.message);
    (created ?? []).forEach((t) => existingMap.set(t.name, t));
  }

  // Return in order
  for (const name of normalizedNames) {
    const tag = existingMap.get(name);
    if (tag) result.push(tag);
  }

  return result;
}
