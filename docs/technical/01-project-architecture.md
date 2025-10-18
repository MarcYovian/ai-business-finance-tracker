# 🔧 Technical: Project Architecture

## 1. Overview

This document provides a high-level overview of the technical architecture of the AI Business Finance Tracker. It covers the technology stack and the project's directory structure, explaining the role of each major component.

---

## 2. Technology Stack

The project is built on a modern, robust, and scalable technology stack:

-   **Frontend Framework**: **React** is used for building the user interface, providing a component-based architecture that is both powerful and easy to maintain.

-   **Build Tool**: **Vite** serves as the build tool and development server, offering a lightning-fast development experience with features like Hot Module Replacement (HMR).

-   **Language**: **TypeScript** is used throughout the project, providing static typing to catch errors early, improve code quality, and enhance developer productivity.

-   **Backend and Database**: **Supabase** is used as the backend-as-a-service (BaaS) platform. It provides:
    -   A **PostgreSQL** database for data storage.
    -   **Authentication** services for user management.
    -   **Auto-generated APIs** and an SDK for interacting with the database.
    -   **RPC functions** for executing custom server-side logic.

-   **Data Fetching & State Management**: **TanStack Query** (formerly React Query) is used for managing server state. It handles data fetching, caching, and synchronization with the backend, simplifying data management and improving performance.

-   **Styling**: **Tailwind CSS** is used for styling, providing a utility-first approach that allows for rapid and consistent UI development. This is complemented by **shadcn/ui**, a collection of reusable UI components built on top of Radix UI and Tailwind CSS.

-   **Form Management**: **React Hook Form** and **Zod** are used for managing forms and validation, ensuring data integrity and a smooth user experience.

---

## 3. Project Structure

The `src` directory is organized to promote a clear separation of concerns, making the codebase modular and easy to navigate.

```
src/
├── components/   # Reusable UI components
├── constants/    # Application-wide constants
├── contexts/     # React context providers (e.g., AuthContext)
├── hooks/        # Custom React hooks
├── lib/          # Core libraries, Supabase client, and storage logic
├── pages/        # Top-level page components for each route
├── services/     # Services for interacting with external APIs (e.g., AI)
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

### Directory Explanations

-   `src/pages`: Contains the main component for each page or route in the application (e.g., `Dashboard.tsx`, `Settings.tsx`). These components are responsible for the overall layout and composition of a page.

-   `src/components`: Home to reusable UI components that are used across multiple pages. This includes both general-purpose components (like `Button.tsx`) and feature-specific components (like `TransactionDialog.tsx`).

-   `src/hooks`: This directory contains custom React hooks that encapsulate business logic and state management. For example, `useTransactions.ts` contains all the logic for fetching, adding, updating, and deleting transactions using TanStack Query.

-   `src/lib`: A central place for core functionalities. This includes the Supabase client setup (`supabase.ts`), data storage logic (`storage.ts`), and other fundamental libraries.

-   `src/contexts`: Holds React Context providers that manage global state accessible throughout the application, such as the `AuthContext.tsx` for user authentication status.

-   `src/services`: Contains services that abstract away the details of interacting with external APIs. For example, `aiService.ts` provides a unified interface for communicating with OpenAI or Gemini.

-   `src/types`: Where all TypeScript type definitions and interfaces are stored. This helps in maintaining a single source of truth for data structures used in the application.
