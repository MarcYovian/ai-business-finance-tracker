import { AI_CONSTANTS, AI_MODELS, ERROR_MESSAGES } from "@/constants/constants";
import { AIRequestOptions } from "@/types/ai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

export class AIService {
  private static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async processWithRetry<T>(
    fn: () => Promise<T>,
    options: AIRequestOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries || AI_CONSTANTS.MAX_RETRY_ATTEMPTS;
    const timeout = options.timeout || AI_CONSTANTS.REQUEST_TIMEOUT_MS;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add timeout to the request
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), timeout);
        });

        const result = await Promise.race([fn(), timeoutPromise]);
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error);

        // Don't retry on certain errors
        if (
          error.message?.includes("API key") ||
          error.message?.includes("authentication") ||
          error.status === 401 ||
          error.status === 403
        ) {
          throw new AIServiceError(
            "API key tidak valid atau tidak memiliki akses.",
            "AUTH_ERROR",
            false
          );
        }

        // Retry on network errors or rate limits
        if (attempt < maxRetries - 1) {
          const delayMs = AI_CONSTANTS.RETRY_DELAY_MS * Math.pow(2, attempt);
          console.log(`Retrying in ${delayMs}ms...`);
          await this.delay(delayMs);
        }
      }
    }

    throw new AIServiceError(
      ERROR_MESSAGES.NETWORK_ERROR,
      "MAX_RETRIES_EXCEEDED",
      false
    );
  }

  static async processWithGemini(
    apiKey: string,
    prompt: string,
    options: AIRequestOptions = {}
  ): Promise<string> {
    return this.processWithRetry(async () => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: AI_MODELS.GEMINI,
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }, options);
  }

  static async processWithOpenAI(
    apiKey: string,
    systemPrompt: string,
    userInput: string,
    options: AIRequestOptions = {}
  ): Promise<string> {
    return this.processWithRetry(async () => {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: AI_MODELS.OPENAI,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userInput },
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }, options);
  }

  static extractJsonFromString(text: string): any | null {
    // Try to find JSON in various formats
    const patterns = [
      /```json\s*([\s\S]*?)\s*```/, // Markdown code block
      /```\s*([\s\S]*?)\s*```/, // Plain code block
      /({[\s\S]*?})/, // Object
      /(\[[\s\S]*?\])/, // Array
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const jsonString = match[1] || match[0];
        if (jsonString) {
          try {
            const parsed = JSON.parse(jsonString.trim());
            return parsed;
          } catch (e) {
            // Continue to next pattern
            continue;
          }
        }
      }
    }

    // Try parsing the entire text as JSON
    try {
      return JSON.parse(text.trim());
    } catch (e) {
      console.error("Failed to extract JSON from text:", text);
      return null;
    }
  }

  static validateAIResponse(response: any, expectedFields: string[]): boolean {
    if (!response || typeof response !== "object") {
      return false;
    }

    for (const field of expectedFields) {
      if (!(field in response)) {
        console.warn(`Missing expected field: ${field}`);
        return false;
      }
    }

    return true;
  }
}
