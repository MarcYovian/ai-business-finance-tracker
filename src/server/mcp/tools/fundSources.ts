import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import { listFundSources } from "../services/fundSourceService.js";

export const listFundSourcesSchema = z.object({});

export async function handleListFundSources(
  supabase: SupabaseClient,
  userId: string
) {
  try {
    const fundSources = await listFundSources(supabase, userId);

    if (fundSources.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Belum ada akun sumber dana atau rekening yang terdaftar.",
          },
        ],
      };
    }

    const totalBalance = fundSources.reduce((acc, f) => acc + f.balance, 0);

    const listText = fundSources.map((f) => {
      const formattedBalance = `Rp${f.balance.toLocaleString("id-ID")}`;
      const status = f.isActive ? "Aktif" : "Non-aktif";
      return `- **${f.name}** (${f.type}): ${formattedBalance} [ID: \`${f.id}\`] (${status})`;
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Daftar Akun / Rekening (Total Saldo: Rp${totalBalance.toLocaleString("id-ID")}):\n\n${listText.join("\n")}`,
        },
      ],
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Gagal mengambil daftar akun sumber dana: ${error.message}`,
        },
      ],
    };
  }
}
