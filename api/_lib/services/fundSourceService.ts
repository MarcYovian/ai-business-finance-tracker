import { SupabaseClient } from "@supabase/supabase-js";
import { FundSourceDTO } from "../types.js";

export async function listFundSources(
  supabase: SupabaseClient,
  userId: string
): Promise<FundSourceDTO[]> {
  const { data, error } = await supabase
    .from("fund_sources")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list fund sources: ${error.message}`);
  }

  return (data || []).map((f) => ({
    id: f.id,
    userId: f.user_id,
    name: f.name,
    type: f.type,
    balance: (f.balance || 0) / 100, // Cents to Rupiah
    accountNumber: f.account_number,
    accountHolderName: f.account_holder_name,
    colorTheme: f.color_theme,
    isActive: f.is_active ?? true,
    createdAt: f.created_at,
  }));
}
