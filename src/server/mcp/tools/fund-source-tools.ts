import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AuthContext } from "@/server/auth/types";
import { FundSourceDomainService } from "@/server/domain/fund-sources/fund-source.service";

export function registerFundSourceTools(server: McpServer, ctx: AuthContext) {
  const service = new FundSourceDomainService(ctx);

  // 1. Tool: list_fund_sources
  server.registerTool(
    "list_fund_sources",
    {
      description:
        "Mendapatkan daftar seluruh akun sumber dana (rekening bank, kas tunai, dompet digital) beserta saldo saat ini.",
      inputSchema: z.object({
        activeOnly: z.boolean().optional().default(true).describe("Hanya tampilkan akun yang aktif."),
      }),
    },
    async (args) => {
      try {
        const accounts = await service.list(args.activeOnly);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(accounts, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error list_fund_sources: ${err.message}` }],
        };
      }
    }
  );

  // 2. Tool: get_balance
  server.registerTool(
    "get_balance",
    {
      description:
        "Melihat ringkasan total saldo kas bisnis saat ini, dikelompokkan berdasarkan tipe akun (bank, cash, e-wallet, credit_card).",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const summary = await service.getBalanceSummary();
        return {
          content: [
            {
              type: "text",
              text: `Total Saldo Kas Bisnis: Rp${summary.totalBalance.toLocaleString("id-ID")}\n` +
                `- Bank: Rp${summary.byType.bank.toLocaleString("id-ID")}\n` +
                `- Kas Tunai: Rp${summary.byType.cash.toLocaleString("id-ID")}\n` +
                `- Dompet Digital: Rp${summary.byType["e-wallet"].toLocaleString("id-ID")}\n` +
                `- Kartu Kredit: Rp${summary.byType.credit_card.toLocaleString("id-ID")}\n` +
                `Jumlah Akun Aktif: ${summary.accountCount}`,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error get_balance: ${err.message}` }],
        };
      }
    }
  );
}
