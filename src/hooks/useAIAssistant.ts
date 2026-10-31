import {
  MESSAGE_TEMPLATES,
  SUGGESTED_PROMPTS,
} from "@/constants/constants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { transactionStorage } from "@/lib/storage";
import { ConversationContext, Message, PendingTransaction } from "@/types/ai";
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

  const createInitialMessage = (): Message => ({
    id: `msg-${Date.now()}-welcome`,
    role: "assistant",
    content: MESSAGE_TEMPLATES.WELCOME,
    timestamp: new Date().toISOString(),
  });

  const [messages, setMessages] = useState<Message[]>([createInitialMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    messages: [],
    lastIntent: undefined,
  });
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(
    SUGGESTED_PROMPTS.TRANSACTION
  );

  // Add user message to conversation
  const addUserMessage = (content: string) => {
    const message: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, message]);
    updateConversationContext(message);
  };

  // Add assistant message to conversation
  const addAssistantMessage = (content: string, metadata?: Message["metadata"]) => {
    const message: Message = {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      content,
      timestamp: new Date().toISOString(),
      metadata,
    };
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

  // Handle confirmation of pending transaction
  const handleConfirmTransaction = async () => {
    if (!user || !conversationContext.pendingTransaction) {
      addAssistantMessage("Tidak ada transaksi yang menunggu konfirmasi.");
      return;
    }

    const pending = conversationContext.pendingTransaction;

    try {
      const created = await transactionStorage.create({
        description: pending.description,
        amount: pending.amount,
        type: pending.type,
        transactionDate: pending.date || new Date().toISOString(),
        userId: user.id,
        categoryId: pending.categoryId || undefined,
        sourceFundId: pending.sourceFundId || undefined,
        destinationFundId: pending.destinationFundId || undefined,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["fundSources"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["budgetDetails"] });

      // Clear pending transaction
      setConversationContext((prev) => ({
        ...prev,
        pendingTransaction: undefined,
      }));

      addAssistantMessage(
        `Transaksi berhasil dikonfirmasi dan dicatat!\n\n${created.description} - Rp ${created.amount.toLocaleString("id-ID")}`
      );

      toast({
        title: "Transaksi Dikonfirmasi",
        description: `${created.description} - Rp ${created.amount.toLocaleString("id-ID")}`,
      });
    } catch (error: any) {
      const errorMsg = error?.message || "Gagal mencatat transaksi.";
      toast({
        title: "Gagal Konfirmasi Transaksi",
        description: errorMsg,
        variant: "destructive",
      });
      addAssistantMessage(`Gagal mencatat transaksi: ${errorMsg}`);
    }
  };

  // Handle cancellation of pending transaction
  const handleCancelTransaction = () => {
    setConversationContext((prev) => ({
      ...prev,
      pendingTransaction: undefined,
    }));

    addAssistantMessage("Pencatatan transaksi dibatalkan.");
    setSuggestedPrompts(SUGGESTED_PROMPTS.TRANSACTION);
  };

  // Main send handler
  const handleSend = async (prompt?: string) => {
    const userMessage = (prompt || input).trim();
    if (!userMessage) return;

    addUserMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      // Check if user is confirming or cancelling a pending transaction
      if (conversationContext.pendingTransaction) {
        const lower = userMessage.toLowerCase();
        if (/^(ya|yes|ok|benar|lanjutkan|setuju|simpan)$/i.test(lower)) {
          await handleConfirmTransaction();
          return;
        }
        if (/^(tidak|no|batal|cancel|jangan)$/i.test(lower)) {
          handleCancelTransaction();
          return;
        }
      }

      // Route AI chat to REST API proxy endpoint /api/v1/ai/chat
      const chatMessages = conversationContext.messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      chatMessages.push({
        role: "user",
        content: userMessage,
      });

      const response = await apiClient.ai.chat(chatMessages, {
        currentMonth: new Date().toISOString().substring(0, 7),
      });

      addAssistantMessage(response.reply, {
        intent: response.intent,
      });

      if (response.suggestedPrompts && response.suggestedPrompts.length > 0) {
        setSuggestedPrompts(response.suggestedPrompts);
      }

      // Refresh data so charts, balance, and recent lists reflect any backend mutations
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["fundSources"] });
      queryClient.invalidateQueries({ queryKey: ["budgetDetails"] });
    } catch (error: any) {
      console.error("AI processing error:", error);

      let errorMessage = MESSAGE_TEMPLATES.ERROR_PROCESSING;
      if (error instanceof ApiClientError) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "AI Assistant Error",
        description: errorMessage,
        variant: "destructive",
      });

      addAssistantMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
    setMessages([createInitialMessage()]);
    setConversationContext({
      messages: [],
      lastIntent: undefined,
      pendingTransaction: undefined,
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
