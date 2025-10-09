import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { extractCurrencyFromText } from "@/lib/currency";
import {
  aiConfigStorage,
  categoryStorage,
  fundSourceStorage,
  transactionStorage,
} from "@/lib/storage";
import { AIResponse } from "@/types/finance";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Helper function to extract JSON from a string that might contain markdown code blocks
const extractJsonFromString = (text: string): any | null => {
  // Try to match JSON within ```json ... ``` blocks first
  const jsonRegex = /```json\s*([\s\S]*?)\s*```|```(?:javascript)?\s*({[\s\S]*?})\s*```|({[\s\S]*?})|(\[[\s\S]*?\])/;
  const match = text.match(jsonRegex);
  if (match) {
    // Prioritize the captured group that is not undefined
    const jsonString = match[1] || match[2] || match[3] || match[4];
    if (jsonString) {
      try {
        return JSON.parse(jsonString.trim());
      } catch (e) {
        console.error("Failed to parse extracted JSON:", e);
        // If the primary method fails, try to find the JSON object by matching braces
        const braceStart = text.indexOf('{');
        const braceEnd = text.lastIndexOf('}');
        if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
          const potentialJson = text.substring(braceStart, braceEnd + 1);
          try {
            return JSON.parse(potentialJson);
          } catch (fallbackError) {
            console.error("Fallback JSON parsing also failed:", fallbackError);
          }
        }
      }
    }
  }
  return null;
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

const LoadingIndicator = () => (
  <div className="flex items-center gap-2">
    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]" />
    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]" />
    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" />
  </div>
);

const PromptSuggestion = ({
  text,
  onClick,
}: {
  text: string;
  onClick: (prompt: string) => void;
}) => (
  <button
    onClick={() => onClick(text)}
    className="text-sm text-primary border border-primary/50 rounded-full px-3 py-1 hover:bg-primary/10 transition-colors"
  >
    {text}
  </button>
);

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI finance assistant. Tell me about your transactions in natural language, or ask me a question about your data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState<any | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const processWithGemini = async (
    apiKey: string,
    prompt: string
  ): Promise<string> => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json\\n/g, "").replace(/\\n```/g, "");
    return text;
  };

  const processWithOpenAI = async (
    apiKey: string,
    systemPrompt: string,
    userInput: string
  ): Promise<string> => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput },
        ],
        temperature: 0.3,
      }),
    });
    if (!response.ok) throw new Error("OpenAI API request failed");
    const data = await response.json();
    return data.choices[0].message.content;
  };

  const handleSend = async (prompt?: string) => {
    const userMessage = (prompt || input).trim();
    if (!userMessage) return;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      await processAIResponse(userMessage);
    } catch (error) {
      console.error("AI processing error:", error);
      toast({
        title: "Error",
        description: "Failed to process your request.",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try rephrasing.",
        },
      ]);
    }
    setIsLoading(false);
  };

  const processAIResponse = async (userInput: string) => {
    if (!user) return;

    if (conversationContext) {
      await handleFollowUp(userInput, conversationContext);
      setConversationContext(null);
      return;
    }

    const provider = aiConfigStorage.getProvider();
    const apiKey = aiConfigStorage.getActiveKey();
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: `Please set your ${
          provider === "gemini" ? "Gemini" : "OpenAI"
        } API key in Settings.`,
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I can't work without an API key. Please add one in the settings.`,
        },
      ]);
      return;
    }

    const classifierPrompt = `You are an intent classification expert. Your job is to analyze the user's input and determine their primary intent. Your response MUST be a valid JSON object, and nothing else.

The possible intents are:
- "log_transaction": The user is describing a financial transaction.
- "query_data": The user is asking a question about their financial data.
- "general_help": The user is asking about your capabilities, greeting you, or having a general conversation.

JSON Output Schema:
- For "log_transaction" or "general_help", return: {"intent": "intent_name"}
- For "query_data", also extract the core question: {"intent": "query_data", "query": "summarized user question in English"}

**IMPORTANT: Always wrap your response in a single JSON object.**

**Correct Example:**
User Input: "I bought coffee for 25k"
Your JSON Response: {"intent": "log_transaction"}

**Incorrect Example (DO NOT DO THIS):**
User Input: "I bought coffee for 25k"
Your JSON Response: "log_transaction"

User Input: "${userInput}"

Your JSON Response:`;

    let classificationContent: string;
    if (provider === "gemini") {
      classificationContent = await processWithGemini(apiKey, classifierPrompt);
    } else {
      classificationContent = await processWithOpenAI(
        apiKey,
        classifierPrompt,
        userInput
      );
    }

    let classification = extractJsonFromString(classificationContent);

    // --- NEW SAFEGUARD ---
    // If classification is not a valid object with an intent, handle it.
    if (!classification || typeof classification.intent !== 'string') {
      // Sometimes the AI might just return the intent as a string.
      if (typeof classificationContent === 'string' && ['log_transaction', 'query_data', 'general_help'].includes(classificationContent.trim().toLowerCase())) {
        classification = { intent: classificationContent.trim().toLowerCase() };
      } else {
        // If we still can't figure it out, default to general_help to be safe.
        classification = { intent: 'general_help' };
      }
    }

    // The switch statement can now safely access classification.intent
    switch (classification.intent) {
      case "log_transaction":
        await handleLogTransaction(userInput);
        break;
      case "query_data":
        await handleQueryData(userInput, userInput.toLowerCase());
        break;
      case "general_help":
        handleGeneralHelp();
        break;
      default:
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm not sure how to categorize your request. You can ask me to log a transaction or query your financial data.",
          },
        ]);
    }
  };

  const handleFollowUp = async (followUpInput: string, context: any) => {
    if (context.type === "log_transaction") {
      const originalData = context.partial_data;
      // Construct a new, combined input for the AI
      const combinedInput = `The original request was to log a transaction: ${JSON.stringify(
        originalData
      )}. The user has provided the following additional information to complete it: "${followUpInput}". Please process this and return the complete JSON for the transaction.`;

      // Re-run the transaction logging with the combined info
      await handleLogTransaction(combinedInput);
    }
    // You can add more `else if` blocks here for other context types in the future.
  };

  const handleLogTransaction = async (userInput: string) => {
    if (!user) return;

    const provider = aiConfigStorage.getProvider();
    const apiKey = aiConfigStorage.getActiveKey();

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: `Please set your ${
          provider === "gemini" ? "Gemini" : "OpenAI"
        } API key in Settings.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const [categories, fundSources] = await Promise.all([
        categoryStorage.getAll(user.id),
        fundSourceStorage.getAll(user.id),
      ]);

      const systemPrompt = `
You are an expert financial assistant for a user in Indonesia. Your task is to extract transaction details from user input and respond ONLY with a valid JSON format.

**Key Instructions:**
1.  **Output Format:** If the user describes a single transaction, return a JSON object. If they describe multiple transactions, return a JSON array of objects.
2.  **Language & Currency:** The user will communicate in Indonesian. Interpret amounts accordingly (e.g., '50 ribu' is 50000, '1.5 juta' is 1500000). The currency is Indonesian Rupiah (IDR).

**Context:**
- Current date: ${new Date().toISOString().split("T")[0]}
- User's categories: ${categories.map((c) => c.name).join(", ") || "none"}
- User's fund sources: ${fundSources.map((f) => f.name).join(", ") || "none"}

**JSON Schema to Extract:**

For each transaction, extract the following fields:
- "type": Must be "income", "expense", or "transfer".
- "amount": The numeric value of the transaction.
- "description": A brief summary of the transaction.
- "date": In YYYY-MM-DD format. Interpret relative Indonesian dates like 'kemarin' (yesterday), 'lusa' (day after tomorrow), or 'Rabu lalu' (last Wednesday) based on the current date. Default to today if not specified.
- "category": For "income" or "expense" types. First, try to match the description to the most semantically similar category from the user's list. If no suitable match is found, suggest a concise, new category name.
- "fundSource": For an "expense", this is the source of the funds. For an "income", this is the destination.
- "sourceFund": **ONLY for "transfer" type.** The name of the fund where the money came from.
- "destinationFund": **ONLY for "transfer" type.** The name of the fund where the money went.

**Clarification:**
If any detail is unclear, your JSON response MUST be in this format: {"clarification_needed": "Your specific question to the user", "partial_data": { ... any fields you have already extracted ... }}

**Examples:**

- User input: "kemarin bayar parkir 5 ribu dan beli kopi 25 ribu dari gopay"
- Expected JSON output:
[
  {"type": "expense", "amount": 5000, "description": "bayar parkir", "date": "2025-10-08", "category": "Transportasi", "fundSource": "gopay"},
  {"type": "expense", "amount": 25000, "description": "beli kopi", "date": "2025-10-08", "category": "Makanan", "fundSource": "gopay"}
]

- User input: "pindahin 500rb dari bca ke dana"
- Expected JSON output:
{"type": "transfer", "amount": 500000, "description": "Pindah dana dari bca ke dana", "date": "2025-10-09", "sourceFund": "bca", "destinationFund": "dana"}

User input: ${userInput}

Respond ONLY with valid JSON:
`;

      let aiContent: string;
      if (provider === "gemini") {
        aiContent = await processWithGemini(apiKey, systemPrompt);
      } else {
        aiContent = await processWithOpenAI(apiKey, systemPrompt, userInput);
      }

      // Use the new helper function to extract JSON from potential markdown
      const aiResponse: AIResponse | null = extractJsonFromString(aiContent);

      if (!aiResponse) {
        throw new Error("AI response could not be parsed as valid JSON");
      }

      // Check if clarification is needed and save context
      if (aiResponse.clarification_needed) {
        // Save the partial data and the current task type to memory
        setConversationContext({
          type: "log_transaction",
          partial_data: aiResponse.partial_data,
        });
        // Ask the user the clarifying question
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse.clarification_needed },
        ]);
        return; // Stop processing and wait for the user's follow-up
      }

      // Handle both single transaction object and array of transactions
      const transactions = Array.isArray(aiResponse)
        ? aiResponse
        : [aiResponse];

      for (const transaction of transactions) {
        if (!transaction.type || !transaction.description) continue;

        let categoryId: string | undefined;
        if (transaction.category) {
          let category = await categoryStorage.findByName(
            transaction.category,
            user.id
          );
          if (!category) {
            category = await categoryStorage.create(
              transaction.category,
              user.id
            );
          }
          categoryId = category.id;
        }

        let sourceFundId: string | undefined;
        let destinationFundId: string | undefined;

        // Determine fund sources based on transaction type
        switch (transaction.type) {
          case "expense":
            if (transaction.fundSource) {
              const fundSource = await fundSourceStorage.findByName(
                transaction.fundSource,
                user.id
              );
              sourceFundId = fundSource?.id;
            }
            break;

          case "income":
            if (transaction.fundSource) {
              const fundSource = await fundSourceStorage.findByName(
                transaction.fundSource,
                user.id
              );
              destinationFundId = fundSource?.id;
            }
            break;

          case "transfer":
            if (transaction.sourceFund) {
              const source = await fundSourceStorage.findByName(
                transaction.sourceFund,
                user.id
              );
              if (!source) {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: `Sorry, I couldn't find the source fund "${transaction.sourceFund}". Please check the fund name and try again.`,
                  },
                ]);
                return;
              }
              sourceFundId = source.id;
            }

            if (transaction.destinationFund) {
              const destination = await fundSourceStorage.findByName(
                transaction.destinationFund,
                user.id
              );
              if (!destination) {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: `Sorry, I couldn't find the destination fund "${transaction.destinationFund}". Please check the fund name and try again.`,
                  },
                ]);
                return;
              }
              destinationFundId = destination.id;
            }

            if (!sourceFundId || !destinationFundId) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content:
                    "Transfers require both a source and destination fund. Please specify both.",
                },
              ]);
              return;
            }
            break;
        }

        const amountInCents = transaction.amount
          ? Math.round(transaction.amount * 100)
          : extractCurrencyFromText(userInput);

        if (amountInCents === 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                'Sorry, I couldn\'t identify the amount. Please include a specific amount (e.g., "$50", "Rp 50.000").',
            },
          ]);
          return;
        }

        // Create the transaction
        await transactionStorage.create({
          description: transaction.description,
          amount: amountInCents,
          type: transaction.type,
          transactionDate: transaction.date
            ? new Date(transaction.date).toISOString()
            : new Date().toISOString(),
          userId: user.id,
          categoryId: transaction.type === "transfer" ? undefined : categoryId, // Transfers don't have categories
          sourceFundId,
          destinationFundId,
        });

        // Update fund source balances based on transaction type
        if (transaction.type === "income" && destinationFundId) {
          // For income, increase the destination fund's balance
          const fundSource = await fundSourceStorage
            .getAll(user.id)
            .then((funds) => funds.find((f) => f.id === destinationFundId));
          if (fundSource) {
            await fundSourceStorage.update(destinationFundId, {
              balance: fundSource.balance + amountInCents,
            });
          }
        } else if (transaction.type === "expense" && sourceFundId) {
          // For expense, decrease the source fund's balance
          const fundSource = await fundSourceStorage
            .getAll(user.id)
            .then((funds) => funds.find((f) => f.id === sourceFundId));
          if (fundSource) {
            await fundSourceStorage.update(sourceFundId, {
              balance: fundSource.balance - amountInCents,
            });
          }
        }
        // For transfers, the balance update is already handled in transactionStorage.createTransfer
        // so we don't need to handle it here

        const amountDisplay = (amountInCents / 100).toFixed(2);

        let confirmationMessage = "";
        switch (transaction.type) {
          case "income":
            confirmationMessage = `Got it! I've logged an income of ${amountDisplay} to "${
              transaction.description
            }"${destinationFundId ? ` in ${transaction.fundSource}` : ""}.`;
            break;
          case "expense":
            confirmationMessage = `Got it! I've logged an expense of ${amountDisplay} for "${
              transaction.description
            }"${sourceFundId ? ` from ${transaction.fundSource}` : ""}.`;
            break;
          case "transfer":
            confirmationMessage = `Got it! I've logged a transfer of ${amountDisplay} from "${
              transaction.description
            }"${sourceFundId ? ` from ${transaction.sourceFund}` : ""}${
              destinationFundId ? ` to ${transaction.destinationFund}` : ""
            }.`;
            break;
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: confirmationMessage },
        ]);
      }
    } catch (error: any) {
      console.error("AI processing error:", error);
      if (error.message.includes("Insufficient funds")) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Maaf, saldo di sumber dana Anda tidak mencukupi untuk melakukan transaksi ini.",
          },
        ]);
      } else {
        toast({
          title: "Transaction Failed",
          description: error.message,
          variant: "destructive",
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try rephrasing.",
          },
        ]);
      }
    }
  };

  const handleGeneralHelp = () => {
    const helpMessage =
      "Of course! I can help you log transactions (income, expenses, transfers) using everyday language. You can also ask me questions about your financial data, like 'What were my total earnings last month?' or 'What's my biggest spending category?'.";
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: helpMessage },
    ]);
  };

  const handleQueryData = async (
    originalQuery: string,
    normalizedQuery: string
  ) => {
    if (!user) return;

    try {
      // 1. Your code fetches and processes the data
      const [transactions, categories, fundSources] = await Promise.all([
        transactionStorage.getAll(user.id),
        categoryStorage.getAll(user.id),
        fundSourceStorage.getAll(user.id),
      ]);

      let dataSummary = {};
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startOfThisYear = new Date(now.getFullYear(), 0, 1);
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);

      // Check for different query types
      if (
        normalizedQuery.toLowerCase().includes("expenses this month") ||
        normalizedQuery.toLowerCase().includes("pengeluaran bulan ini") ||
        normalizedQuery.toLowerCase().includes("total pengeluaran")
      ) {
        const expensesThisMonth = transactions
          .filter(
            (t) =>
              t.type === "expense" && new Date(t.transactionDate) >= thisMonth
          )
          .reduce((sum, t) => sum + t.amount, 0);

        dataSummary = {
          query: "total expenses this month",
          totalExpensesInCents: expensesThisMonth,
          month: now.toLocaleString("id-ID", {
            month: "long",
            year: "numeric",
          }),
        };
      } else if (
        normalizedQuery.toLowerCase().includes("income this month") ||
        normalizedQuery.toLowerCase().includes("pemasukan bulan ini") ||
        normalizedQuery.toLowerCase().includes("total pemasukan")
      ) {
        const incomeThisMonth = transactions
          .filter(
            (t) =>
              t.type === "income" && new Date(t.transactionDate) >= thisMonth
          )
          .reduce((sum, t) => sum + t.amount, 0);

        dataSummary = {
          query: "total income this month",
          totalIncomeInCents: incomeThisMonth,
          month: now.toLocaleString("id-ID", {
            month: "long",
            year: "numeric",
          }),
        };
      } else if (
        normalizedQuery.toLowerCase().includes("net profit this month") ||
        normalizedQuery.toLowerCase().includes("net profit bulan ini")
      ) {
        const incomeThisMonth = transactions
          .filter(
            (t) =>
              t.type === "income" && new Date(t.transactionDate) >= thisMonth
          )
          .reduce((sum, t) => sum + t.amount, 0);
        const expensesThisMonth = transactions
          .filter(
            (t) =>
              t.type === "expense" && new Date(t.transactionDate) >= thisMonth
          )
          .reduce((sum, t) => sum + t.amount, 0);

        dataSummary = {
          query: "net profit this month",
          totalIncomeInCents: incomeThisMonth,
          totalExpensesInCents: expensesThisMonth,
          netProfitInCents: incomeThisMonth - expensesThisMonth,
          month: now.toLocaleString("id-ID", {
            month: "long",
            year: "numeric",
          }),
        };
      } else if (
        normalizedQuery.toLowerCase().includes("top category") ||
        normalizedQuery.toLowerCase().includes("biggest spending") ||
        normalizedQuery.toLowerCase().includes("kategori terbesar")
      ) {
        const expenseByCategory = categories
          .map((cat) => {
            const total = transactions
              .filter((t) => t.type === "expense" && t.categoryId === cat.id)
              .reduce((sum, t) => sum + t.amount, 0);
            return { name: cat.name, total };
          })
          .filter((item) => item.total > 0);

        if (expenseByCategory.length > 0) {
          const topCategory = expenseByCategory.reduce((prev, current) =>
            prev.total > current.total ? prev : current
          );

          dataSummary = {
            query: "top expense category",
            topCategory: topCategory.name,
            totalSpentInCents: topCategory.total,
          };
        } else {
          dataSummary = {
            query: "top expense category",
            topCategory: "No expenses recorded",
            totalSpentInCents: 0,
          };
        }
      } else {
        // Default fallback for unrecognized queries
        dataSummary = {
          query: originalQuery,
          message:
            "I'm working on understanding more types of financial questions. Could you ask about your expenses, income, or top spending categories?",
        };
      }

      // 2. Create the "Answerer Prompt" with the data summary
      const answererPrompt = `You are a helpful financial assistant. Your task is to answer the user's question based on the data summary provided. 
Answer in a friendly and natural tone in Indonesian. Format the currency from cents to a readable format (e.g., 1500000 cents becomes Rp 15.000).

Data Summary:
${JSON.stringify(dataSummary)}

User's Original Question: "${originalQuery}"

Your Answer:`;

      const provider = aiConfigStorage.getProvider();
      const apiKey = aiConfigStorage.getActiveKey();

      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: `Please set your ${
            provider === "gemini" ? "Gemini" : "OpenAI"
          } API key in Settings.`,
          variant: "destructive",
        });
        return;
      }

      // 3. Make the second AI call to get the final answer
      let finalAnswer: string;
      if (provider === "gemini") {
        finalAnswer = await processWithGemini(apiKey, answererPrompt);
      } else {
        finalAnswer = await processWithOpenAI(
          apiKey,
          answererPrompt,
          originalQuery
        );
      }
      // Clean up the response to remove any markdown code blocks
      finalAnswer = finalAnswer
        .replace(/```json\\n?/g, '')
        .replace(/```\s*$/g, '')  // Remove trailing code blocks
        .replace(/^```\w*\\n?/g, '')  // Remove leading code blocks
        .trim();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: finalAnswer },
      ]);
    } catch (error) {
      console.error("Error processing data query:", error);
      toast({
        title: "Error",
        description: "Failed to process your data query.",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error while processing your data query. Please try rephrasing your question.",
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-10rem)] flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Your smart financial command center.
          </p>
        </div>

        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4">
            <div
              className="flex-1 overflow-y-auto space-y-6 p-2 -m-2"
              ref={messagesEndRef}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 text-sm ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 text-sm justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <LoadingIndicator />
                  </div>
                </div>
              )}
              {messages.length <= 1 && !isLoading && (
                <div className="flex flex-col items-center text-center pt-8">
                  <p className="text-muted-foreground mb-4">
                    Or try one of these prompts:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <PromptSuggestion
                      text="I spent 50,000 on coffee"
                      onClick={handleSend}
                    />
                    <PromptSuggestion
                      text="Log an income of 1,200,000 for consulting"
                      onClick={handleSend}
                    />
                    <PromptSuggestion
                      text="What were my total expenses last month?"
                      onClick={handleSend}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t p-4">
            <div className="relative w-full">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (e.g., 'I spent $50 on lunch today')"
                className="min-h-[48px] rounded-lg pr-12 resize-none"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="absolute top-1/2 right-3 -translate-y-1/2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
