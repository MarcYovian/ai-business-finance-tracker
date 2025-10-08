## 📄 Technical Specification: AI Business Finance Tracker

This document outlines the technical plan for building a smart business finance tracker. The application will leverage a natural language interface powered by GPT-4o to simplify data entry and provide intelligent insights on a clean, modern dashboard.

- **Project Name:** AI-Fi Tracker (working title)
- **Core Idea:** A web application that allows a user to manage their business finances by talking to an AI assistant.
- **Tech Stack:** React (Vite), TypeScript, Shadcn UI, Tailwind CSS, TanStack Query, Browser Local Storage, OpenAI API (GPT-4o).

---

### ✨ Core Features

1.  **Client-Side User Management:**

    - Users can create a profile and "log in" on the client side.
    - All financial data will be scoped to the current user profile within the browser's local storage.

2.  **🤖 AI-Powered Data Entry:**

    - A primary chat-based interface where users can input transactions using natural language.
    - **Example inputs:**
      - "I just spent Rp 150,000 on ads from my business account"
      - "Received a payment of $1,200 for Project Phoenix"
      - "Bought a new laptop for 5 million rupiah as a new company asset"
    - The AI will parse the input, ask for clarification if needed, and prepare the data for local storage entry.

3.  **📊 Interactive Dashboard:**

    - A central view of the user's financial health.
    - **Key Metrics:** Total Income, Total Expenses, Net Profit/Loss.
    - **Visualizations:**
      - A bar chart showing income vs. expenses over time (monthly, yearly).
      - A pie chart breaking down expenses by category.
    - A feed of recent transactions.

4.  **Manual Data Management (CRUD):**

    - Users must be able to view, create, edit, and delete all transactions, categories, and fund sources manually through a standard user interface, in case the AI misinterprets something.

5.  **🧠 AI-Generated Insights:**

    - The AI will periodically analyze the financial data to provide simple, actionable insights on the dashboard.
    - **Examples:** "Your spending on 'Software Subscriptions' was 20% higher this month." or "Your largest source of income is from 'Web Development Services'."

---

### 🏗️ System Architecture

The application is a purely client-side application built with React and Vite. There is no backend server.

1.  **Frontend (Client):**

    - Built with **React** and bundled with **Vite** for a fast development experience.
    - Written in **TypeScript** for type safety and improved code quality.
    - UI components are built using **Shadcn UI** over **Tailwind CSS** for a modern and accessible design system.
    - **React Router** is used for client-side navigation between pages.
    - Asynchronous state and data fetching (e.g., from the OpenAI API) are managed by **TanStack Query**.

2.  **Backend (Server):**

    - This project has **no backend server**. All logic and data storage are handled directly in the browser (client-side).

3.  **Database / Persistence:**

    - All application data (users, transactions, etc.) is stored in the **browser's Local Storage**.
    - The `src/lib/storage.ts` file contains the functions for interacting with local storage, acting as a data access layer.

---

### 👤 User Flow

1.  **Onboarding:** User visits the site -> Enters an email to create a profile -> Is taken to the dashboard.
2.  **AI Data Entry:** User navigates to the "AI Assistant" tab -> Types "Paid for my monthly Figma subscription, $15" into the chat input -> The AI responds with "Got it. I've logged a $15 expense for 'Figma subscription' under the 'Software' category. Is that correct?" -> User confirms -> The data is saved to local storage.
3.  **Dashboard Review:** User visits the "Dashboard" -> Sees the new $15 expense reflected in the "Total Expenses" and the expense breakdown pie chart.
4.  **Manual Correction:** User navigates to the "Transactions" page -> Finds the Figma entry -> Clicks "Edit" -> Changes the category from "Software" to "Design Tools" -> Clicks "Save".

---

### 🗄️ Data Schema (Local Storage)

The data is stored as JSON arrays in the browser's local storage. The structure of these objects is defined in `src/types/finance.ts`.

```typescript
// from src/types/finance.ts

export type TransactionType = 'income' | 'expense';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface FundSource {
  id: string;
  name: string;
  balance: number; // stored in the smallest currency unit (e.g., cents)
  userId: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number; // stored in the smallest currency unit (e.g., cents)
  type: TransactionType;
  transactionDate: string;
  createdAt: string;
  userId: string;
  categoryId?: string;
  fundSourceId?: string;
}
```

> **Note:** Storing currency as an **integer** (representing the smallest unit, like cents) is a best practice to avoid floating-point inaccuracies.

---

### 🧠 AI Assistant Logic & Prompting

The goal is to reliably convert natural language into a structured JSON object that can be saved to local storage. We'll use GPT-4o's "JSON Mode".

**Workflow:**

1.  The frontend, likely from a React component, captures the user's text input.
2.  The application constructs a detailed prompt for the OpenAI API, including context like existing categories and fund sources retrieved from local storage.
3.  A request is made directly from the client to the **OpenAI API**.
4.  The OpenAI API returns a structured JSON object.
5.  The frontend validates the JSON and uses the functions in `src/lib/storage.ts` to perform the necessary operations (e.g., find or create a category, then insert the transaction).

**Example System Prompt:**

```
You are an expert financial assistant. Your task is to extract transaction details from user input and return it as a JSON object.

The current date is: {{current_date}}.

The user has the following existing categories: {{user_categories_list}}.
The user has the following existing fund sources: {{user_fund_sources_list}}.

Analyze the user's text to determine the following fields:
- "type": Must be either "income" or "expense".
- "amount": A numeric value, converted to the smallest currency unit (e.g., $15.50 becomes 1550).
- "description": A brief summary of the transaction.
- "date": The date of the transaction in YYYY-MM-DD format. If not specified, use today's date.
- "category": Infer the most appropriate category from the user's list. If none fit, suggest a new, logical one.
- "fundSource": Infer the fund source if mentioned.

If any information is ambiguous or missing, your response should be a question to the user in a JSON format: `{ "clarification_needed": "Your question here." }`.

Always respond with a valid JSON object.

User Input: "{{user_input}}"

Your JSON Response:
```