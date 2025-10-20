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
    "👋 Halo! Saya asisten keuangan AI Anda. Saya dapat membantu Anda mencatat transaksi, menganalisis pengeluaran, memantau budget, dan memberikan insights keuangan. Ada yang bisa saya bantu?",
  API_KEY_MISSING:
    "API key belum dikonfigurasi. Silakan tambahkan API key di halaman Settings.",
  UNKNOWN_INTENT:
    "Maaf, saya tidak mengerti maksud Anda. Bisakah Anda menjelaskan dengan lebih detail?",
  GENERAL_HELP:
    "Tentu! Saya bisa membantu Anda mencatat transaksi (pemasukan, pengeluaran, transfer) atau menjawab pertanyaan terkait data keuangan Anda, seperti 'Berapa total pengeluaran bulan ini?' atau 'Apa kategori pengeluaran terbesar?'.",
  ERROR_PROCESSING:
    "Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
  TRANSACTION_SUCCESS: "Transaksi berhasil dicatat!",
  CONFIRMATION_REQUIRED: "Mohon konfirmasi detail transaksi berikut:",
  INSUFFICIENT_FUNDS: "Maaf, saldo tidak mencukupi untuk transaksi ini.",
  BUDGET_NOT_SET:
    "Anda belum memiliki budget untuk bulan ini. Ingin saya bantu membuat budget berdasarkan pola pengeluaran Anda?",
  BUDGET_WARNING: "⚠️ Peringatan Budget!",
  BUDGET_EXCEEDED: "🔴 Budget Terlampaui!",
  BUDGET_SUCCESS: "✅ Budget berhasil disimpan!",
} as const;

// Intent Types
export const INTENT_TYPES = {
  LOG_TRANSACTION: "log_transaction",
  QUERY_DATA: "query_data",
  CONFIRM_TRANSACTION: "confirm_transaction",
  CANCEL_TRANSACTION: "cancel_transaction",
  GENERAL_HELP: "general_help",
  QUERY_BUDGET: "query_budget",
  SET_BUDGET: "set_budget",
  CHECK_BUDGET_STATUS: "check_budget_status",
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
  BUDGET_OVERVIEW: "budget_overview",
  BUDGET_BY_CATEGORY: "budget_by_category",
  BUDGET_UTILIZATION: "budget_utilization",
  OVER_BUDGET_CATEGORIES: "over_budget_categories",
  BUDGET_RECOMMENDATIONS: "budget_recommendations",
  BUDGET_VS_ACTUAL: "budget_vs_actual",
} as const;

// Suggested Prompts
export const SUGGESTED_PROMPTS = {
  TRANSACTION: [
    "Catat pengeluaran makan 50rb dari dompet",
    "Transfer 1 juta dari bank ke dompet",
    "Pemasukan gaji 5 juta ke bank",
  ],
  QUERY: [
    "Berapa total pengeluaran bulan ini?",
    "Tampilkan transaksi terakhir",
    "Apa kategori pengeluaran terbesar?",
    "Bandingkan pengeluaran bulan ini vs bulan lalu",
  ],
  BUDGET: [
    "Berapa sisa budget bulan ini?",
    "Kategori mana yang over budget?",
    "Tampilkan status budget saya",
    "Sarankan budget untuk bulan depan",
  ],
  BUDGET_SETUP: [
    "Buat budget berdasarkan pengeluaran saya",
    "Set budget Food 500rb dan Transport 300rb",
    "Berapa budget yang ideal untuk saya?",
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
  NETWORK_ERROR: "Koneksi ke AI service gagal. Periksa koneksi internet Anda.",
  AI_RESPONSE_INVALID: "Respons AI tidak valid. Silakan coba lagi.",
  TIMEOUT_ERROR: "Request timeout. Silakan coba lagi.",
  INVALID_RESPONSE: "Response dari AI tidak valid.",
  RATE_LIMIT: "Terlalu banyak request. Silakan tunggu sebentar.",
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

// 🆕 Budget Thresholds
export const BUDGET_THRESHOLDS = {
  WARNING: 0.8, // 80%
  DANGER: 0.95, // 95%
  CRITICAL: 1.0, // 100%
} as const;

// 🆕 Budget Status
export const BUDGET_STATUS = {
  SAFE: "safe",
  WARNING: "warning",
  DANGER: "danger",
  OVER: "over",
} as const;
