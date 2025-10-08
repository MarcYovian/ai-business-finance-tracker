# AI Business Finance Tracker

A React-based personal finance application designed to help users manage their income, expenses, and fund transfers efficiently. This application leverages AI for generating financial insights and utilizes Supabase for robust backend services, including authentication and database management. For optimized data fetching and state management, it integrates TanStack Query.

## Features

- **Transaction Management:** Easily track and categorize income, expenses, and transfers.
- **Fund Source Management:** Manage multiple financial accounts or fund sources with real-time balance updates.
- **Interactive Dashboard:** Gain a clear financial overview with charts displaying income vs. expenses over time and expense breakdowns by category.
- **AI-Powered Insights:** Receive intelligent analysis and insights into your financial data.
- **User Authentication:** Secure user login and registration powered by Supabase Auth.
- **Optimized Data Handling:** Efficient data fetching, caching, and synchronization across the application using TanStack Query.
- **Configurable AI Provider:** Switch between OpenAI and Google Gemini for AI services by configuring API keys in settings.

## Technologies Used

This project is built with a modern web development stack:

- **Frontend Framework:** React (with TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **State Management & Data Fetching:** TanStack Query (React Query)
- **Backend & Database:** Supabase (Authentication, PostgreSQL Database)
- **Charting Library:** Recharts
- **AI Integration:** OpenAI API, Google Gemini API

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- Node.js (LTS version recommended) and npm (or Bun)
- A Supabase project with a configured database and authentication.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/MarcYovian/ai-business-finance-tracker.git
    cd ai-business-finance-tracker
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or if you use Bun
    bun install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root of the project based on `.env.example` and fill in your Supabase project details:
    ```
    VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

### Running Locally

Start the development server:

```bash
npm run dev
# or if you use Bun
bun dev
```

The application will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

## Usage

1.  **Sign Up/Log In:** Register a new account or log in using your credentials.
2.  **Configure AI Keys:** Navigate to the `Settings` page to enter your OpenAI or Google Gemini API keys.
3.  **Manage Categories & Fund Sources:** Set up your transaction categories and financial accounts (fund sources) in the `Settings`.
4.  **Add Transactions:** Use the `Transactions` page to record your income, expenses, and transfers.
5.  **View Dashboard:** The `Dashboard` provides an overview of your financial health, including charts and AI-generated insights.

## Project Structure

Key directories and files:

- `src/pages/`: Main application pages (Dashboard, Transactions, Settings, etc.).
- `src/components/`: Reusable UI components.
- `src/hooks/`: Custom React hooks, including data fetching logic with TanStack Query.
- `src/lib/`: Utility functions and data storage logic (Supabase interactions).
- `src/types/`: TypeScript type definitions for the application's data models.
- `src/contexts/`: React Contexts for global state management (e.g., AuthContext).

## Deployment

This project can be deployed to any static hosting service (e.g., Vercel, Netlify, GitHub Pages).

1.  Build the project:
    ```bash
    npm run build
    # or if you use Bun
    bun run build
    ```
2.  Upload the contents of the `dist` directory to your hosting provider.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
