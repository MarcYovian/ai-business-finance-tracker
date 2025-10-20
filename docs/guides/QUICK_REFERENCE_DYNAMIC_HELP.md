# 📖 Quick Reference: Dynamic General Help

This document provides a quick technical reference for the dynamic general help feature.

---

## Core Components

- **Hook**: `useAIAssistant` (`src/hooks/useAIAssistant.ts`)
- **Handler Function**: `handleGeneralHelp`
- **Prompt Template**: `getGeneralHelpPrompt` (`src/utils/promptTemplates.ts`)

---

## Data Flow

1.  **Intent Classification**: The user's input is classified as `GENERAL_HELP`.
2.  **Context Gathering**: The `handleGeneralHelp` function gathers `userStats`, including:
    - `hasTransactions`
    - `hasCategories`
    - `hasFundSources`
    - `recentActivity`
3.  **Prompt Generation**: The `userStats` and conversation history are passed to `getGeneralHelpPrompt`.
4.  **AI Response**: The AI model generates a personalized help message based on the provided context.

---

## Key Principle

The goal is to provide a tailored response. A new user should be guided towards initial setup and basic features, while an experienced user should be introduced to more advanced capabilities like trend analysis and budget recommendations.
