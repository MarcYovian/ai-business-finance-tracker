import { AuthContext } from "@/server/auth/types";
import { AIGateway } from "../insights/ai-gateway";
import { TransactionDomainService } from "../transactions/transaction.service";
import { FundSourceDomainService } from "../fund-sources/fund-source.service";
import { CategoryDomainService } from "../categories/category.service";
import { BudgetDomainService } from "../budgets/budget.service";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequestDTO {
  messages?: ChatMessage[];
  message?: string;
  context?: Record<string, any>;
}

export interface ChatResponseDTO {
  reply: string;
  intent: string;
  classification?: Record<string, any>;
  dataSummary?: Record<string, any>;
  suggestedPrompts?: string[];
}

export class AIChatDomainService {
  constructor(private ctx: AuthContext) {}

  /**
   * Processes conversational chat and intent execution via server-side AI SDKs
   */
  async processChat(payload: ChatRequestDTO): Promise<ChatResponseDTO> {
    // 1. Extract user message
    let userPrompt = payload.message?.trim() || "";
    const conversationHistory: string[] = [];

    if (Array.isArray(payload.messages) && payload.messages.length > 0) {
      for (const m of payload.messages) {
        if (m.content) {
          conversationHistory.push(`${m.role || "user"}: ${m.content}`);
        }
      }
      if (!userPrompt) {
        const lastUser = [...payload.messages].reverse().find((m) => m.role === "user");
        userPrompt = lastUser ? lastUser.content.trim() : payload.messages[payload.messages.length - 1].content.trim();
      }
    }

    if (!userPrompt) {
      userPrompt = "Halo";
    }

    // 2. Fetch financial context from user's domain services
    const txService = new TransactionDomainService(this.ctx);
    const fundService = new FundSourceDomainService(this.ctx);
    const catService = new CategoryDomainService(this.ctx);
    const budgetService = new BudgetDomainService(this.ctx);

    const [transactions, fundSources, categories, budget] = await Promise.all([
      txService.list({ limit: 10 }),
      fundService.list(true),
      catService.list(),
      budgetService.getOrCreateForMonth(),
    ]);

    const totalBalance = fundSources.reduce((acc, f) => acc + (f.balance || 0), 0);
    const recentTxSummary = transactions.slice(0, 5).map((t) => `${t.description} (Rp${t.amount.toLocaleString("id-ID")})`).join(", ");

    // 3. Quick intent detection based on patterns
    const lowerPrompt = userPrompt.toLowerCase();
    let detectedIntent = "general_help";
    if (lowerPrompt.includes("catat") || lowerPrompt.includes("beli") || lowerPrompt.includes("bayar") || lowerPrompt.includes("transfer") || lowerPrompt.includes("pemasukan") || lowerPrompt.includes("pengeluaran")) {
      detectedIntent = "log_transaction";
    } else if (lowerPrompt.includes("budget") || lowerPrompt.includes("anggaran")) {
      detectedIntent = "query_budget";
    } else if (lowerPrompt.includes("saldo") || lowerPrompt.includes("rekening") || lowerPrompt.includes("berapa") || lowerPrompt.includes("laporan") || lowerPrompt.includes("transaksi")) {
      detectedIntent = "query_data";
    }

    // 4. Construct server prompt with financial context
    const systemInstructions = `Anda adalah asisten keuangan bisnis terpercaya (AI Finance Assistant).
Gaya komunikasi: santai, ramah, to-the-point, jelas, tanpa em-dash atau en-dash.
Data keuangan pengguna:
- Total Saldo Dompet: Rp${totalBalance.toLocaleString("id-ID")}
- Rekening Aktif: ${fundSources.map((f) => `${f.name}: Rp${f.balance.toLocaleString("id-ID")}`).join(", ") || "Belum ada rekening"}
- Kategori Tersedia: ${categories.map((c) => c.name).join(", ") || "Umum"}
- Budget Bulan Ini: Total Rencana Rp${budget.totalPlanned.toLocaleString("id-ID")}, Terpakai Rp${budget.totalSpent.toLocaleString("id-ID")}, Sisa Rp${budget.totalRemaining.toLocaleString("id-ID")}
- Transaksi Terakhir: ${recentTxSummary || "Belum ada transaksi"}

Riwayat Percakapan:
${conversationHistory.slice(-5).join("\n")}

Jawab pesan pengguna dengan akurat, lugas, dan santun.`;

    const fullPrompt = `${systemInstructions}\n\nUser: ${userPrompt}\nAssistant:`;

    // 5. Execute server-side AI if keys configured
    let aiReply: string | null = null;
    try {
      aiReply = await AIGateway.analyzeFinancialData(fullPrompt);
    } catch (err: any) {
      console.warn("Server AI Gateway execution note:", err?.message);
    }

    // Fallback if AI provider is not configured or fails
    if (!aiReply) {
      if (detectedIntent === "query_data" || lowerPrompt.includes("saldo")) {
        aiReply = `Total saldo aktif Anda saat ini adalah Rp${totalBalance.toLocaleString("id-ID")} tersebar di ${fundSources.length} akun/rekening.`;
      } else if (detectedIntent === "query_budget") {
        aiReply = `Budget bulan ini: Total Rp${budget.totalPlanned.toLocaleString("id-ID")}, telah terpakai Rp${budget.totalSpent.toLocaleString("id-ID")}, tersisa Rp${budget.totalRemaining.toLocaleString("id-ID")}.`;
      } else if (detectedIntent === "log_transaction") {
        aiReply = `Pesan Anda terdeteksi sebagai pencatatan transaksi: "${userPrompt}". Pastikan nominal, kategori, dan akun sumber dana sudah sesuai di menu pencatatan transaksi.`;
      } else {
        aiReply = `Halo! Saya asisten keuangan Anda. Saat ini total saldo akun Anda adalah Rp${totalBalance.toLocaleString("id-ID")}. Ada yang bisa saya bantu terkait transaksi, anggaran, atau rekening?`;
      }
    }

    return {
      reply: aiReply,
      intent: detectedIntent,
      classification: {
        intent: detectedIntent,
        confidence: 0.95,
      },
      dataSummary: {
        totalBalance,
        activeAccountsCount: fundSources.length,
        budgetPlanned: budget.totalPlanned,
        budgetSpent: budget.totalSpent,
      },
      suggestedPrompts: [
        "Berapa total saldo saya?",
        "Tampilkan status budget bulan ini",
        "Catat pengeluaran makan siang 35000",
      ],
    };
  }
}
