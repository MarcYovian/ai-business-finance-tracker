# 🔧 Technical: Prompt Engineering

## 1. Overview

Prompt engineering is a critical component of the AI assistant's effectiveness. The prompts are carefully designed to guide the AI model (either OpenAI's GPT or Google's Gemini) to produce reliable, structured, and relevant responses. All prompt templates are located in `src/utils/promptTemplates.ts`.

---

## 2. Key Prompting Strategies

### a. Role-Playing

Each prompt begins by assigning a specific role to the AI (e.g., "You are an intent classification expert," "You are an expert financial assistant"). This sets the context and directs the AI to behave as a specialist for the given task.

### b. Structured JSON Output

For tasks that require structured data, such as intent classification and transaction data extraction, the prompts explicitly instruct the AI to respond **only** with a valid JSON object. The prompt includes a clear JSON schema and examples to ensure the output is predictable and machine-readable.

### c. Contextual Information

To make the AI's responses more accurate and personalized, the prompts are dynamically injected with relevant context:

- **Conversation History**: The last few messages of the conversation are included to enable the AI to understand follow-up questions and maintain context.
- **User Data**: Information such as the user's existing categories and fund sources is provided to the AI, allowing it to match entities to existing data or identify when a new entity needs to be created.
- **Current Date**: The current date is provided to help the AI correctly interpret relative date references like "today" or "yesterday."

### d. Few-Shot Learning (Examples)

The prompts include several examples of user inputs and the corresponding desired AI outputs. This technique, known as few-shot learning, significantly improves the accuracy and format of the AI's responses by showing it exactly what is expected.

---

## 3. Core Prompt Functions

### a. `getClassifierPrompt`

- **Purpose**: To classify the user's intent.
- **Key Instructions**: This prompt instructs the AI to categorize the user's input into one of the predefined intents (e.g., `LOG_TRANSACTION`, `QUERY_DATA`). It also requires the AI to identify a specific `queryType` for data-related queries.

### b. `getTransactionExtractionPrompt`

- **Purpose**: To extract structured data from a user's description of a transaction.
- **Key Instructions**: This prompt provides the AI with the user's categories and fund sources and asks it to return a JSON object containing details like `type`, `amount`, `description`, `date`, etc. It also includes rules for handling informal language (e.g., converting "50rb" to `50000`).

### c. `getQueryAnswerPrompt` and `getBudgetQueryPrompt`

- **Purpose**: To generate a natural language response from structured query results.
- **Process**: After the `QueryEngine` processes a user's question and returns structured data, this data is passed to one of these prompts. The prompt then instructs the AI to formulate a friendly, human-readable answer in Indonesian based on that data.

### d. `getGeneralHelpPrompt`

- **Purpose**: To handle general conversation and help requests.
- **Key Instructions**: This prompt provides the AI with a summary of its capabilities and the user's current status (e.g., whether they have any transactions). This allows the AI to give a more personalized and helpful response, such as suggesting that a new user start by adding a transaction.
