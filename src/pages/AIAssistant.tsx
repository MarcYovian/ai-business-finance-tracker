import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { apiKeyStorage, transactionStorage, categoryStorage, fundSourceStorage } from '@/lib/storage';
import { AIResponse } from '@/types/finance';
import { Send, Bot, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { parseCurrency } from '@/lib/currency';

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

  const processAIResponse = async (userInput: string) => {
    const apiKey = apiKeyStorage.get();
    if (!apiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please set your OpenAI API key in Settings.',
        variant: 'destructive'
      });
      return;
    }

    if (!user) return;

    try {
      const categories = categoryStorage.getAll(user.id);
      const fundSources = fundSourceStorage.getAll(user.id);

      const systemPrompt = `You are an expert financial assistant. Extract transaction details from user input and return ONLY a JSON object.

Current date: ${new Date().toISOString().split('T')[0]}
User's categories: ${categories.map(c => c.name).join(', ') || 'none'}
User's fund sources: ${fundSources.map(f => f.name).join(', ') || 'none'}

Extract these fields:
- "type": "income" or "expense"
- "amount": numeric value (just the number)
- "description": brief summary
- "date": YYYY-MM-DD format (today if not specified)
- "category": from user's list or suggest new one
- "fundSource": from user's list if mentioned

If unclear, respond with: {"clarification_needed": "Your question"}

User input: ${userInput}

Respond ONLY with valid JSON:`;

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
      const aiContent = data.choices[0].message.content;
      
      // Parse the AI response
      const aiResponse: AIResponse = JSON.parse(aiContent);

      if (aiResponse.clarification_needed) {
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse.clarification_needed! }]);
        return;
      }

      // Create transaction
      if (aiResponse.type && aiResponse.amount !== undefined && aiResponse.description) {
        let categoryId: string | undefined;
        let fundSourceId: string | undefined;

        // Find or create category
        if (aiResponse.category) {
          let category = categoryStorage.findByName(aiResponse.category, user.id);
          if (!category) {
            category = categoryStorage.create(aiResponse.category, user.id);
          }
          categoryId = category.id;
        }

        // Find fund source
        if (aiResponse.fundSource) {
          const fundSource = fundSourceStorage.findByName(aiResponse.fundSource, user.id);
          fundSourceId = fundSource?.id;
        }

        const amountInCents = Math.round(aiResponse.amount * 100);
        
        transactionStorage.create({
          description: aiResponse.description,
          amount: amountInCents,
          type: aiResponse.type,
          transactionDate: aiResponse.date ? new Date(aiResponse.date).toISOString() : new Date().toISOString(),
          userId: user.id,
          categoryId,
          fundSourceId,
        });

        const confirmationMessage = `Got it! I've logged a $${aiResponse.amount.toFixed(2)} ${aiResponse.type} for "${aiResponse.description}"${categoryId ? ` under the "${aiResponse.category}" category` : ''}. Is that correct?`;
        setMessages(prev => [...prev, { role: 'assistant', content: confirmationMessage }]);
        
        toast({ title: 'Transaction added', description: 'Your transaction has been saved.' });
      }
    } catch (error) {
      console.error('AI processing error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your request. Please try again.',
        variant: 'destructive'
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing that. Please try rephrasing your transaction.' 
      }]);
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
