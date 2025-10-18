# ✨ Feature: Settings

## 1. Overview

The Settings page is the control center for your AI Business Finance Tracker application. Here, you can configure the AI assistant, manage your transaction categories, and oversee your fund sources.

The page is located at `src/pages/Settings.tsx` and is organized into three main tabs for ease of use.

---

## 2. AI Settings

This tab allows you to configure the connection to the artificial intelligence services that power the AI Assistant.

-   **Provider Selection**: You can choose between two leading AI providers:
    -   **OpenAI**
    -   **Google Gemini**

-   **API Key Management**: Based on your provider selection, you can enter the corresponding API key. The input for the non-selected provider is disabled to prevent confusion. API keys are stored securely in the browser's local storage.

-   **Saving**: Click the "Save Settings" button to apply your changes.

## 3. Categories Management

Properly organizing your transactions is crucial for good financial analysis. This tab provides full control over your income and expense categories.

### a. Adding Categories

-   You can add a new **parent category** by providing a name and selecting a type (`Income` or `Expense`).

### b. Managing Sub-categories

-   The application supports a hierarchical category structure. You can add a **sub-category** to any existing parent category.
-   To add a sub-category, click the "Sub" button on a parent category item. The type of the sub-category is automatically inherited from its parent.

### c. Editing and Deleting

-   **Edit**: Any category or sub-category can be renamed by clicking the pencil icon.
-   **Delete**: Categories and sub-categories can be deleted by clicking the trash can icon. *Note: Deleting a parent category does not currently delete its sub-categories. This should be done manually.*

### d. User Interface

-   Income and expense categories are listed in separate sections for clarity.
-   Parent categories can be expanded or collapsed to show or hide their sub-categories.

## 4. Funds Management

This tab is for managing your fund sources, which represent the different accounts or pools of money you use (e.g., bank accounts, cash wallets).

### a. Adding a Fund Source

-   You can add a new fund source by providing a **name** (e.g., "Business Bank Account") and its current **initial balance**.

### b. Deleting a Fund Source

-   Fund sources can be deleted by clicking the "Delete" button. Be cautious, as this action can affect transactions associated with the fund.

### c. Transferring Funds

-   A key feature of this section is the ability to perform internal transfers. Clicking the **"Transfer Funds"** button opens the `TransferDialog`.
-   In this dialog, you can select a source fund, a destination fund, and the amount to transfer. You can also specify an optional administrative fee for the transfer.
