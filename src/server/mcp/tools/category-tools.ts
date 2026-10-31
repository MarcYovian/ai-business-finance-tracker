import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AuthContext } from "@/server/auth/types";
import { CategoryDomainService } from "@/server/domain/categories/category.service";

export function registerCategoryTools(server: McpServer, ctx: AuthContext) {
  const service = new CategoryDomainService(ctx);

  // 1. Tool: list_categories
  server.registerTool(
    "list_categories",
    {
      description:
        "Mendapatkan daftar kategori pemasukan dan pengeluaran beserta subkategorinya.",
      inputSchema: z.object({
        type: z.enum(["income", "expense"]).optional().describe("Filter kategori berdasarkan tipe."),
      }),
    },
    async (args) => {
      try {
        const categories = await service.list(args.type);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(categories, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error list_categories: ${err.message}` }],
        };
      }
    }
  );

  // 2. Tool: create_category
  server.registerTool(
    "create_category",
    {
      description:
        "Membuat kategori keuangan baru (misal: 'Pemasukan Proyek', 'Biaya Operasional').",
      inputSchema: z.object({
        name: z.string().min(1).describe("Nama kategori."),
        type: z.enum(["income", "expense"]).describe("Tipe kategori ('income' atau 'expense')."),
        parentId: z.string().uuid().optional().describe("ID kategori induk (jika merupakan subkategori)."),
        description: z.string().optional().describe("Deskripsi tujuan kategori."),
      }),
    },
    async (args) => {
      try {
        const cat = await service.create(args as any);
        return {
          content: [
            {
              type: "text",
              text: `Kategori '${cat.name}' (${cat.type}) berhasil dibuat. ID: ${cat.id}`,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error create_category: ${err.message}` }],
        };
      }
    }
  );
}
