import { SupabaseClient } from "@supabase/supabase-js";
import { Category } from "./categories";
import { Tag } from "./tags";

/**
 * Version of findOrCreateCategory that works without browser auth cookies.
 */
export async function findOrCreateCategoryAdmin(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  type: "expense" | "income" = "expense"
): Promise<Category> {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-');

  // Try to find existing
  const { data: existing } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("name", normalizedName)
    .single();

  if (existing) return existing;

  // Create new
  const { data: created, error } = await supabase
    .from("categories")
    .insert({ user_id: userId, name: normalizedName, type })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created;
}

/**
 * Version of findOrCreateTags that works without browser auth cookies.
 */
export async function findOrCreateTagsAdmin(
  supabase: SupabaseClient,
  userId: string,
  names: string[]
): Promise<Tag[]> {
  if (names.length === 0) return [];
  const normalizedNames = names.map(n => n.toLowerCase().replace(/\s+/g, '-'));

  // Find existing
  const { data: existing } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId)
    .in("name", normalizedNames);

  const existingNames = existing?.map(t => t.name) || [];
  const missingNames = normalizedNames.filter(n => !existingNames.includes(n));

  // Insert missing
  let created: Tag[] = [];
  if (missingNames.length > 0) {
    const { data: newTags, error } = await supabase
      .from("tags")
      .insert(missingNames.map(n => ({ user_id: userId, name: n })))
      .select();
    
    if (error) throw new Error(error.message);
    created = newTags || [];
  }

  return [...(existing || []), ...created];
}
