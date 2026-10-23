/**
 * Application Feature Flags Configuration
 * Mengatur visibilitas dan ketersediaan fitur tanpa mengubah atau menghapus kode sumber.
 */
export const FEATURES = {
  /**
   * Mengatur ketersediaan AI Assistant, rute /ai-assistant, dan tab AI di Settings.
   * Nilai default: false (fitur AI dinonaktifkan sementara).
   * Dapat di-override via environment variable VITE_ENABLE_AI=true jika diinginkan.
   */
  ENABLE_AI: import.meta.env.VITE_ENABLE_AI === 'true' ? true : false,

  /**
   * Menampilkan kartu insight analitik di Dashboard.
   * Catatan: Analisis ini berjalan lokal via math logic (lib/insights.ts).
   */
  ENABLE_INSIGHTS: true,
} as const;
