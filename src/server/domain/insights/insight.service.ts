import { AuthContext } from "@/server/auth/types";
import { TransactionDomainService } from "../transactions/transaction.service";
import { FundSourceDomainService } from "../fund-sources/fund-source.service";
import { CategoryDomainService } from "../categories/category.service";
import { BudgetDomainService } from "../budgets/budget.service";
import { ServerFinancialQueryEngine } from "./query-engine";
import { AIGateway } from "./ai-gateway";
import { FinancialAnalysisResponse } from "./insight.types";

export class FinancialInsightDomainService {
  constructor(private ctx: AuthContext) {}

  /**
   * Generates financial health snapshot, budget evaluations, and optional LLM insights
   */
  async getFinancialAnalysis(userPrompt?: string, targetMonth?: string): Promise<FinancialAnalysisResponse> {
    const txService = new TransactionDomainService(this.ctx);
    const fundService = new FundSourceDomainService(this.ctx);
    const catService = new CategoryDomainService(this.ctx);
    const budgetService = new BudgetDomainService(this.ctx);

    const targetDate = targetMonth ? new Date(`${targetMonth}-01`) : new Date();

    // Parallel fetch from domain services (respecting user RLS)
    const [transactions, fundSources, categories, budget] = await Promise.all([
      txService.list({ limit: 200 }),
      fundService.list(),
      catService.list(),
      budgetService.getOrCreateForMonth(targetDate),
    ]);

    // Compute deterministic snapshot
    const engine = new ServerFinancialQueryEngine(transactions, categories, fundSources, budget);
    const snapshot = engine.generateHealthSnapshot();

    // Optional LLM advice synthesis
    let aiInsightsText: string | undefined = undefined;
    if (userPrompt || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
      const prompt = `
Berikut adalah ringkasan keuangan bisnis saat ini:
- Total Saldo: Rp${snapshot.totalBalance.toLocaleString("id-ID")}
- Pemasukan Bulan Ini: Rp${snapshot.monthlyIncome.toLocaleString("id-ID")}
- Pengeluaran Bulan Ini: Rp${snapshot.monthlyExpense.toLocaleString("id-ID")}
- Arus Kas Bersih: Rp${snapshot.netCashflow.toLocaleString("id-ID")}
- Rasio Tabungan: ${snapshot.savingsRatePercentage}%
- Kategori Pengeluaran Teratas: ${snapshot.topExpenseCategories.map((c) => `${c.categoryName} (Rp${c.totalSpent.toLocaleString("id-ID")})`).join(", ")}
- Peringatan Anggaran: ${snapshot.budgetAlerts.map((b) => `${b.categoryName}: ${b.utilizationPercentage}% (${b.status})`).join(", ")}

Pertanyaan Pengguna: ${userPrompt || "Berikan evaluasi kesehatan finansial singkat dan 3 saran tindakan paling prioritas."}
      `.trim();

      const aiResponse = await AIGateway.analyzeFinancialData(prompt);
      if (aiResponse) {
        aiInsightsText = aiResponse;
      }
    }

    return {
      snapshot,
      aiInsightsText,
    };
  }
}
