# Changelog: Bug Fixes, Supabase Compatibility, & Bundle Optimization

**Date:** 2026-10-23  
**Status:** Completed

---

## 📋 Overview

Dokumentasi ini merangkum perbaikan komprehensif terhadap bug, penyesuaian skema database Supabase, pemulihan test suite unit testing, pembersihan kode (*code hygiene*), dan optimasi performa bundling aplikasi.

---

## 🛠️ Ringkasan Perbaikan

### 1. Database & Supabase RPC Compatibility
- **Masalah:** Fungsi-fungsi RPC yang dipanggil oleh frontend di `src/lib/storage.ts` belum dideploy di database Supabase atau memiliki penamaan berbeda, menyebabkan kegagalan 404 saat mencatat transaksi dan mengakses anggaran bulanan. Kolom `parent_transaction_id` juga belum ada pada tabel `transactions`.
- **Perbaikan:**
  - Menambahkan kolom `parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL` pada tabel `transactions` beserta index performa.
  - Men-deploy 6 fungsi PostgreSQL RPC kompatibilitas di Supabase:
    1. `create_transaction_and_update_balance`: Mendukung pencatatan mutasi transaksi atomik dan fee transfer berelasi via `parent_transaction_id`.
    2. `update_transaction_and_update_balance`: Revert saldo lama, hapus fee berelasi lama, terapkan saldo baru, dan update transaksi secara atomik.
    3. `delete_transaction_and_revert_balance`: Revert saldo pokok dan biaya admin serta menghapus transaksi.
    4. `get_or_create_budget_for_month`: Menjamin baris anggaran bulanan tersedia dengan default `total_limit` dan `period`.
    5. `upsert_budget_with_items`: Menyesuaikan pemetaan JSON ke kolom `planned_amount` menggunakan `ON CONFLICT (budget_id, category_id) DO UPDATE`.
    6. `get_budget_details`: Agregasi pengeluaran aktual terhadap pagu anggaran per kategori.
  - Membatasi eksekusi RPC hanya untuk role `authenticated` dan `service_role`.

### 2. Pemulihan Unit Test Suite (`src/lib/__tests__/storage.test.ts`)
- **Masalah:** Blok unit test subkategori belum lengkap dan penutup blok `});` tertinggal, menyebabkan parser Vite/esbuild gagal dengan error `Unexpected end of file`. Mocking untuk `transactionStorage.create` juga belum menyelaraskan panggilan RPC dan balance check.
- **Perbaikan:**
  - Melengkapi implementasi test `creates a subcategory` dengan assertion lengkap.
  - Menambahkan properti `type: 'expense'` pada mock kategori.
  - Menyelaraskan mock `supabase.from('fund_sources')` dan `supabase.rpc('create_transaction_and_update_balance')`.
  - **Hasil:** 22/22 unit tests lulus 100%.

### 3. Pembersihan Kode & Kebersihan Repositori (Code Hygiene)
- **Settings Page:** Menghapus import anomali yang tidak digunakan: `import { P } from "node_modules/framer-motion/dist/types.d-BJcRxCew";` pada `src/pages/Settings.tsx`.
- **Insights Library:** Mengeliminasi duplikasi fungsi `formatCurrency` di `src/lib/insights.ts` dan beralih ke import resmi dari `@/lib/currency`.
- **Pembersihan File Sampah:**
  - Menghapus file backup `src/hooks/useAIAssistant.ts.backup` dan `src/services/aiAssistantService.ts.backup`.
  - Menghapus script scratch debug root `debug-currency.ts`.
  - Menambahkan `*.backup` dan `debug-*.ts` ke `.gitignore`.

### 4. Optimasi Performa & Route Code-Splitting
- **Masalah:** Seluruh rute aplikasi diimpor secara statis, menghasilkan bundle tunggal sebesar **1.61 MB** (memicu peringatan bundle size Vite).
- **Perbaikan:**
  - Mengonversi semua komponen halaman di `src/App.tsx` menjadi dinamis via `React.lazy()` yang dibungkus dengan `<Suspense fallback={<PageFallback />}>`.
  - Mengonfigurasi `build.rollupOptions.output.manualChunks` di `vite.config.ts` untuk memecah vendor libraries (`vendor`, `recharts`, `supabase`, `tanstack`).
  - **Hasil:** Ukuran chunk utama berkurang drastis, halaman dashboard turun dari 412 kB menjadi 12.5 kB, dan peringatan bundle size Vite sepenuhnya hilang.
