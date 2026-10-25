import { SupabaseClient } from "@supabase/supabase-js";
import { CategoryDTO } from "../types.js";

export async function listCategories(
  supabase: SupabaseClient,
  userId: string,
  type?: "income" | "expense",
  keyHash?: string
): Promise<CategoryDTO[]> {
  const { data, error } = await supabase.rpc("mcp_list_categories", {
    p_user_id: userId,
    p_key_hash: keyHash || null,
    p_type: type || null,
  });

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
