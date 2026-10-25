import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import { listCategories } from "../services/categoryService.js";

export const listCategoriesSchema = z.object({
  type: z
    .enum(["income", "expense"])
    .optional()
    .describe("Filter berdasarkan tipe: 'income' (pemasukan) atau 'expense' (pengeluaran)."),
});

export async function handleListCategories(
  supabase: SupabaseClient,
  userId: string,
  args: z.infer<typeof listCategoriesSchema>
) {
  try {
    const categories = await listCategories(supabase, userId, args.type);

    if (categories.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Belum ada kategori yang terdaftar.",
          },
        ],
      };
    }

    const parentCategories = categories.filter((c) => !c.parentId);
    const subCategories = categories.filter((c) => !!c.parentId);

    const formattedList = parentCategories.map((parent) => {
      const children = subCategories.filter((sub) => sub.parentId === parent.id);
      let text = `- **${parent.name}** [${parent.type.toUpperCase()}] (ID: \`${parent.id}\`)`;
      if (children.length > 0) {
        const childTexts = children.map((c) => `  └─ ${c.name} (ID: \`${c.id}\`)`);
        text += `\n${childTexts.join("\n")}`;
      }
      return text;
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Daftar Kategori Finansial:\n\n${formattedList.join("\n")}`,
        },
      ],
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Gagal mengambil daftar kategori: ${error.message}`,
        },
      ],
    };
  }
}
