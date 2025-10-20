import {
  BUDGET_THRESHOLDS,
  INTENT_TYPES,
  MESSAGE_TEMPLATES,
  SUGGESTED_PROMPTS,
} from "@/constants/constants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { aiAssistantService } from "@/services/aiAssistantService";
import { AIServiceError } from "@/services/aiService";
import { ConversationContext, Message } from "@/types/ai";
import { ValidationError } from "@/utils/validation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useBudgetDetails, useCurrentBudget } from "./useBudget";
import { useCategories } from "./useCategories";
import { useFundSources } from "./useFundSources";
import { useTransactions } from "./useTransactions";

export const useAIAssistant = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch data using TanStack Query
  const { data: transactions = [] } = useTransactions(user?.id || "");
  const { data: categories = [] } = useCategories(user?.id || "");
  const { data: fundSources = [] } = useFundSources(user?.id || "");
  const { data: currentBudget } = useCurrentBudget(new Date());
  const { data: budgetDetails = [] } = useBudgetDetails(currentBudget?.id);

  const [messages, setMessages] = useState<Message[]>([
    aiAssistantService.createMessage("assistant", MESSAGE_TEMPLATES.WELCOME),
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
    const message = aiAssistantService.createMessage("user", content);
    setMessages((prev) => [...prev, message]);
    updateConversationContext(message);
  };

  // Add assistant message to conversation
  const addAssistantMessage = (
    content: string,
    metadata?: Message["metadata"]
  ) => {
    const message = aiAssistantService.createMessage(
      "assistant",
      content,
      metadata
    );
    setMessages((prev) => [...prev, message]);
    updateConversationContext(message);
  };

  // Update conversation context with message history
  const updateConversationContext = (message: Message) => {
    setConversationContext((prev) => {
      const newMessages = [...prev.messages, message].slice(-10);
      return {
        ...prev,
        messages: newMessages,
      };
    });
  };

  // 🆕 Check budget impact before transaction
  const checkBudgetImpact = (transaction: any): string | null => {
    if (!currentBudget || !budgetDetails.length) return null;
    if (transaction.type !== "expense" || !transaction.category) return null;

    const category = categories.find(
      (c) =>
        c.name.toLowerCase() === transaction.category?.toLowerCase() &&
        c.type === "expense"
    );

    if (!category) return null;

    const budgetDetail = budgetDetails.find(
      (bd) => bd.category_id === category.id
    );
    if (!budgetDetail) return null;

    const currentSpent = budgetDetail.spent / 100;
    const budgetAmount = budgetDetail.amount / 100;
    const newTotal = currentSpent + transaction.amount;
    const utilization = (newTotal / budgetAmount) * 100;

    if (newTotal > budgetAmount) {
      const excess = newTotal - budgetAmount;
      return `🔴 ${
        MESSAGE_TEMPLATES.BUDGET_EXCEEDED
      }\nTransaksi ini akan melebihi budget "${
        transaction.category
      }" sebesar Rp ${excess.toLocaleString(
        "id-ID"
      )}.\n\nBudget: Rp ${budgetAmount.toLocaleString(
        "id-ID"
      )}\nSudah terpakai: Rp ${currentSpent.toLocaleString(
        "id-ID"
      )}\nTotal setelah transaksi: Rp ${newTotal.toLocaleString(
        "id-ID"
      )} (${utilization.toFixed(1)}%)\nKelebihan: Rp ${excess.toLocaleString(
        "id-ID"
      )}`;
    } else if (utilization > BUDGET_THRESHOLDS.WARNING * 100) {
      const remaining = budgetAmount - newTotal;
      return `⚠️ ${
        MESSAGE_TEMPLATES.BUDGET_WARNING
      }\nTransaksi ini akan menggunakan ${utilization.toFixed(
        1
      )}% dari budget "${
        transaction.category
      }".\n\nBudget: Rp ${budgetAmount.toLocaleString(
        "id-ID"
      )}\nSudah terpakai: Rp ${currentSpent.toLocaleString(
        "id-ID"
      )}\nSetelah transaksi: Rp ${newTotal.toLocaleString(
        "id-ID"
      )}\nSisa: Rp ${remaining.toLocaleString("id-ID")}`;
    }

    return null;
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

    // Step 1: Classify intent
    const classification = await aiAssistantService.classifyIntent(
      userInput,
      conversationContext
    );

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
        await handleLogTransaction(userInput);
        break;

      case INTENT_TYPES.QUERY_DATA:
        await handleQueryData(
          userInput,
          classification.query || "",
          classification.queryType || ""
        );
        break;

      case INTENT_TYPES.QUERY_BUDGET:
        await handleQueryBudget(
          userInput,
          classification.queryType || "budget_overview"
        );
        break;

      case INTENT_TYPES.CHECK_BUDGET_STATUS:
        await handleCheckBudgetStatus();
        break;

      case INTENT_TYPES.CONFIRM_TRANSACTION:
        await handleConfirmTransaction();
        break;

      case INTENT_TYPES.CANCEL_TRANSACTION:
        handleCancelTransaction();
        break;

      case INTENT_TYPES.GENERAL_HELP:
        await handleGeneralHelp(userInput);
        break;

      default:
        addAssistantMessage(MESSAGE_TEMPLATES.UNKNOWN_INTENT);
    }
  };

  // Handle transaction logging with validation and confirmation
  const handleLogTransaction = async (userInput: string) => {
    if (!user) return;

    const aiResponse = await aiAssistantService.extractTransactionData(
      userInput,
      { categories, fundSources },
      conversationContext
    );

    const transactionArray = Array.isArray(aiResponse)
      ? aiResponse
      : [aiResponse];

    for (const transaction of transactionArray) {
      // Check budget impact
      const budgetWarning = checkBudgetImpact(transaction);

      // Validate transaction
      const validation = aiAssistantService.validateTransaction(transaction, {
        categories,
        fundSources,
      });

      // Add budget warning to validation
      if (budgetWarning) {
        validation.warnings = [...(validation.warnings || []), budgetWarning];
      }

      // Check if transaction needs confirmation or clarification
      if (
        !validation.isValid ||
        transaction.confidence < 0.8 ||
        transaction.missingFields?.length ||
        budgetWarning
      ) {
        await handleTransactionClarification(transaction, validation);
        return;
      }

      // Create transaction
      await aiAssistantService.createTransaction(transaction, {
        userId: user.id,
        categories,
        fundSources,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["fundSources"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["budgetDetails"] });

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
    transaction: any,
    validation: any
  ) => {
    if (!user) return;

    // Store pending transaction in context
    const pendingTransaction =
      aiAssistantService.createPendingTransaction(transaction);

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
        .map((f: string) => `- ${f}`)
        .join("\n")}\n`;
      clarificationMessage += "\nSilakan lengkapi informasi yang kurang.";
    } else {
      clarificationMessage +=
        '\n\n✅ Apakah informasi ini sudah benar? Ketik "Ya" untuk konfirmasi atau "Tidak" untuk membatalkan.';
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
      // First, refresh fund sources data to get the latest list
      await queryClient.invalidateQueries({
        queryKey: ["fundSources", user.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["categories", user.id],
      });

      // Wait a bit for queries to refetch
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get fresh data
      const freshFundSources =
        queryClient.getQueryData<typeof fundSources>([
          "fundSources",
          user.id,
        ]) || fundSources;
      const freshCategories =
        queryClient.getQueryData<typeof categories>(["categories", user.id]) ||
        categories;

      // Create transaction (will create missing entities automatically)
      await aiAssistantService.createTransaction(
        pending,
        {
          userId: user.id,
          categories: freshCategories,
          fundSources: freshFundSources,
        },
        true // shouldCreateMissingEntities = true
      );

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["fundSources"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      await queryClient.invalidateQueries({ queryKey: ["budgetDetails"] });

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

      let errorMessage = "Gagal mengkonfirmasi transaksi.";
      if (error.message?.includes("Insufficient funds")) {
        errorMessage = `Saldo tidak mencukupi. Pastikan sumber dana memiliki saldo yang cukup untuk transaksi ini.`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      addAssistantMessage(errorMessage);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
    queryType: string
  ) => {
    if (!user) return;

    const finalAnswer = await aiAssistantService.executeQuery(
      queryType,
      { userId: user.id, transactions, categories, fundSources },
      conversationContext,
      originalQuery
    );

    addAssistantMessage(finalAnswer, {
      intent: INTENT_TYPES.QUERY_DATA,
    });

    // Update suggested prompts based on query
    setSuggestedPrompts(SUGGESTED_PROMPTS.QUERY);
  };

  // Handle budget queries
  const handleQueryBudget = async (
    originalQuery: string,
    queryType: string
  ) => {
    if (!user) return;

    const finalAnswer = await aiAssistantService.executeBudgetQuery(
      queryType,
      {
        userId: user.id,
        transactions,
        categories,
        fundSources,
        budgetDetails,
        currentBudget,
      },
      conversationContext,
      originalQuery
    );

    addAssistantMessage(finalAnswer, {
      intent: INTENT_TYPES.QUERY_BUDGET,
    });

    setSuggestedPrompts(SUGGESTED_PROMPTS.BUDGET);
  };

  // Handle budget status check
  const handleCheckBudgetStatus = async () => {
    if (!user) return;

    if (!currentBudget || !budgetDetails.length) {
      addAssistantMessage(MESSAGE_TEMPLATES.BUDGET_NOT_SET);
      setSuggestedPrompts(SUGGESTED_PROMPTS.BUDGET_SETUP);
      return;
    }

    await handleQueryBudget("Tampilkan status budget saya", "budget_overview");
  };

  // Handle general help
  const handleGeneralHelp = async (userInput: string) => {
    if (!user) return;

    const finalAnswer = await aiAssistantService.generateHelpResponse(
      userInput,
      { transactions, categories, fundSources },
      conversationContext
    );

    addAssistantMessage(finalAnswer, {
      intent: INTENT_TYPES.GENERAL_HELP,
    });

    // Suggest next actions
    setSuggestedPrompts([
      ...SUGGESTED_PROMPTS.TRANSACTION,
      ...SUGGESTED_PROMPTS.QUERY,
      ...SUGGESTED_PROMPTS.BUDGET,
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
      aiAssistantService.createMessage("assistant", MESSAGE_TEMPLATES.WELCOME),
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
    currentBudget,
    budgetDetails,
    handleSend,
    setInput,
    handleKeyPress,
    clearConversation,
  };
};
