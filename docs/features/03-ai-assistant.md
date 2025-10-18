# ✨ Feature: AI Assistant

## 1. Overview

The AI Assistant is the most powerful feature of the AI Business Finance Tracker. It allows users to interact with their financial data using natural language. From logging transactions to asking complex questions, the assistant is designed to be intuitive, smart, and helpful.

The core logic for the assistant resides in the `useAIAssistant` hook (`src/hooks/useAIAssistant.ts`).

---

## 2. How It Works: A Step-by-Step Process

When you send a message to the assistant, it goes through a sophisticated process to understand and respond to your request.

### Step 1: Intent Classification

The first step is to determine the user's primary goal. The assistant classifies the input into one of the following intents:

-   `LOG_TRANSACTION`: The user wants to record a new transaction (e.g., "buy coffee for 50rb").
-   `QUERY_DATA`: The user is asking a question about their data (e.g., "what were my total expenses last month?").
-   `CONFIRM_TRANSACTION`: The user is confirming a pending transaction (e.g., "yes").
-   `CANCEL_TRANSACTION`: The user is canceling a pending transaction (e.g., "no, cancel").
-   `GENERAL_HELP`: The user is asking for help or has a general question.

This classification is done by sending a request to the configured AI model (OpenAI or Gemini) with a specialized prompt (`getClassifierPrompt`).

### Step 2: Routing to the Correct Handler

Based on the classified intent, the request is routed to the appropriate handler function.

---

## 3. Core Capabilities

### a. Natural Language Transaction Logging

This is the primary function of the assistant. You can log transactions just by describing them.

-   **Entity Extraction**: The AI model extracts key details (entities) from your message, such as:
    -   `description`
    -   `amount`
    -   `type` (income, expense, or transfer)
    -   `date`
    -   `category`
    -   `fundSource`, `sourceFund`, `destinationFund`

-   **Validation and Confirmation**: Before saving, the system performs several checks:
    -   **Data Validation**: It validates the extracted data (e.g., ensures the amount is positive).
    -   **Confidence Scoring**: If the AI's confidence in the extracted data is below a certain threshold (e.g., 80%), it will ask for confirmation.
    -   **Missing Information**: If crucial information is missing (e.g., the source fund for an expense), the assistant will ask for clarification.

-   **Auto-Creation**: If you mention a category or fund source that doesn't exist, the assistant can automatically create it for you after confirmation.

**Example Flow:**

> **User**: `transfer 100rb from bca to cash`
> **AI**: (Extracts entities, validates data, and finds it complete)
> **AI**: ✅ Transaction successfully recorded!

**Example Clarification Flow:**

> **User**: `buy lunch`
> **AI**: (Detects missing amount)
> **AI**: ❓ I see you want to log a lunch expense, but how much was it?

### b. Data Querying

You can ask questions about your financial data in plain English.

-   **Query Detection**: The AI first identifies the type of query (e.g., `total_expenses_month`, `top_expense_category`).
-   **Query Engine**: The `QueryEngine` (`src/utils/queryEngine.ts`) processes the request against your local data.
-   **Natural Language Response**: The structured result from the Query Engine is then sent back to the AI model to generate a friendly, human-readable answer.

**Example Flow:**

> **User**: `how much did I spend on food this month?`
> **AI**: (Detects query, gets data from Query Engine)
> **AI**: You have spent Rp 1.200.000 on Food this month.

### c. Context Awareness

The assistant remembers the last few messages in the conversation, allowing for natural follow-up questions.

**Example Flow:**

> **User**: `what were my expenses in September?`
> **AI**: Your total expenses in September were Rp 3.500.000.
> **User**: `and what about in august?`
> **AI**: In August, your total expenses were Rp 2.800.000.

---

## 4. Technical Details

-   **AI Service**: The `AIService` (`src/services/aiService.ts`) is a wrapper around the OpenAI and Gemini SDKs, providing a unified interface for making API calls.
-   **Prompt Engineering**: The quality of the AI's response is heavily dependent on the prompts. The `promptTemplates.ts` file contains carefully crafted prompts for each task (classification, extraction, etc.).
-   **State Management**: The entire state of the conversation, including messages and the pending transaction, is managed within the `useAIAssistant` hook.
