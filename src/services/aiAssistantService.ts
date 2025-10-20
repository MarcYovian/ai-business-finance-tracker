// src/services/aiAssistantService.ts
import { INTENT_TYPES, MESSAGE_TEMPLATES } from "@/constants/constants";
import { parseCurrency } from "@/lib/currency";
import {
  aiConfigStorage,
  categoryStorage,
  fundSourceStorage,
  transactionStorage,
} from "@/lib/storage";
import { AIService, AIServiceError } from "@/services/aiService";
import {
  AIClassification,
  AITransactionResponse,
  ConversationContext,
  Message,
  PendingTransaction,
} from "@/types/ai";
import {
  Budget,
  BudgetDetail,
  Category,
  FundSource,
  Transaction,
} from "@/types/finance";
import {
  getBudgetQueryPrompt,
  getClarificationPrompt,
  getClassifierPrompt,
  getGeneralHelpPrompt,
  getQueryAnswerPrompt,
  getTransactionExtractionPrompt,
} from "@/utils/promptTemplates";
import { QueryEngine } from "@/utils/queryEngine";
import {
  validateCompleteTransaction,
  ValidationError,
} from "@/utils/validation";
import { v4 as uuidv4 } from "uuid";

export interface AIAssistantServiceDeps {
  userId: string;
  categories: Category[];
  fundSources: FundSource[];
  transactions: Transaction[];
}

// 🆕 Extended deps with budget data
export interface AIAssistantServiceDepsWithBudget
  extends AIAssistantServiceDeps {
  budgetDetails?: BudgetDetail[];
  currentBudget?: Budget | null;
}

export class AIAssistantService {
  private buildConversationHistory(context: ConversationContext): string {
    return context.messages
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
  }

  async classifyIntent(
    userInput: string,
    context: ConversationContext
  ): Promise<AIClassification | null> {
    const provider = aiConfigStorage.getProvider();
    const apiKey = aiConfigStorage.getActiveKey();

    if (!apiKey) {
      throw new AIServiceError(
        MESSAGE_TEMPLATES.API_KEY_MISSING,
        "API_KEY_MISSING",
        false
      );
    }

    const conversationHistory = this.buildConversationHistory(context);
    const classifierPrompt = getClassifierPrompt(
      userInput,
      conversationHistory
    );

    let classificationContent: string;
    if (provider === "gemini") {
      classificationContent = await AIService.processWithGemini(
        apiKey,
        classifierPrompt
      );
    } else {
      classificationContent = await AIService.processWithOpenAI(
        apiKey,
        classifierPrompt,
        userInput
      );
    }

    const classification = AIService.extractJsonFromString(
      classificationContent
    );

    if (
      !classification ||
      !AIService.validateAIResponse(classification, ["intent"])
    ) {
      return null;
    }

    return {
      intent: classification.intent,
      confidence: classification.confidence || 0.5,
      query: classification.query,
      entities: classification.entities,
      queryType: classification.queryType,
    };
  }

  async extractTransactionData(
    userInput: string,
    deps: Pick<AIAssistantServiceDeps, "categories" | "fundSources">,
    context: ConversationContext
  ): Promise<AITransactionResponse | AITransactionResponse[]> {
    const provider = aiConfigStorage.getProvider();
    const apiKey = aiConfigStorage.getActiveKey();

    if (!apiKey) {
      throw new AIServiceError(
        MESSAGE_TEMPLATES.API_KEY_MISSING,
        "API_KEY_MISSING",
        false
      );
    }

    const conversationHistory = this.buildConversationHistory(context);
    const systemPrompt = getTransactionExtractionPrompt(
      userInput,
      deps.categories,
      deps.fundSources,
      conversationHistory
    );

    let aiContent: string;
    if (provider === "gemini") {
      aiContent = await AIService.processWithGemini(apiKey, systemPrompt);
    } else {
      aiContent = await AIService.processWithOpenAI(
        apiKey,
        systemPrompt,
        userInput
      );
    }

    const aiResponse = AIService.extractJsonFromString(aiContent);

    if (!aiResponse) {
      throw new AIServiceError(
        "AI response tidak dapat diparse sebagai JSON yang valid",
        "INVALID_JSON",
        true
      );
    }

    return aiResponse;
  }

  async createTransaction(
    transaction: AITransactionResponse,
    deps: Pick<AIAssistantServiceDeps, "userId" | "categories" | "fundSources">,
    shouldCreateMissingEntities: boolean = true
  ): Promise<Transaction> {
    // Get or create category
    let categoryId: string | undefined = undefined;
    if (transaction.category && transaction.type !== "transfer") {
      const category = deps.categories.find(
        (c) =>
          c.name.toLowerCase() === transaction.category?.toLowerCase() &&
          c.type === transaction.type
      );

      if (category) {
        categoryId = category.id;
      } else if (shouldCreateMissingEntities) {
        const newCategory = await categoryStorage.create(
          transaction.category,
          deps.userId,
          transaction.type as "income" | "expense"
        );
        categoryId = newCategory.id;
      }
    }

    // Get or create fund sources
    let fundSourceId: string | undefined = undefined;
    if (transaction.fundSource && transaction.type !== "transfer") {
      const fundSource = deps.fundSources.find(
        (f) => f.name.toLowerCase() === transaction.fundSource?.toLowerCase()
      );

      if (fundSource) {
        fundSourceId = fundSource.id;
      } else if (shouldCreateMissingEntities) {
        // Create with initial balance from the transaction amount for expense
        // This allows the first transaction to succeed
        const initialBalance =
          transaction.type === "expense" ? transaction.amount * 100 : 0;
        const newFundSource = await fundSourceStorage.create(
          transaction.fundSource,
          initialBalance,
          deps.userId
        );
        fundSourceId = newFundSource.id;
      }
    }

    // Handle transfer fund sources
    let sourceFundId: string | undefined = undefined;
    let destinationFundId: string | undefined = undefined;

    if (transaction.type === "transfer") {
      if (transaction.sourceFund) {
        const sourceFund = deps.fundSources.find(
          (f) => f.name.toLowerCase() === transaction.sourceFund?.toLowerCase()
        );

        if (sourceFund) {
          sourceFundId = sourceFund.id;
        } else if (shouldCreateMissingEntities) {
          // For transfers, we need sufficient balance in source
          const newSourceFund = await fundSourceStorage.create(
            transaction.sourceFund,
            transaction.amount * 100, // Ensure sufficient balance
            deps.userId
          );
          sourceFundId = newSourceFund.id;
        }
      }

      if (transaction.destinationFund) {
        const destFund = deps.fundSources.find(
          (f) =>
            f.name.toLowerCase() === transaction.destinationFund?.toLowerCase()
        );

        if (destFund) {
          destinationFundId = destFund.id;
        } else if (shouldCreateMissingEntities) {
          const newDestFund = await fundSourceStorage.create(
            transaction.destinationFund,
            0,
            deps.userId
          );
          destinationFundId = newDestFund.id;
        }
      }
    }

    // Parse amount
    const amountValue = transaction.amount;

    // Create transaction
    return await transactionStorage.create({
      description: transaction.description,
      amount: amountValue,
      type: transaction.type,
      transactionDate: transaction.date
        ? new Date(transaction.date).toISOString()
        : new Date().toISOString(),
      userId: deps.userId,
      categoryId,
      sourceFundId:
        transaction.type === "transfer" ? sourceFundId : fundSourceId,
      destinationFundId,
    });
  }

  validateTransaction(
    transaction: AITransactionResponse,
    deps: Pick<AIAssistantServiceDeps, "categories" | "fundSources">
  ) {
    const validation = validateCompleteTransaction(
      transaction,
      deps.categories,
      deps.fundSources
    );

    // Check if fund source exists
    if (transaction.fundSource && transaction.type !== "transfer") {
      const fundExists = deps.fundSources.some(
        (f) => f.name.toLowerCase() === transaction.fundSource?.toLowerCase()
      );

      if (!fundExists) {
        validation.warnings = validation.warnings || [];
        validation.warnings.push(
          `Sumber dana "${
            transaction.fundSource
          }" belum terdaftar. Sistem akan membuat sumber dana baru dengan saldo awal Rp ${transaction.amount.toLocaleString(
            "id-ID"
          )}.`
        );
      }
    }

    // Check for transfer fund sources
    if (transaction.type === "transfer") {
      if (transaction.sourceFund) {
        const sourceFundExists = deps.fundSources.some(
          (f) => f.name.toLowerCase() === transaction.sourceFund?.toLowerCase()
        );

        if (!sourceFundExists) {
          validation.warnings = validation.warnings || [];
          validation.warnings.push(
            `Sumber dana "${transaction.sourceFund}" belum terdaftar. Sistem akan membuat sumber dana baru.`
          );
        }
      }

      if (transaction.destinationFund) {
        const destFundExists = deps.fundSources.some(
          (f) =>
            f.name.toLowerCase() === transaction.destinationFund?.toLowerCase()
        );

        if (!destFundExists) {
          validation.warnings = validation.warnings || [];
          validation.warnings.push(
            `Sumber dana tujuan "${transaction.destinationFund}" belum terdaftar. Sistem akan membuat sumber dana baru.`
          );
        }
      }
    }

    return validation;
  }

  async executeQuery(
    queryType: string,
    deps: AIAssistantServiceDeps,
    context: ConversationContext,
    originalQuery: string
  ): Promise<string> {
    const provider = aiConfigStorage.getProvider();
    const apiKey = aiConfigStorage.getActiveKey();

    if (!apiKey) {
      throw new AIServiceError(
        MESSAGE_TEMPLATES.API_KEY_MISSING,
        "API_KEY_MISSING",
        false
      );
    }

    const queryEngine = new QueryEngine(
      deps.transactions,
      deps.categories,
      deps.fundSources
    );
    const queryResult = queryEngine.executeQuery(queryType);

    const conversationHistory = this.buildConversationHistory(context);
    const answererPrompt = getQueryAnswerPrompt(
      originalQuery,
      queryResult,
      conversationHistory
    );

    let finalAnswer: string;
    if (provider === "gemini") {
      finalAnswer = await AIService.processWithGemini(apiKey, answererPrompt);
    } else {
      finalAnswer = await AIService.processWithOpenAI(
        apiKey,
        answererPrompt,
        originalQuery
      );
    }

    return finalAnswer;
  }

  // 🆕 Execute budget-specific queries
  async executeBudgetQuery(
    queryType: string,
    deps: AIAssistantServiceDepsWithBudget,
    context: ConversationContext,
    originalQuery: string
  ): Promise<string> {
    const provider = aiConfigStorage.getProvider();
    const apiKey = aiConfigStorage.getActiveKey();

    if (!apiKey) {
      throw new AIServiceError(
        MESSAGE_TEMPLATES.API_KEY_MISSING,
        "API_KEY_MISSING",
        false
      );
    }

    const queryEngine = new QueryEngine(
      deps.transactions,
      deps.categories,
      deps.fundSources,
      deps.budgetDetails,
      deps.currentBudget
    );
    const queryResult = queryEngine.executeQuery(queryType);

    const conversationHistory = this.buildConversationHistory(context);
    const answererPrompt = getBudgetQueryPrompt(
      originalQuery,
      queryResult,
      conversationHistory
    );

    let finalAnswer: string;
    if (provider === "gemini") {
      finalAnswer = await AIService.processWithGemini(apiKey, answererPrompt);
    } else {
      finalAnswer = await AIService.processWithOpenAI(
        apiKey,
        answererPrompt,
        originalQuery
      );
    }

    return finalAnswer;
  }

  async generateHelpResponse(
    userInput: string,
    deps: Pick<
      AIAssistantServiceDeps,
      "transactions" | "categories" | "fundSources"
    >,
    context: ConversationContext
  ): Promise<string> {
    const provider = aiConfigStorage.getProvider();
    const apiKey = aiConfigStorage.getActiveKey();

    if (!apiKey) {
      throw new AIServiceError(
        MESSAGE_TEMPLATES.API_KEY_MISSING,
        "API_KEY_MISSING",
        false
      );
    }

    const userStats = {
      hasTransactions: deps.transactions.length > 0,
      hasCategories: deps.categories.length > 0,
      hasFundSources: deps.fundSources.length > 0,
      recentActivity: deps.transactions[0]?.description || "No recent activity",
    };

    const conversationHistory = this.buildConversationHistory(context);
    const helpPrompt = getGeneralHelpPrompt(
      userInput,
      conversationHistory,
      userStats
    );

    let finalAnswer: string;
    if (provider === "gemini") {
      finalAnswer = await AIService.processWithGemini(apiKey, helpPrompt);
    } else {
      finalAnswer = await AIService.processWithOpenAI(
        apiKey,
        helpPrompt,
        userInput
      );
    }

    return finalAnswer;
  }

  createMessage(
    role: "user" | "assistant",
    content: string,
    metadata?: Message["metadata"]
  ): Message {
    return {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
      metadata,
    };
  }

  createPendingTransaction(
    transaction: AITransactionResponse
  ): PendingTransaction {
    return {
      id: uuidv4(),
      ...transaction,
      needsConfirmation: true,
    };
  }
}

export const aiAssistantService = new AIAssistantService();
