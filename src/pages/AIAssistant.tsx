import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Bot, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        'Hi! I\'m your AI finance assistant. Tell me about your transactions in natural language, like "I spent $50 on lunch today" or "Received $1,200 for consulting work".',
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processWithGemini = async (
    apiKey: string,
    prompt: string
  ): Promise<string> => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    // Clean the response to get only the JSON part
    text = text.replace(/```json\n/g, "").replace(/\n```/g, "");
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

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const processAIResponse = async (userInput: string) => {
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

    if (!user) return;

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
- Current date: ${new Date().toISOString().split('T')[0]}
- User's categories: ${categories.map(c => c.name).join(', ') || 'none'}
- User's fund sources: ${fundSources.map(f => f.name).join(', ') || 'none'}

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
If any detail is unclear, respond with: {"clarification_needed": "Ask a specific, targeted question to resolve the ambiguity."}

**Examples:**

- User input: "kemarin bayar parkir 5 ribu dan beli kopi 25 ribu dari gopay"
- Expected JSON output:
[
  {"type": "expense", "amount": 5000, "description": "bayar parkir", "date": "2025-10-07", "category": "Transportasi", "fundSource": "gopay"},
  {"type": "expense", "amount": 25000, "description": "beli kopi", "date": "2025-10-07", "category": "Makanan", "fundSource": "gopay"}
]

- User input: "pindahin 500rb dari bca ke dana"
- Expected JSON output:
{"type": "transfer", "amount": 500000, "description": "Pindah dana dari bca ke dana", "date": "2025-10-08", "sourceFund": "bca", "destinationFund": "dana"}

User input: ${userInput}

Respond ONLY with valid JSON:
`;

      let aiContent: string;
      if (provider === "gemini") {
        aiContent = await processWithGemini(apiKey, systemPrompt);
      } else {
        aiContent = await processWithOpenAI(apiKey, systemPrompt, userInput);
      }

      const aiResponse: AIResponse = JSON.parse(aiContent);

      if (aiResponse.clarification_needed) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse.clarification_needed! },
        ]);
        return;
      }

      // Handle both single transaction object and array of transactions
      const transactions = Array.isArray(aiResponse) ? aiResponse : [aiResponse];
      
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
          case 'expense':
            if (transaction.fundSource) {
              const fundSource = await fundSourceStorage.findByName(
                transaction.fundSource,
                user.id
              );
              sourceFundId = fundSource?.id;
            }
            break;
            
          case 'income':
            if (transaction.fundSource) {
              const fundSource = await fundSourceStorage.findByName(
                transaction.fundSource,
                user.id
              );
              destinationFundId = fundSource?.id;
            }
            break;
            
          case 'transfer':
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
                  content: "Transfers require both a source and destination fund. Please specify both.",
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

        await transactionStorage.create({
          description: transaction.description,
          amount: amountInCents,
          type: transaction.type,
          transactionDate: transaction.date
            ? new Date(transaction.date).toISOString()
            : new Date().toISOString(),
          userId: user.id,
          categoryId: transaction.type === 'transfer' ? undefined : categoryId, // Transfers don't have categories
          sourceFundId,
          destinationFundId,
        });

        const amountDisplay = (amountInCents / 100).toFixed(2);
        
        let confirmationMessage = '';
        switch (transaction.type) {
          case 'income':
            confirmationMessage = `Got it! I've logged an income of ${amountDisplay} to "${transaction.description}"${destinationFundId ? ` in ${transaction.fundSource}` : ''}.`;
            break;
          case 'expense':
            confirmationMessage = `Got it! I've logged an expense of ${amountDisplay} for "${transaction.description}"${sourceFundId ? ` from ${transaction.fundSource}` : ''}.`;
            break;
          case 'transfer':
            confirmationMessage = `Got it! I've logged a transfer of ${amountDisplay} from "${transaction.description}"${sourceFundId ? ` from ${transaction.sourceFund}` : ''}${destinationFundId ? ` to ${transaction.destinationFund}` : ''}.`;
            break;
        }
        
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: confirmationMessage },
        ]);
      }
      
      toast({ title: "Transaction(s) added" });
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
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);
    await processAIResponse(userMessage);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">
            Tell me about your transactions in natural language
          </p>
        </div>

        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your transaction here... (e.g., 'I spent $50 on lunch today')"
                className="min-h-[60px]"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
