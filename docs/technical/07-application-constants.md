# 🔧 Technical: Application Constants

## 1. Overview

The `src/constants/constants.ts` file is a central repository for all hardcoded and configuration values used throughout the application. Centralizing these constants improves maintainability, consistency, and makes it easier to update values in the future.

---

## 2. Constant Groups

The constants are organized into several logical groups:

### a. `AI_CONSTANTS`

This object contains configuration values related to the AI assistant's behavior.

- `MAX_CONVERSATION_HISTORY`: The maximum number of messages to keep in the conversation history for context.
- `MAX_RETRY_ATTEMPTS`: The number of times to retry a failed AI service request.
- `RETRY_DELAY_MS`: The base delay between retries.
- `REQUEST_TIMEOUT_MS`: The timeout for AI service requests.
- `CACHE_DURATION_MS`: The duration for which AI-related data is cached.

### b. `MESSAGE_TEMPLATES`

This object stores predefined, user-facing messages for the AI assistant.

- `WELCOME`: The initial greeting message.
- `API_KEY_MISSING`: The message to show when an API key is not configured.
- `UNKNOWN_INTENT`: The fallback message when the AI cannot understand the user.
- `GENERAL_HELP`: The default help message.
- `ERROR_PROCESSING`: A generic error message.
- `TRANSACTION_SUCCESS`: The confirmation message after a successful transaction.
- `CONFIRMATION_REQUIRED`: The message asking the user to confirm a pending transaction.
- `BUDGET_WARNING`: The message for when a transaction is near the budget limit.
- `BUDGET_EXCEEDED`: The message for when a transaction exceeds the budget.

### c. `INTENT_TYPES`

An enumeration of all possible intents that the AI can classify from user input, such as `LOG_TRANSACTION`, `QUERY_DATA`, and `QUERY_BUDGET`.

### d. `TRANSACTION_TYPES`

Defines the valid types of transactions: `income`, `expense`, and `transfer`.

### e. `QUERY_TYPES`

An enumeration of all specific query types that the `QueryEngine` can process, such as `TOTAL_EXPENSES_MONTH`, `TOP_EXPENSE_CATEGORY`, and `BUDGET_OVERVIEW`.

### f. `SUGGESTED_PROMPTS`

A collection of example prompts that are shown to the user to guide them on how to interact with the AI assistant. They are grouped by context (e.g., `TRANSACTION`, `QUERY`, `BUDGET`).

### g. `VALIDATION_RULES`

Contains rules for data validation, such as minimum/maximum amounts and description lengths.

### h. `ERROR_MESSAGES`

Stores predefined error messages for validation and other system errors.

### i. `AI_MODELS`

Defines the specific model names for the supported AI providers (OpenAI and Gemini).

### j. `BUDGET_THRESHOLDS` and `BUDGET_STATUS`

These constants define the thresholds for budget warnings (e.g., 80% for a warning) and the corresponding status labels (`SAFE`, `WARNING`, `DANGER`, `OVER`).
