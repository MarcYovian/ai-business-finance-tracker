import {
  INTENT_TYPES,
  MESSAGE_TEMPLATES,
  SUGGESTED_PROMPTS,
} from "@/constants/constants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { parseCurrency } from "@/lib/currency";
import {
  enhancedCategoryStorage,
  enhancedFundSourceStorage,
  enhancedTransactionStorage,
} from "@/lib/enhancedStorage";
import { aiConfigStorage } from "@/lib/storage";
import { AIService, AIServiceError } from "@/services/aiService";
import {
  AIClassification,
  AITransactionResponse,
  ConversationContext,
  Message,
  PendingTransaction,
} from "@/types/ai";
import {
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
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export const useAIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: "assistant",
      content: MESSAGE_TEMPLATES.WELCOME,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] =
    useState<ConversationContext>({
      messages: [],
      lastIntent: undefined,
    });
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(
    SUGGESTED_PROMPTS.TRANSACTION
  );

  // Add user message to conversation
  const addUserMessage = (content: string) => {
    const message: Message = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
    updateConversationContext(message);
  };

  // Add assistant message to conversation
  const addAssistantMessage = (
    content: string,
    metadata?: Message["metadata"]
  ) => {
    const message: Message = {
      id: uuidv4(),
      role: "assistant",
      content,
      timestamp: new Date(),
      metadata,
    };
    setMessages((prev) => [...prev, message]);
    updateConversationContext(message);
  };

  // Update conversation context with message history
  const updateConversationContext = (message: Message) => {
    setConversationContext((prev) => {
      const newMessages = [...prev.messages, message].slice(-10); // Keep last 10 messages
      return {
        ...prev,
        messages: newMessages,
      };
    });
  };

  // Build conversation history for context
  const buildConversationHistory = (): string => {
    return conversationContext.messages
      .slice(-6) // Last 6 messages for context
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
  };

  // Main send handler
  const handleSend = async (prompt?: string) => {
    const userMessage = (prompt || input).trim();
    if (!userMessage) return;

    addUserMessage(userMessage);
    setInput("");
    setIsLoading(true);

    const startTime = Date.now();

    try {
      await processAIResponse(userMessage);
    } catch (error) {
      console.error("AI processing error:", error);

      let errorMessage = MESSAGE_TEMPLATES.ERROR_PROCESSING;
      if (error instanceof AIServiceError) {
        errorMessage = error.message;
      } else if (error instanceof ValidationError) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      addAssistantMessage(errorMessage);
    } finally {
      setIsLoading(false);
      const processingTime = Date.now() - startTime;
      console.log(`Processing completed in ${processingTime}ms`);
    }
  };

  // Main AI response processor
  const processAIResponse = async (userInput: string) => {
    if (!user) return;

    const provider = aiConfigStorage.getProvider();
    const apiKey = aiConfigStorage.getActiveKey();

    if (!apiKey) {
      addAssistantMessage(MESSAGE_TEMPLATES.API_KEY_MISSING);
      return;
    }

    // Step 1: Classify intent
    const classification = await classifyIntent(userInput, apiKey, provider);

    if (!classification || !classification.intent) {
      addAssistantMessage(MESSAGE_TEMPLATES.UNKNOWN_INTENT);
      return;
    }

    // Update context with detected intent
    setConversationContext((prev) => ({
      ...prev,
      lastIntent: classification.intent,
    }));

    // Step 2: Route to appropriate handler
    switch (classification.intent) {
      case INTENT_TYPES.LOG_TRANSACTION:
        await handleLogTransaction(userInput, apiKey, provider);
        break;

      case INTENT_TYPES.QUERY_DATA:
        await handleQueryData(
          userInput,
          classification.query || "",
          classification.queryType || "",
          apiKey,
          provider
        );
        break;

      case INTENT_TYPES.CONFIRM_TRANSACTION:
        await handleConfirmTransaction();
        break;

      case INTENT_TYPES.CANCEL_TRANSACTION:
        handleCancelTransaction();
        break;

      case INTENT_TYPES.GENERAL_HELP:
        handleGeneralHelp(userInput, apiKey, provider);
        break;

      default:
        addAssistantMessage(MESSAGE_TEMPLATES.UNKNOWN_INTENT);
    }
  };

  // Intent classification with confidence scoring
  const classifyIntent = async (
    userInput: string,
    apiKey: string,
    provider: "openai" | "gemini"
  ): Promise<AIClassification | null> => {
    const conversationHistory = buildConversationHistory();
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
  };

  // Handle transaction logging with validation and confirmation
  const handleLogTransaction = async (
    userInput: string,
    apiKey: string,
    provider: "openai" | "gemini"
  ) => {
    if (!user) return;

    const [categories, fundSources] = await Promise.all([
      enhancedCategoryStorage.getAll(user.id),
      enhancedFundSourceStorage.getAll(user.id),
    ]);

    const conversationHistory = buildConversationHistory();
    const systemPrompt = getTransactionExtractionPrompt(
      userInput,
      categories,
      fundSources,
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

    const aiResponse: AITransactionResponse | AITransactionResponse[] | null =
      AIService.extractJsonFromString(aiContent);

    if (!aiResponse) {
      throw new AIServiceError(
        "AI response tidak dapat diparse sebagai JSON yang valid",
        "INVALID_JSON",
        true
      );
    }

    const transactions = Array.isArray(aiResponse) ? aiResponse : [aiResponse];

    for (const transaction of transactions) {
      // Validate transaction
      const validation = validateCompleteTransaction(
        transaction,
        categories,
        fundSources
      );

      // Check if transaction needs confirmation or clarification
      if (
        !validation.isValid ||
        transaction.confidence < 0.8 ||
        transaction.missingFields?.length
      ) {
        await handleTransactionClarification(
          transaction,
          validation,
          categories,
          fundSources
        );
        return;
      }

      // Auto-create category if needed
      let categoryId = transaction.category;
      if (transaction.category && transaction.type !== "transfer") {
        const category = await enhancedCategoryStorage.findOrCreate(
          transaction.category,
          user.id,
          transaction.type as "income" | "expense"
        );
        categoryId = category.id;
      }

      // Auto-create fund source if needed (only for new ones with warning)
      let fundSourceId = transaction.fundSource;
      if (transaction.fundSource && transaction.type !== "transfer") {
        const fundSource = await enhancedFundSourceStorage.findOrCreate(
          transaction.fundSource,
          user.id,
          0
        );
        fundSourceId = fundSource.id;
      }

      // Handle transfer fund sources
      let sourceFundId = transaction.sourceFund;
      let destinationFundId = transaction.destinationFund;
      if (transaction.type === "transfer") {
        if (transaction.sourceFund) {
          const sourceFund = await enhancedFundSourceStorage.findOrCreate(
            transaction.sourceFund,
            user.id,
            0
          );
          sourceFundId = sourceFund.id;
        }
        if (transaction.destinationFund) {
          const destFund = await enhancedFundSourceStorage.findOrCreate(
            transaction.destinationFund,
            user.id,
            0
          );
          destinationFundId = destFund.id;
        }
      }

      // Parse amount to cents
      const amountInCents = parseCurrency(transaction.amount.toString());

      // Create transaction
      await enhancedTransactionStorage.create({
        description: transaction.description,
        amount: amountInCents,
        type: transaction.type,
        transactionDate: transaction.date
          ? new Date(transaction.date).toISOString()
          : new Date().toISOString(),
        userId: user.id,
        categoryId: categoryId || null,
        sourceFundId:
          transaction.type === "transfer" ? sourceFundId : fundSourceId,
        destinationFundId: destinationFundId || null,
      });

      // Show success message with details
      const successMessage = `✅ ${
        MESSAGE_TEMPLATES.TRANSACTION_SUCCESS
      }\n\n📝 Detail:\n- Tipe: ${
        transaction.type
      }\n- Jumlah: Rp ${transaction.amount.toLocaleString(
        "id-ID"
      )}\n- Deskripsi: ${transaction.description}\n- Tanggal: ${new Date(
        transaction.date
      ).toLocaleDateString("id-ID")}`;

      addAssistantMessage(successMessage);

      toast({
        title: "Transaksi Berhasil",
        description: `${
          transaction.description
        } - Rp ${transaction.amount.toLocaleString("id-ID")}`,
      });

      // Update suggested prompts to queries after successful transaction
      setSuggestedPrompts(SUGGESTED_PROMPTS.QUERY);
    }
  };

  // Handle transaction that needs clarification
  const handleTransactionClarification = async (
    transaction: AITransactionResponse,
    validation: any,
    categories: any[],
    fundSources: any[]
  ) => {
    if (!user) return;

    // Store pending transaction in context
    const pendingTransaction: PendingTransaction = {
      id: uuidv4(),
      ...transaction,
      needsConfirmation: true,
    };

    setConversationContext((prev) => ({
      ...prev,
      pendingTransaction,
    }));

    // Build clarification message
    let clarificationMessage = MESSAGE_TEMPLATES.CONFIRMATION_REQUIRED + "\n\n";
    clarificationMessage += `- Tipe: ${transaction.type}\n`;
    clarificationMessage += `- Jumlah: Rp ${transaction.amount.toLocaleString(
      "id-ID"
    )}\n`;
    clarificationMessage += `- Deskripsi: ${transaction.description}\n`;
    clarificationMessage += `- Tanggal: ${new Date(
      transaction.date
    ).toLocaleDateString("id-ID")}\n`;

    if (transaction.category) {
      clarificationMessage += `- Kategori: ${transaction.category}\n`;
    }
    if (transaction.fundSource) {
      clarificationMessage += `- Sumber Dana: ${transaction.fundSource}\n`;
    }

    if (validation.warnings && validation.warnings.length > 0) {
      clarificationMessage += `\n⚠️ Peringatan:\n${validation.warnings
        .map((w: string) => `- ${w}`)
        .join("\n")}\n`;
    }

    if (!validation.isValid) {
      clarificationMessage += `\n❌ Error:\n${validation.errors
        .map((e: string) => `- ${e}`)
        .join("\n")}\n`;
      clarificationMessage +=
        "\nSilakan perbaiki informasi yang kurang atau salah.";
    } else if (transaction.missingFields?.length) {
      clarificationMessage += `\n❓ Informasi yang kurang:\n${transaction.missingFields
        .map((f) => `- ${f}`)
        .join("\n")}\n`;
      clarificationMessage += "\nSilakan lengkapi informasi yang kurang.";
    } else {
      clarificationMessage += "\nApakah informasi ini sudah benar? (Ya/Tidak)";
    }

    addAssistantMessage(clarificationMessage);
  };

  // Handle confirmation of pending transaction
  const handleConfirmTransaction = async () => {
    if (!user || !conversationContext.pendingTransaction) {
      addAssistantMessage("Tidak ada transaksi yang menunggu konfirmasi.");
      return;
    }

    const pending = conversationContext.pendingTransaction;

    try {
      const [categories, fundSources] = await Promise.all([
        enhancedCategoryStorage.getAll(user.id),
        enhancedFundSourceStorage.getAll(user.id),
      ]);

      // Get or create category
      let categoryId = pending.category;
      if (pending.category && pending.type !== "transfer") {
        const category = await enhancedCategoryStorage.findOrCreate(
          pending.category,
          user.id,
          pending.type as "income" | "expense"
        );
        categoryId = category.id;
      }

      // Get or create fund sources
      let fundSourceId = pending.fundSource;
      if (pending.fundSource && pending.type !== "transfer") {
        const fundSource = await enhancedFundSourceStorage.findOrCreate(
          pending.fundSource,
          user.id,
          0
        );
        fundSourceId = fundSource.id;
      }

      let sourceFundId = pending.sourceFund;
      let destinationFundId = pending.destinationFund;
      if (pending.type === "transfer") {
        if (pending.sourceFund) {
          const sourceFund = await enhancedFundSourceStorage.findOrCreate(
            pending.sourceFund,
            user.id,
            0
          );
          sourceFundId = sourceFund.id;
        }
        if (pending.destinationFund) {
          const destFund = await enhancedFundSourceStorage.findOrCreate(
            pending.destinationFund,
            user.id,
            0
          );
          destinationFundId = destFund.id;
        }
      }

      // Parse amount to cents
      const amountInCents = parseCurrency(pending.amount.toString());

      // Create transaction
      await enhancedTransactionStorage.create({
        description: pending.description,
        amount: amountInCents,
        type: pending.type,
        transactionDate: pending.date
          ? new Date(pending.date).toISOString()
          : new Date().toISOString(),
        userId: user.id,
        categoryId: categoryId || null,
        sourceFundId: pending.type === "transfer" ? sourceFundId : fundSourceId,
        destinationFundId: destinationFundId || null,
      });

      // Clear pending transaction
      setConversationContext((prev) => ({
        ...prev,
        pendingTransaction: undefined,
      }));

      addAssistantMessage(
        `✅ Transaksi berhasil dikonfirmasi dan dicatat!\n\n${
          pending.description
        } - Rp ${pending.amount.toLocaleString("id-ID")}`
      );

      toast({
        title: "Transaksi Dikonfirmasi",
        description: `${
          pending.description
        } - Rp ${pending.amount.toLocaleString("id-ID")}`,
      });

      setSuggestedPrompts(SUGGESTED_PROMPTS.QUERY);
    } catch (error: any) {
      console.error("Error confirming transaction:", error);
      addAssistantMessage(`Gagal mengkonfirmasi transaksi: ${error.message}`);
    }
  };

  // Handle cancellation of pending transaction
  const handleCancelTransaction = () => {
    if (!conversationContext.pendingTransaction) {
      addAssistantMessage("Tidak ada transaksi yang menunggu konfirmasi.");
      return;
    }

    setConversationContext((prev) => ({
      ...prev,
      pendingTransaction: undefined,
    }));

    addAssistantMessage("Transaksi dibatalkan. Ada yang bisa saya bantu lagi?");
    setSuggestedPrompts([
      ...SUGGESTED_PROMPTS.TRANSACTION,
      ...SUGGESTED_PROMPTS.QUERY,
    ]);
  };

  // Handle data queries with advanced query engine
  const handleQueryData = async (
    originalQuery: string,
    query: string,
    queryType: string,
    apiKey: string,
    provider: "openai" | "gemini"
  ) => {
    if (!user) return;

    const [transactions, categories, fundSources] = await Promise.all([
      enhancedTransactionStorage.getAll(user.id),
      enhancedCategoryStorage.getAll(user.id),
      enhancedFundSourceStorage.getAll(user.id),
    ]);

    // Use Query Engine to process the query
    const queryEngine = new QueryEngine(transactions, categories, fundSources);
    const queryResult = queryEngine.executeQuery(queryType);

    // Generate natural language answer using AI
    const conversationHistory = buildConversationHistory();
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

    addAssistantMessage(finalAnswer, {
      intent: INTENT_TYPES.QUERY_DATA,
    });

    // Update suggested prompts based on query
    setSuggestedPrompts(SUGGESTED_PROMPTS.QUERY);
  };

  // Handle general help
  const handleGeneralHelp = async (
    userInput: string,
    apiKey: string,
    provider: "openai" | "gemini"
  ) => {
    if (!user) return;

    const [transactions, categories, fundSources] = await Promise.all([
      enhancedTransactionStorage.getAll(user.id, false), // `false` to ensure fresh data
      enhancedCategoryStorage.getAll(user.id),
      enhancedFundSourceStorage.getAll(user.id),
    ]);

    const userStats = {
      hasTransactions: transactions.length > 0,
      hasCategories: categories.length > 0,
      hasFundSources: fundSources.length > 0,
      recentActivity: transactions[0]?.description || "No recent activity",
    };

    // 2. Build the prompt
    const conversationHistory = buildConversationHistory();
    const helpPrompt = getGeneralHelpPrompt(
      userInput,
      conversationHistory,
      userStats
    );

    // 3. Call the AI service
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

    // 4. Add the dynamic response to the chat
    addAssistantMessage(finalAnswer, {
      intent: INTENT_TYPES.GENERAL_HELP,
    });

    // 5. Suggest next actions
    setSuggestedPrompts([
      ...SUGGESTED_PROMPTS.TRANSACTION,
      ...SUGGESTED_PROMPTS.QUERY,
    ]);
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([
      {
        id: uuidv4(),
        role: "assistant",
        content: MESSAGE_TEMPLATES.WELCOME,
        timestamp: new Date(),
      },
    ]);
    setConversationContext({
      messages: [],
      lastIntent: undefined,
    });
    setSuggestedPrompts(SUGGESTED_PROMPTS.TRANSACTION);
  };

  return {
    messages,
    input,
    isLoading,
    suggestedPrompts,
    pendingTransaction: conversationContext.pendingTransaction,
    handleSend,
    setInput,
    handleKeyPress,
    clearConversation,
  };
};
