import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AuthContext } from "@/server/auth/types";
import { FinancialInsightDomainService } from "@/server/domain/insights/insight.service";

export function registerInsightTools(server: McpServer, ctx: AuthContext) {
  const service = new FinancialInsightDomainService(ctx);

  server.registerTool(
    "query_financial_insights",
    {
      description:
        "Menganalisis status kesehatan keuangan bisnis, kepatuhan anggaran (budget), kategori pengeluaran terbesar, dan saran optimasi arus kas.",
      inputSchema: z.object({
        query: z.string().optional().describe("Pertanyaan finansial spesifik pengguna."),
        month: z.string().optional().describe("Bulan target format YYYY-MM (default: bulan berjalan)."),
      }),
    },
    async (args) => {
      try {
        const result = await service.getFinancialAnalysis(args.query, args.month);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error query_financial_insights: ${err.message}` }],
        };
      }
    }
  );
}
