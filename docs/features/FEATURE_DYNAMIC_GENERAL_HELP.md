# ✨ Feature: Dynamic General Help

## 1. Overview

The AI Assistant provides a dynamic and context-aware help system. Instead of showing a generic help message, the assistant analyzes the user's current situation and conversation history to provide a more relevant and personalized response. This is handled by the `handleGeneralHelp` function in the `useAIAssistant` hook.

---

## 2. How It Works

When a user's input is classified with the `GENERAL_HELP` intent, the system gathers contextual information before generating a response.

### a. Contextual Analysis

The `getGeneralHelpPrompt` function in `src/utils/promptTemplates.ts` is provided with the following information:

- **Conversation History**: The last few messages are included to understand the immediate context of the user's request.
- **User Stats**: A summary of the user's current status, including:
    - Whether they have any transactions.
    - Whether they have set up categories.
    - Whether they have created fund sources.
    - The description of their most recent transaction.

### b. Personalized Prompting

This contextual information is used to build a prompt that allows the AI to generate a highly relevant response. For example:

- **For a new user**: If the user has no transactions, the AI will be guided to suggest that they start by logging a transaction.
- **For an experienced user**: If the user has been actively using the app, the AI might suggest more advanced features, like data querying or budget analysis.

---

## 3. Example Scenarios

### Scenario 1: A New User Asks for Help

> **User**: `apa yang bisa kamu lakukan?`

**Analysis**: The system detects that the user has no transactions.

> **AI Response**: `Tentu! Saya bisa membantu Anda mencatat transaksi (pemasukan, pengeluaran, transfer) atau menjawab pertanyaan terkait data keuangan Anda. Mungkin Anda bisa mulai dengan mencatat transaksi pertama Anda? Contohnya, 'catat pengeluaran makan siang 50rb'.`

### Scenario 2: An Active User Asks for Help After a Query

> **User**: `Berapa pengeluaran saya bulan ini?`
> **AI**: `Total pengeluaran Anda bulan ini adalah Rp 1.250.000.`
> **User**: `oke, apa lagi yang bisa kamu bantu?`

**Analysis**: The system sees that the user just performed a query.

> **AI Response**: `Selain menjawab pertanyaan, saya juga bisa membantu Anda menganalisis tren pengeluaran, membandingkan data antar bulan, atau bahkan memberikan rekomendasi budget. Apakah ada hal spesifik yang ingin Anda ketahui?`

---

By using this dynamic approach, the general help feature becomes a more intuitive and effective guide for users at all stages of their journey with the application.
