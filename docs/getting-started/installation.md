# 🚀 Getting Started: Installation Guide

This guide will walk you through the process of setting up the AI Business Finance Tracker project on your local machine for development.

---

## 1. Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: Version 18.x or higher.
- **npm** (Node Package Manager) or **bun**: This project supports both.
- **Git**: For cloning the repository.

## 2. Cloning the Repository

First, clone the project repository from GitHub to your local machine using the following command:

```bash
git clone https://github.com/your-username/ai-business-finance-tracker.git
cd ai-business-finance-tracker
```

## 3. Installing Dependencies

You can use either `npm` or `bun` to install the project dependencies. Choose the one you prefer.

### Using npm

```bash
npm install
```

### Using bun

```bash
bun install
```

This will install all the necessary packages defined in the `package.json` file, including React, Vite, Supabase, and TanStack Query.

## 4. Environment Configuration

The project requires a connection to a Supabase backend for data storage and authentication. You need to create a `.env` file to store your Supabase credentials.

1.  **Create a `.env` file** in the root of the project directory.
2.  **Copy the contents** from `.env.example` into your new `.env` file.

    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

3.  **Replace the placeholder values** with your actual Supabase project URL and anon key. You can find these in your Supabase project dashboard under **Project Settings > API**.

## 5. Running the Development Server

Once the dependencies are installed and the environment variables are configured, you can start the local development server.

### Using npm

```bash
npm run dev
```

### Using bun

```bash
bun run dev
```

This command will start the Vite development server, and you can view the application by navigating to `http://localhost:5173` (or another port if 5173 is in use) in your web browser.

## 6. Running Tests

To ensure that everything is working correctly, you can run the test suite:

### Using npm

```bash
npm test
```

### Using bun

```bash
bun test
```

---

🎉 **Congratulations!** You have successfully set up the AI Business Finance Tracker project. You are now ready to explore the code and start contributing.
