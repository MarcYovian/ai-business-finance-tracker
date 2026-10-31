import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIGateway {
  private static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generates AI financial advice using Google Gemini on the server side
   */
  static async generateGeminiAnalysis(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY belum terkonfigurasi di server environment.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Generates AI financial advice using OpenAI on the server side
   */
  static async generateOpenAIAnalysis(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY belum terkonfigurasi di server environment.");
    }

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  /**
   * Dispatches analysis to whichever AI provider is configured
   */
  static async analyzeFinancialData(prompt: string): Promise<string | null> {
    try {
      if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
        return await this.generateGeminiAnalysis(prompt);
      }
      if (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) {
        const sys = "Anda adalah konsultan keuangan bisnis terpercaya. Berikan analisis lugas, praktis, dan santai.";
        return await this.generateOpenAIAnalysis(sys, prompt);
      }
      return null;
    } catch (err: any) {
      console.warn("Server AI Analysis warning:", err?.message);
      return null;
    }
  }
}
