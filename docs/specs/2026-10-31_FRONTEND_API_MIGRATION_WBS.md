# Work Breakdown Structure (WBS) & Migration Plan
# Alih Total Frontend ke Next.js REST API (/api/v1/...)

- Tanggal: 31 Oktober 2026
- Status: [IN_PROGRESS]
- Owner: Staff Technical Project Manager (`project-manager`)
- Repositori: `/home/yann/apps/repos/ai-business-finance-tracker`

---

## 1. Latar Belakang & Sasaran Utama

Browser frontend saat ini masih mengimpor Supabase Client SDK langsung (`src/lib/supabase.ts` dan `src/lib/storage.ts`) untuk membaca dan mengubah data finansial di browser.
Mandat baru mewajibkan 100% komunikasi data frontend beralih ke Next.js REST API (`/api/v1/...`).

### Batasan Arsitektural:
1. Tidak ada akses langsung dari browser frontend ke Supabase database.
2. Seluruh CRUD (transaksi, transfer atomik, dompet/rekening, kategori, budget & riwayat, beneficiaries, financial goals, dan ai assistant) wajib melalui route handler `/api/v1/...`.
3. Server Component prefetching di `page.tsx` menggunakan API client atau domain service server-side secara aman.
4. Type-safe API client layer dibangun di `src/lib/api-client.ts` dengan error handling standar.
5. Pengujian komprehensif 100% endpoint REST API dan UI E2E Playwright.

---

## 2. Struktur Kerja (Work Breakdown Structure)

```
[Phase 1: REST API & Backend Readiness] (PIC: backend-engineer)
├── BE-01: Implementasi Dynamic Route Handlers Transaksi (/api/v1/transactions/[id])
├── BE-02: Endpoint Transfer Atomik Antar-Akun (/api/v1/transactions/transfer)
├── BE-03: Implementasi Dynamic Route Handlers Dompet (/api/v1/fund-sources/[id])
├── BE-04: Implementasi Dynamic Route Handlers Kategori (/api/v1/categories/[id])
├── BE-05: Pelengkapan Endpoint Budget (/api/v1/budgets/details & /api/v1/budgets/previous)
├── BE-06: Endpoint Beneficiaries & Financial Goals (/api/v1/beneficiaries, /api/v1/financial-goals)
└── BE-07: Endpoint AI Assistant Proxy (/api/v1/ai/chat)

[Phase 2: Frontend Refactoring & Client Layer] (PIC: frontend-engineer)
├── FE-01: Pembuatan Type-Safe API Client (src/lib/api-client.ts)
├── FE-02: Refactor storage.ts Menjadi Jembatan 100% REST API (Tanpa Supabase SDK)
├── FE-03: Refactor Custom Hooks (useTransactions, useFundSources, useCategories, useBudget, useAIAssistant, dll.)
├── FE-04: Refactor Server Components Prefetching (src/app/(dashboard)/**/page.tsx)
└── FE-05: Pembersihan Dependensi Supabase Client di Sisi Browser

[Phase 3: Quality Assurance & Automated Testing] (PIC: qa-specialist & qa-engineer)
├── QA-01: Penyusunan Test Strategy & Risk Matrix Migrasi REST API (qa-specialist)
├── QA-02: Test Suite Otomatis 100% Endpoint REST API (/api/v1/...) (qa-engineer)
├── QA-03: Test Suite Otomatis E2E UI Playwright untuk Seluruh Fitur (qa-engineer)
└── QA-04: Quality Gate Audit & Sign-Off Migrasi (qa-specialist)

[Phase 4: Build Verification, Host Container Sync & Vercel Deploy] (PIC: sysadmin)
├── SYS-01: Verifikasi Build Produksi (next build) & Linting Bebas Error
├── SYS-02: Sinkronisasi Docker Container di Host Port 3005 (Bila Diperlukan)
└── SYS-03: Deployment ke Vercel via Vercel MCP / CLI & Verifikasi Live Endpoint
```

---

## 3. Matriks Tugas & Jalur Kritis (Critical Path)

Jalur Kritis:
BE (Endpoints Lengkap) -> FE (API Client & Hooks Refactor) -> QA (API & UI E2E Automation) -> SYS (Build & Deploy)

| ID | Tugas | PIC | Status | Dependensi |
| :--- | :--- | :--- | :---: | :--- |
| **WBS-BE-01** | Lengkapi endpoint transaksi: GET/PATCH/DELETE /api/v1/transactions/[id] | `backend-engineer` | `[DONE]` | - |
| **WBS-BE-02** | Endpoint transfer atomik: POST /api/v1/transactions/transfer | `backend-engineer` | `[DONE]` | - |
| **WBS-BE-03** | Lengkapi endpoint dompet: GET/PATCH/DELETE /api/v1/fund-sources/[id] | `backend-engineer` | `[DONE]` | - |
| **WBS-BE-04** | Lengkapi endpoint kategori: GET/PATCH/DELETE /api/v1/categories/[id] | `backend-engineer` | `[DONE]` | - |
| **WBS-BE-05** | Lengkapi endpoint budget: details & previous history | `backend-engineer` | `[DONE]` | - |
| **WBS-BE-06** | Endpoint beneficiaries & financial goals CRUD | `backend-engineer` | `[DONE]` | - |
| **WBS-BE-07** | Endpoint proxy AI chat: POST /api/v1/ai/chat | `backend-engineer` | `[DONE]` | - |
| **WBS-FE-01** | Buat src/lib/api-client.ts type-safe REST client | `frontend-engineer` | `[DONE]` | - |
| **WBS-FE-02** | Refactor src/lib/storage.ts untuk route semua call ke REST API | `frontend-engineer` | `[DONE]` | WBS-FE-01 |
| **WBS-FE-03** | Update hooks useTransactions, useFundSources, useCategories, useBudget, useAIAssistant | `frontend-engineer` | `[DONE]` | WBS-FE-02 |
| **WBS-FE-04** | Update prefetch query di RSC src/app/(dashboard)/**/page.tsx | `frontend-engineer` | `[DONE]` | WBS-FE-02 |
| **WBS-QA-01** | Susun QA Strategy & Test Matrix REST API Migration | `qa-specialist` | `[DONE]` | - |
| **WBS-QA-02** | Buat & jalankan automated tests 100% REST API endpoints | `qa-engineer` | `[DONE]` | WBS-BE-* |
| **WBS-QA-03** | Buat & jalankan Playwright E2E UI tests menyeluruh | `qa-engineer` | `[DONE]` | WBS-FE-* |
| **WBS-QA-04** | Audit Quality Gate & Sign-off kelayakan rilis | `qa-specialist` | `[DONE]` | WBS-QA-02, 03 |
| **WBS-SYS-01**| Verifikasi build Next.js (next build) | `sysadmin` | `[TODO]` | WBS-FE-*, WBS-BE-* |
| **WBS-SYS-02**| Sinkronisasi container Docker host port 3005 | `sysadmin` | `[TODO]` | WBS-SYS-01 |
| **WBS-SYS-03**| Deploy ke Vercel via Vercel MCP & verifikasi live production | `sysadmin` | `[TODO]` | WBS-QA-04, SYS-01 |
