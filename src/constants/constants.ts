// AI Configuration
export const AI_CONSTANTS = {
  MAX_CONVERSATION_HISTORY: 10,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  REQUEST_TIMEOUT_MS: 30000,
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// Message Templates
export const MESSAGE_TEMPLATES = {
  WELCOME:
    "Hai! Saya asisten keuangan AI Anda. Sampaikan transaksi Anda dalam bahasa sehari-hari, atau ajukan pertanyaan tentang data keuangan Anda.",
  API_KEY_MISSING: "API Key belum diatur. Silakan atur di halaman Settings.",
  UNKNOWN_INTENT:
    "Maaf, saya tidak mengerti maksud Anda. Anda bisa meminta saya mencatat transaksi atau bertanya tentang data keuangan.",
  GENERAL_HELP:
    "Tentu! Saya bisa membantu Anda mencatat transaksi (pemasukan, pengeluaran, transfer) atau menjawab pertanyaan terkait data keuangan Anda, seperti 'Berapa total pengeluaran bulan ini?' atau 'Apa kategori pengeluaran terbesar?'.",
  ERROR_PROCESSING: "Maaf, terjadi kesalahan. Silakan coba ulangi lagi.",
  TRANSACTION_SUCCESS: "Transaksi berhasil dicatat!",
  CONFIRMATION_REQUIRED: "Mohon konfirmasi detail transaksi berikut:",
  INSUFFICIENT_FUNDS: "Saldo tidak mencukupi untuk transaksi ini.",
} as const;

// Intent Types
export const INTENT_TYPES = {
  LOG_TRANSACTION: "log_transaction",
  QUERY_DATA: "query_data",
  GENERAL_HELP: "general_help",
  CONFIRM_TRANSACTION: "confirm_transaction",
  CANCEL_TRANSACTION: "cancel_transaction",
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
} as const;

// Query Types
export const QUERY_TYPES = {
  TOTAL_EXPENSES_MONTH: "total_expenses_month",
  TOTAL_INCOME_MONTH: "total_income_month",
  TOP_EXPENSE_CATEGORY: "top_expense_category",
  BALANCE_BY_FUND: "balance_by_fund",
  RECENT_TRANSACTIONS: "recent_transactions",
  MONTHLY_COMPARISON: "monthly_comparison",
  CATEGORY_BREAKDOWN: "category_breakdown",
  SPENDING_TREND: "spending_trend",
} as const;

// Suggested Prompts
export const SUGGESTED_PROMPTS = {
  TRANSACTION: [
    "Catat pengeluaran makan siang 50rb",
    "Gaji masuk 5 juta dari bank",
    "Transfer 1 juta dari dompet ke bank",
  ],
  QUERY: [
    "Berapa total pengeluaran bulan ini?",
    "Apa kategori pengeluaran terbesar?",
    "Berapa saldo di semua akun?",
    "Tampilkan 5 transaksi terakhir",
  ],
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999999999,
  MIN_DESCRIPTION_LENGTH: 3,
  MAX_DESCRIPTION_LENGTH: 255,
  DATE_FORMAT: "YYYY-MM-DD",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_AMOUNT: "Jumlah transaksi tidak valid. Harus lebih dari 0.",
  INVALID_DATE: "Format tanggal tidak valid. Gunakan format YYYY-MM-DD.",
  INVALID_TYPE:
    "Tipe transaksi tidak valid. Harus income, expense, atau transfer.",
  CATEGORY_NOT_FOUND: "Kategori tidak ditemukan.",
  FUND_SOURCE_NOT_FOUND: "Sumber dana tidak ditemukan.",
  INSUFFICIENT_FUNDS: "Saldo tidak mencukupi.",
  DESCRIPTION_TOO_SHORT: "Deskripsi terlalu pendek (minimal 3 karakter).",
  DESCRIPTION_TOO_LONG: "Deskripsi terlalu panjang (maksimal 255 karakter).",
  NETWORK_ERROR: "Terjadi kesalahan jaringan. Silakan coba lagi.",
  AI_RESPONSE_INVALID: "Respons AI tidak valid. Silakan coba lagi.",
} as const;

// AI Models
export const AI_MODELS = {
  GEMINI: "gemini-2.0-flash-lite",
  OPENAI: "gpt-4o-mini",
} as const;

// Date Ranges
export const DATE_RANGES = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  THIS_WEEK: "this_week",
  LAST_WEEK: "last_week",
  THIS_MONTH: "this_month",
  LAST_MONTH: "last_month",
  THIS_YEAR: "this_year",
  CUSTOM: "custom",
} as const;
