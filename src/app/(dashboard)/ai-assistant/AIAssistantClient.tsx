'use client';


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { cn } from "@/lib/utils";
import {
  Bot,
  Check,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef } from "react";

export default function AIAssistantClient() {
  const {
    messages,
    input,
    isLoading,
    suggestedPrompts,
    pendingTransaction,
    handleSend,
    setInput,
    handleKeyPress,
    clearConversation,
  } = useAIAssistant();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const quickActions = [
    {
      icon: Wallet,
      label: "Catat Pengeluaran",
      prompt: "Catat pengeluaran makan siang 50rb dari dompet",
      color:
        "text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900",
    },
    {
      icon: TrendingUp,
      label: "Lihat Pengeluaran",
      prompt: "Berapa total pengeluaran bulan ini?",
      color:
        "text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900",
    },
    {
      icon: Zap,
      label: "Analisis Keuangan",
      prompt: "Apa kategori pengeluaran terbesar saya?",
      color:
        "text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900",
    },
  ];

  const isNewConversation = messages.length <= 1;

  return (
    <>
      <div className="h-full flex flex-col max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Asisten keuangan pintar yang siap membantu Anda
              </p>
            </div>
          </div>
          {messages.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearConversation}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Chat
            </Button>
          )}
        </div>

        {/* Main Chat Card */}
        <Card className="flex-1 flex flex-col overflow-hidden shadow-lg">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
            <div className="space-y-6">
              {/* Welcome Card - Only show at start */}
              {isNewConversation && (
                <Card className="border-dashed border-2 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Mulai Percakapan</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pilih salah satu aksi cepat di bawah atau ketik pesan Anda
                      sendiri
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {quickActions.map((action, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          className={cn(
                            "h-auto py-4 flex flex-col items-center gap-2",
                            action.color
                          )}
                          onClick={() => handleSuggestedPrompt(action.prompt)}
                        >
                          <action.icon className="h-6 w-6" />
                          <span className="text-sm font-medium">
                            {action.label}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Messages */}
              {messages.map((message, idx) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%]",
                      message.role === "user" && "items-end"
                    )}
                  >
                    <Card
                      className={cn(
                        "shadow-md",
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600"
                          : "bg-card border-border"
                      )}
                    >
                      <CardContent className="p-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </CardContent>
                    </Card>
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.metadata?.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(message.metadata.confidence * 100)}%
                          confident
                        </Badge>
                      )}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-md">
                        <User className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <Card className="bg-card border-border shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <div className="space-y-1">
                          <span className="text-sm font-medium">
                            Sedang berpikir...
                          </span>
                          <div className="flex gap-1">
                            <div
                              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pending Transaction Confirmation */}
          {pendingTransaction && (
            <div className="border-t bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200"
                      >
                        Menunggu Konfirmasi
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      {pendingTransaction.description}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      Rp {pendingTransaction.amount.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    onClick={() => handleSend("Ya, benar")}
                    className="gap-2 flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    Konfirmasi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSend("Tidak, batalkan")}
                    className="gap-2 flex-1 sm:flex-none border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <X className="h-4 w-4" />
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Prompts */}
          {!isLoading &&
            suggestedPrompts.length > 0 &&
            messages.length > 1 &&
            messages.length <= 5 && (
              <div className="border-t bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  Saran pertanyaan:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.slice(0, 4).map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="text-xs hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

          {/* Input Area */}
          <div className="border-t bg-background p-4">
            <div className="flex gap-3">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ketik pesan Anda di sini... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                className="min-h-[60px] max-h-[120px] resize-none focus-visible:ring-2 focus-visible:ring-blue-500"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[60px] w-[60px] rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <div className="mt-3 flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium">Tips:</span> Anda bisa bertanya
                tentang pengeluaran, mencatat transaksi, atau meminta analisis
                keuangan. AI akan membantu mengelola keuangan Anda dengan lebih
                baik.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
