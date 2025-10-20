# Version 1.1.0 - Budget AI Integration

**Date:** 2025-10-20

This release introduces a powerful integration between the monthly budgeting feature and the AI Assistant, making financial tracking smarter and more proactive.

---

### ✨ New Features

- **AI Budget Awareness**: The AI Assistant can now access and understand your monthly budget status in real-time.
- **Proactive Budget Warnings**: When logging an expense via the AI Assistant that will approach or exceed a category's budget, the AI will now provide an automatic warning and ask for confirmation before proceeding.
- **Budget Status Queries**: You can now ask the AI Assistant about your budget using natural language. The AI can provide a comprehensive overview of your budget utilization across all categories.

### 🚀 Improvements

- **New AI Intent (`query_budget`)**: A new intent has been added to specifically handle questions related to budgeting, improving the accuracy of the AI's responses.
- **Enhanced `QueryEngine`**: The `QueryEngine` is now integrated with `budgetDetails` to perform complex calculations like "budget vs. actual spending" directly in the backend.
- **Smarter Prompts**: The prompt templates have been updated to include context about the user's budget, allowing the AI to generate more relevant and helpful warnings and recommendations.

### 🔧 Technical Changes

- The `useAIAssistant` hook now fetches `currentBudget` and `budgetDetails` to provide necessary context to the AI service.
- A new service, `aiAssistantService`, has been introduced to better separate the core AI logic from the React hook, improving code maintainability.
