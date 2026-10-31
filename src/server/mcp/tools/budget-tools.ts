import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AuthContext } from "@/server/auth/types";
import { BudgetDomainService } from "@/server/domain/budgets/budget.service";

export function registerBudgetTools(server: McpServer, ctx: AuthContext) {
  const service = new BudgetDomainService(ctx);

  // 1. Tool: get_budget
  server.registerTool(
    "get_budget",
    {
      description:
        "Melihat status anggaran (budget) bulanan pengguna, termasuk alokasi per kategori, realisasi belanja, dan sisa anggaran.",
      inputSchema: z.object({
        month: z.string().optional().describe("Bulan format YYYY-MM (default: bulan berjalan)."),
      }),
    },
    async (args) => {
      try {
        const budget = await service.getOrCreateForMonth(args.month);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(budget, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error get_budget: ${err.message}` }],
        };
      }
    }
  );

  // 2. Tool: upsert_budget
  server.registerTool(
    "upsert_budget",
    {
      description:
        "Membuat atau memperbarui batas anggaran bulanan beserta alokasi kategori-kategorinya secara atomik.",
      inputSchema: z.object({
        name: z.string().min(1).describe("Nama anggaran, misal: 'Anggaran Operasional November 2026'."),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Tanggal awal YYYY-MM-DD."),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Tanggal akhir YYYY-MM-DD."),
        items: z.array(
          z.object({
            categoryId: z.string().uuid().describe("ID Kategori yang dialokasikan."),
            amount: z.number().nonnegative().describe("Nominal anggaran dalam Rupiah."),
          })
        ).describe("Daftar alokasi kategori."),
      }),
    },
    async (args) => {
      try {
        const budget = await service.upsert(args as any);
        return {
          content: [
            {
              type: "text",
              text: `Anggaran '${budget.name}' berhasil disimpan. Total batas anggaran: Rp${budget.totalPlanned.toLocaleString("id-ID")}.`,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error upsert_budget: ${err.message}` }],
        };
      }
    }
  );
}
