import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { aiConfigStorage, transactionStorage, categoryStorage, fundSourceStorage } from '@/lib/storage';
import { AIResponse } from '@/types/finance';
import { Send, Bot, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { extractCurrencyFromText } from '@/lib/currency';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your AI finance assistant. Tell me about your transactions in natural language, like "I spent $50 on lunch today" or "Received $1,200 for consulting work".' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processWithGemini = async (apiKey: string, prompt: string): Promise<string> => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    // Clean the response to get only the JSON part
    text = text.replace(/```json\n/g, '').replace(/\n```/g, '');
    return text;
  };

  const processWithOpenAI = async (apiKey: string, systemPrompt: string, userInput: string): Promise<string> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const processAIResponse = async (userInput: string) => {
    const provider = aiConfigStorage.getProvider();
    const apiKey = aiConfigStorage.getActiveKey();

    if (!apiKey) {
      toast({
        title: 'API Key Required',
        description: `Please set your ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API key in Settings.`,
        variant: 'destructive'
      });
      return;
    }

    if (!user) return;

    try {
      const [categories, fundSources] = await Promise.all([
        categoryStorage.getAll(user.id),
        fundSourceStorage.getAll(user.id),
      ]);

      const systemPrompt = `You are an expert financial assistant. Extract transaction details from user input and return ONLY a JSON object.\n\nCurrent date: ${new Date().toISOString().split('T')[0]}\nUser's categories: ${categories.map(c => c.name).join(', ') || 'none'}\nUser's fund sources: ${fundSources.map(f => f.name).join(', ') || 'none'}\n\nExtract these fields:\n- "type": "income" or "expense"\n- "amount": numeric value (just the number)\n- "description": brief summary\n- "date": YYYY-MM-DD format (today if not specified)\n- "category": from user's list or suggest new one\n- "fundSource": from user's list if mentioned\n\nIf unclear, respond with: {\"clarification_needed\": \"Your question\"}\n\nUser input: ${userInput}\n\nRespond ONLY with valid JSON:`;

      let aiContent: string;
      if (provider === 'gemini') {
        aiContent = await processWithGemini(apiKey, systemPrompt);
      } else {
        aiContent = await processWithOpenAI(apiKey, systemPrompt, userInput);
      }
      
      const aiResponse: AIResponse = JSON.parse(aiContent);

      if (aiResponse.clarification_needed) {
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse.clarification_needed! }]);
        return;
      }

      if (aiResponse.type && aiResponse.description) {
        let categoryId: string | undefined;
        if (aiResponse.category) {
          let category = await categoryStorage.findByName(aiResponse.category, user.id);
          if (!category) {
            category = await categoryStorage.create(aiResponse.category, user.id);
          }
          categoryId = category.id;
        }

        let fundSourceId: string | undefined;
        if (aiResponse.fundSource) {
          const fundSource = await fundSourceStorage.findByName(aiResponse.fundSource, user.id);
          fundSourceId = fundSource?.id;
        }

        let amountInCents = aiResponse.amount ? Math.round(aiResponse.amount * 100) : extractCurrencyFromText(userInput);

        if (amountInCents === 0) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Sorry, I couldn\'t identify the amount. Please include a specific amount (e.g., "$50").' 
          }]);
          return;
        }
        
        await transactionStorage.create({
          description: aiResponse.description,
          amount: amountInCents,
          type: aiResponse.type,
          transactionDate: aiResponse.date ? new Date(aiResponse.date).toISOString() : new Date().toISOString(),
          userId: user.id,
          categoryId,
          fundSourceId,
        });

        const amountDisplay = (amountInCents / 100).toFixed(2);
        const confirmationMessage = `Got it! I've logged a ${amountDisplay} ${aiResponse.type} for "${aiResponse.description}".`;
        setMessages(prev => [...prev, { role: 'assistant', content: confirmationMessage }]);
        toast({ title: 'Transaction added' });
      }
    } catch (error) {
      console.error('AI processing error:', error);
      toast({ title: 'Error', description: 'Failed to process your request.', variant: 'destructive' });
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try rephrasing.' }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);
    await processAIResponse(userMessage);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">Tell me about your transactions in natural language</p>
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
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
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
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
