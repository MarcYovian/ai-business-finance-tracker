import { SupabaseClient } from "@supabase/supabase-js";
import { CategoryDTO } from "../types.js";

export async function listCategories(
  supabase: SupabaseClient,
  userId: string,
  type?: "income" | "expense"
): Promise<CategoryDTO[]> {
  let query = supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId);

  if (type) {
    query = query.eq("type", type);
  }

  query = query.order("name", { ascending: true });

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list categories: ${error.message}`);
  }

  return (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    userId: c.user_id,
    type: c.type,
    parentId: c.parent_id,
    color: c.color,
    icon: c.icon,
    description: c.description,
    sortOrder: c.sort_order,
    isActive: c.is_active ?? true,
    createdAt: c.created_at,
  }));
}
