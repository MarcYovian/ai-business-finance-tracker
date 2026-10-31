/**
 * Application Feature Flags Configuration
 * Mengatur visibilitas dan ketersediaan fitur tanpa mengubah atau menghapus kode sumber.
 */
export const FEATURES = {
  /**
   * Mengatur ketersediaan AI Assistant, rute /ai-assistant, dan tab AI di Settings.
   * Dapat di-override via environment variable NEXT_PUBLIC_ENABLE_AI=true atau VITE_ENABLE_AI=true.
   */
  ENABLE_AI:
    (typeof process !== 'undefined' &&
      (process.env.NEXT_PUBLIC_ENABLE_AI === 'true' ||
        process.env.VITE_ENABLE_AI === 'true')) ||
    true, // default true in active AI tracker

  /**
   * Menampilkan kartu insight analitik di Dashboard.
   * Catatan: Analisis ini berjalan lokal via math logic (lib/insights.ts).
   */
  ENABLE_INSIGHTS: true,
} as const;
