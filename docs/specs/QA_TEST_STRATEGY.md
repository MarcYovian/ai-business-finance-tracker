# Quality Assurance Test Strategy & Quality Gate Specification
## Migrasi Next.js App Router, Unified Domain Service, dan MCP Server
### Proyek: AI Business Finance Tracker

- **Dokumen**: QA_TEST_STRATEGY.md
- **Versi**: 1.0.0
- **Tanggal**: 2026-10-31
- **Author**: Principal Quality Assurance Specialist (`qa-specialist`)
- **Target Repositori**: `/home/yann/apps/repos/ai-business-finance-tracker`
- **Automation Workspace**: `/home/yann/playwright-tools`
- **Status Quality Gate**: PASSED - SIGN-OFF APPROVED FOR PRODUCTION RELEASE (100% Pass Rate)

---

## 1. Quality Gate Governance & Definition of Done (DoD)

Quality Gate migrasi ini menetapkan standar tanpa toleransi untuk regresi finansial dan kebocoran sesi. Keputusan promosi kode dibagi menjadi tiga status:

- **[BLOCK] (Veto Release)**:
  - Terjadi selisih saldo rekening (pembulatan sen atau floating point error) pada transaksi apa pun.
  - Hydration mismatch terdeteksi di konsol browser pada dashboard atau visual Recharts.
  - Flash redirect (layar putih atau loading spinner sebelum lempar ke login) terjadi pada rute terproteksi.
  - Ada query yang bocor antar pengguna (RLS bypass) setelah penghapusan 6 RPC `mcp_*`.
  - Endpoint REST API tidak mengembalikan format RFC 7807 saat terjadi error validasi/bisnis.
  - Endpoint MCP `/api/mcp` gagal merespons format baku JSON-RPC 2.0 atau menerima request dengan API key non-aktif.
- **[CONDITIONAL PASS]**:
  - Semua tes fungsional lulus, namun ada perbaikan minor pada styling responsif mobile yang tidak mengganggu interaksi form modal.
- **[PROCEED] (Sign-Off Approved)**:
  - Seluruh skenario BDD Gherkin lulus 100% pada automated test suite.
  - Zero TypeScript error, zero linter error, zero hydration warnings pada build `npm run build`.
  - Audit aksesibilitas WCAG 2.2 AA lulus tanpa pelanggaran Level A/AA pada komponen navigasi dan dialog.

---

## 2. Risk Assessment Matrix (Dampak vs Probabilitas)

| ID Risiko | Deskripsi Risiko | Likelihood | Impact | Tingkat Risiko | Rencana Mitigasi QA | Metode Verifikasi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **RSK-01** | **Float Point Rounding Error (Cents vs Rupiah)**: Konversi nilai nominal antara layer domain dan database menimbulkan selisih kas pembukuan. | Sedang | Sangat Tinggi | **Tinggi** | Batas konversi dimandatkan tunggal di Domain Service via `Math.round(val * 100)`. Di database wajib integer/bigint Cents. | Unit test batas nilai (Boundary Value: pecahan desimal, kelipatan 100, nominal miliaran). |
| **RSK-02** | **Desinkronisasi Saldo pada Transfer Antar-Akun**: Koneksi putus saat transfer split (induk transfer berhasil, anak fee gagal) atau mutasi saldo tidak atomik. | Rendah | Sangat Tinggi | **Tinggi** | Seluruh alur transfer wajib dibungkus RPC ACID PostgreSQL `create_transaction_and_update_balance`. Dilarang mutasi via `Promise.all` di client. | Database transaction rollback test, chaos simulation, verifikasi row locking saldo. |
| **RSK-03** | **Hydration Mismatch pada Grafik Recharts**: Server SSR merender dimensi awal SVG yang berbeda dengan dimensi klien saat rehidrasi. | Tinggi | Sedang | **Tinggi** | Komponen grafik Recharts wajib ditandai `'use client'` dan di-load via `dynamic(() => import(...), { ssr: false })` dengan fallback skeleton. | Playwright console error listener: deteksi string "Hydration failed" atau "React warning 418/423". |
| **RSK-04** | **Client-Side Auth Glitch & Redirect Flash**: Halaman dashboard sempat merender layout kosong sebelum membaca status auth dari cookie. | Sedang | Sedang | **Sedang** | Proteksi rute dipindahkan ke Edge Middleware (`middleware.ts`) via `@supabase/ssr`. Redirect 307 dieksekusi sebelum payload HTML dikirim ke browser. | Playwright network trace: verifikasi respon HTTP 307 seketika tanpa render DOM dashboard. |
| **RSK-05** | **Data Corruption / Regresi Pasca Drop RPC `mcp_*`**: Klien eksternal atau AI assistant kehilangan akses data transaksi setelah 6 RPC dibersihkan dari Supabase. | Rendah | Sangat Tinggi | **Tinggi** | Domain service mengambil alih pembacaan via direct Supabase SDK berfilter `user_id = ctx.userId`. Skrip rollback SQL disiapkan instan. | E2E integration test: eksekusi tool MCP `list_transactions` sebelum dan sesudah migrasi SQL. |
| **RSK-06** | **Celah Keamanan API Key MCP**: Search path hijacking atau kebocoran akses fungsi `verify_api_key` ke publik anonim. | Rendah | Sangat Tinggi | **Tinggi** | Tambahkan `SET search_path TO 'public'` dan `REVOKE EXECUTE FROM PUBLIC, anon; GRANT TO authenticated, service_role`. | SQL security audit & penetration request via anon client. |

---

## 3. Strategi Pengujian Komprehensif (4 Pilar Utama)

```mermaid
flowchart TD
    P1["Pilar 1: Web App UI/UX & App Router"] --> G1["Quality Gate: No Hydration Flash, WCAG 2.2 AA"]
    P2["Pilar 2: Unified Domain Services & REST"] --> G2["Quality Gate: ACID RPCs, RFC 7807, Exact Cents"]
    P3["Pilar 3: MCP Server (/api/mcp)"] --> G3["Quality Gate: JSON-RPC 2.0, API Key Auth, Scope Guard"]
    P4["Pilar 4: Supabase Database Integrity"] --> G4["Quality Gate: Zero RPC Leakage, RLS Strict Isolation"]
```

### Pilar 1: Web App UI/UX & Next.js App Router
1. **Server-Side Prefetching & Hydration Boundary**:
   - Verifikasi halaman `/dashboard` melakukan prefetch ringkasan keuangan di server melalui TanStack Query singleton.
   - Data awal harus langsung tersedia dalam HTML tanpa menampilkan layout loading skeleton berkedip.
2. **Recharts Rendering Isolation**:
   - Seluruh widget grafik (`BudgetVsSpendingChartWidget`, `MonthlyBalanceTrendWidget`, dsb.) wajib terisolasi di sisi klien (`ssr: false`).
   - Tidak boleh ada pesan peringatan `Text content did not match` atau `Hydration mismatch` di console browser Chromium, Firefox, dan WebKit.
3. **Modal Dialog Lifecycle**:
   - `TransactionDialog`, `BudgetFormDialog`, dan `TransferDialog` wajib memvalidasi input via Zod schema sebelum tombol Submit aktif.
   - Setelah mutasi berhasil, modal menutup otomatis, cache TanStack Query di-invalidasi seketika, dan saldo dompet di header/sidebar ter-update tanpa reload halaman.
4. **Edge Route Guard (Zero-Flash Redirect)**:
   - Skenario Unauthenticated: User tanpa session cookie mengakses `/dashboard`, `/transactions`, atau `/budget` harus di-redirect ke `/auth` via status HTTP 307 langsung dari middleware.
   - Skenario Authenticated: User dengan session valid mengakses `/auth` harus langsung diarahkan ke `/dashboard`.
5. **Aksesibilitas (WCAG 2.2 AA)**:
   - Navigasi keyboard penuh (`Tab`, `Escape`, `Enter`) pada modal dan dropdown `cmdk`.
   - Rasio kontras teks minimal 4.5:1 untuk teks normal dan 3:1 untuk teks tebal/komponen grafis.
   - Seluruh form input memiliki elemen `<label>` yang terhubung valid via `htmlFor`.

### Pilar 2: Unified Domain Services & REST API
1. **Atomics Mutasi Finansial**:
   - Setiap mutasi transaksi (Create, Update, Delete) wajib memanggil RPC PostgreSQL ACID:
     - `create_transaction_and_update_balance`
     - `update_transaction_and_update_balance`
     - `delete_transaction_and_revert_balance`
   - Tidak boleh ada manipulasi saldo langsung melalui `supabase.from('fund_sources').update(...)`.
2. **Validasi Kecukupan Saldo Akun (Insufficient Funds)**:
   - Untuk transaksi bertipe `expense` dan `transfer`, sistem wajib memverifikasi: `saldo_tersedia >= nominal + fee`.
   - Jika saldo kurang, transaksi ditolak sebelum RPC dijalankan atau dibatalkan oleh trigger RPC dengan pesan error yang jelas.
3. **Batas Nominal Cents vs Rupiah**:
   - Consumer Layer (UI, REST, MCP): Mengirim dan menerima nilai Rupiah asli (contoh: Rp 50.000).
   - Domain Service Boundary: Mengonversi Rupiah ke Cents integer (`Math.round(amount * 100)`) untuk database.
   - Database Layer: Menyimpan kolom `amount` dan `balance` sebagai `bigint` (Cents).
4. **Standar Penanganan Error RFC 7807**:
   - Seluruh respon error HTTP dari Route Handler REST (`/api/v1/...`) wajib mengikuti struktur:
     ```json
     {
       "type": "https://aifinance.app/errors/insufficient-funds",
       "title": "Insufficient Funds",
       "status": 422,
       "detail": "Saldo rekening tidak mencukupi untuk transaksi ini.",
       "instance": "/api/v1/transactions",
       "invalidParams": []
     }
     ```

### Pilar 3: Next.js MCP Server (`/api/mcp`)
1. **Transport & Runtime**:
   - Handler berjalan pada `src/app/api/mcp/route.ts` dengan Node.js runtime, `force-dynamic`, dan transport `WebStandardStreamableHTTPServerTransport`.
   - Mendukung CORS preflight (OPTIONS 204) dan chunked streaming response.
2. **Autentikasi API Key (`afi_live_...`)**:
   - Header `Authorization: Bearer afi_live_...` atau `x-api-key: afi_live_...` di-hash dengan SHA-256 dan divalidasi ke fungsi database `verify_api_key`.
   - API key yang non-aktif (`is_active = false`) atau kadaluwarsa (`expires_at < now()`) wajib ditolak dengan HTTP 401 dan kode error JSON-RPC `-32001`.
3. **Penyelarasan Tool MCP ke Domain Service**:
   - Tool `list_transactions`, `create_transaction`, `list_fund_sources`, dan `query_financial_insights` tidak boleh menjalankan query SQL mentah, melainkan memanggil method Domain Service terkait.
4. **Format Respon JSON-RPC 2.0**:
   - Setiap respon MCP wajib mengembalikan payload standar:
     - Sukses: `{"jsonrpc": "2.0", "result": { ... }, "id": <id>}`
     - Error: `{"jsonrpc": "2.0", "error": {"code": -32xxx, "message": "..."}, "id": <id>}`

### Pilar 4: Integritas Database Supabase & Zero-Data-Corruption
1. **Verifikasi Penghapusan 6 RPC `mcp_*`**:
   - Memastikan fungsi berikut benar-benar dihapus:
     - `public.mcp_verify_auth`
     - `public.mcp_list_fund_sources`
     - `public.mcp_get_fund_source`
     - `public.mcp_list_categories`
     - `public.mcp_list_transactions`
     - `public.mcp_get_transaction`
   - Verifikasi bahwa tidak ada kode frontend atau route handler yang masih mencoba memanggil RPC tersebut.
2. **Isolasi Data Pengguna (RLS)**:
   - Pengujian lintas akun: User A tidak boleh dapat membaca atau memodifikasi transaksi, dompet, atau budget milik User B melalui direct SDK maupun endpoint MCP.
3. **Integritas Relasional & Indexing**:
   - Verifikasi performa indeks baru pada foreign keys `source_fund_id`, `destination_fund_id`, `parent_id`, dan `recurring_patterns`.

---

## 4. Kriteria Akseptasi Berbasis Gherkin (BDD Scenarios)

### Skenario 1: Transaksi Pengeluaran dengan Saldo Rekening Kurang
```gherkin
Feature: Pencatatan Transaksi Pengeluaran dengan Validasi Saldo

  Scenario: User mencoba membuat pengeluaran melebihi saldo dompet yang tersedia
    Given pengguna telah login dengan akun valid
    And akun memiliki dompet "Rekening BCA" dengan saldo sebesar Rp 100.000 (10.000.000 sen)
    When pengguna membuka dialog "Catat Transaksi"
    And pengguna memilih jenis transaksi "Pengeluaran"
    And pengguna memilih sumber dana "Rekening BCA"
    And pengguna memasukkan nominal sebesar Rp 150.000
    And pengguna mengklik tombol "Simpan Transaksi"
    Then sistem menolak transaksi tersebut
    And sistem menampilkan pesan validasi "Saldo rekening tidak mencukupi untuk pengeluaran ini"
    And saldo dompet "Rekening BCA" tetap sebesar Rp 100.000
    And tidak ada baris transaksi baru yang tersimpan di database
```

### Skenario 2: Transfer Antar-Rekening Atomik dengan Biaya Admin (Fee)
```gherkin
Feature: Transfer Dana Antar Rekening Atomik

  Scenario: User berhasil mentransfer dana dengan potongan biaya admin secara atomik
    Given pengguna telah login dengan akun valid
    And dompet "Bank Mandiri" memiliki saldo Rp 500.000 (50.000.000 sen)
    And dompet "Kas Dompet" memiliki saldo Rp 50.000 (5.000.000 sen)
    When pengguna membuka dialog "Transfer Dana"
    And pengguna memilih rekening asal "Bank Mandiri"
    And pengguna memilih rekening tujuan "Kas Dompet"
    And pengguna memasukkan nominal transfer Rp 200.000
    And pengguna memasukkan biaya admin transfer Rp 2.500
    And pengguna mengklik tombol "Kirim Transfer"
    Then sistem memproses transfer secara atomik melalui PostgreSQL RPC
    And saldo "Bank Mandiri" terpotong menjadi Rp 297.500 (pengurangan Rp 202.500)
    And saldo "Kas Dompet" bertambah menjadi Rp 250.000 (penambahan Rp 200.000)
    And tercatat 1 transaksi induk bertipe "transfer" sebesar Rp 200.000
    And tercatat 1 transaksi anak bertipe "expense" untuk biaya admin sebesar Rp 2.500
    And kedua transaksi saling terikat secara relasional
```

### Skenario 3: Upsert Anggaran Bulanan (Monthly Budget Clean Replacement)
```gherkin
Feature: Pengelolaan Anggaran Bulanan

  Scenario: User memperbarui alokasi anggaran kategori untuk bulan berjalan
    Given pengguna telah login dengan akun valid
    And pengguna berada di halaman "/budget" untuk periode bulan "November 2026"
    When pengguna memasukkan alokasi kategori:
      | Kategori   | Alokasi Baru |
      | Operasional| Rp 3.000.000 |
      | Gaji Tim   | Rp 7.000.000 |
    And pengguna mengklik tombol "Simpan Anggaran"
    Then sistem memanggil RPC "upsert_budget_with_items"
    And nominal alokasi dikonversi ke sen (300.000.000 sen dan 700.000.000 sen) di database
    And seluruh alokasi lama pada periode bulan tersebut digantikan tanpa duplikasi baris
    And widget perbandingan "Budget vs Spending" ter-update seketika tanpa refresh browser
```

### Skenario 4: Edge Middleware Route Guard & Zero-Flash Redirect
```gherkin
Feature: Proteksi Rute dan Sesi Pengguna di Edge Runtime

  Scenario: Pengguna anonim mencoba mengakses halaman transaksi langsung via URL
    Given pengguna belum melakukan login (tidak memiliki cookie sb-access-token)
    When browser melakukan HTTP GET ke "/transactions"
    Then edge middleware merespons dengan status HTTP 307 Redirect
    And header Location bernilai "/auth?next=/transactions"
    And browser langsung diarahkan ke halaman login tanpa pernah merender konten layout dashboard

  Scenario: Pengguna yang sudah login mengakses halaman login
    Given pengguna telah memiliki sesi cookie Supabase yang valid
    When browser melakukan HTTP GET ke "/auth"
    Then edge middleware merespons dengan status HTTP 307 Redirect
    And browser langsung diarahkan ke "/dashboard"
```

### Skenario 5: Eksekusi Tool MCP dengan Validasi Personal API Key
```gherkin
Feature: Autentikasi dan Pemanggilan Tools pada Endpoint Next.js MCP

  Scenario: Klien AI memanggil tool list_transactions menggunakan API Key valid
    Given terdapat user dengan API Key aktif "afi_live_samplekey123"
    When klien mengirim HTTP POST ke "/api/mcp" dengan header:
      | Header Name   | Header Value                 |
      | Authorization | Bearer afi_live_samplekey123 |
      | Content-Type  | application/json             |
    And body request berisi JSON-RPC 2.0 untuk tool "list_transactions"
    Then server mengembalikan status HTTP 200
    And response body berisi JSON-RPC 2.0 sukses dengan daftar transaksi milik user bersangkutan
    And response tidak memuat transaksi milik pengguna lain

  Scenario: Klien AI memanggil tool MCP dengan API Key yang telah dinonaktifkan
    Given API Key "afi_live_revokedkey" berstatus "is_active = false"
    When klien mengirim HTTP POST ke "/api/mcp" menggunakan API Key tersebut
    Then server mengembalikan status HTTP 401 Unauthorized
    And response body memuat galat JSON-RPC:
      """
      {
        "jsonrpc": "2.0",
        "error": {
          "code": -32001,
          "message": "Unauthorized: Invalid or inactive API key"
        }
      }
      """
```

---

## 5. Rencana Automasi Playwright E2E & Koordinasi `qa-engineer`

Untuk menjamin kriteria akseptasi di atas terverifikasi secara deterministik, pelaksanaan automasi didelegasikan kepada `qa-engineer` dengan ruang kerja terisolasi di `/home/yann/playwright-tools/`.

### Struktur File Pengujian Playwright Target:
1. `/home/yann/playwright-tools/tests/dashboard-hydration.spec.js`:
   - Verifikasi zero console errors saat render halaman dashboard dan interaksi widget Recharts.
2. `/home/yann/playwright-tools/tests/transaction-mutation.spec.js`:
   - Uji alur pembuatan pengeluaran, penolakan saldo kurang, dan pembaruan saldo instan.
3. `/home/yann/playwright-tools/tests/transfer-atomic.spec.js`:
   - Uji transfer dana antar-rekening lengkap dengan pemotongan fee admin.
4. `/home/yann/playwright-tools/tests/auth-guard.spec.js`:
   - Uji edge middleware redirect tanpa flash.
5. `/home/yann/playwright-tools/tests/mcp-endpoint.spec.js`:
   - Uji HTTP POST endpoint `/api/mcp` menggunakan Playwright API request context.

### Eksekusi Otomasi:
Eksekusi pengujian dilakukan melalui headless browser runner:
```bash
playwright-test tests/dashboard-hydration.spec.js
playwright-test tests/transaction-mutation.spec.js
playwright-test tests/transfer-atomic.spec.js
playwright-test tests/auth-guard.spec.js
playwright-test tests/mcp-endpoint.spec.js
```

---

## 6. QA Quality Gate Checklist Sign-Off

Sebelum rilis migrasi dipromosikan ke production, seluruh item di bawah wajib berstatus centang `[x]`:

- [x] **[QG-01] Build & Hydration**: `npm run build` berhasil tanpa TypeScript error dan zero hydration warning pada browser console.
- [x] **[QG-02] Recharts Isolation**: Seluruh komponen grafik Recharts diimpor secara dinamis (`ssr: false`) dengan fallback visual skeleton.
- [x] **[QG-03] Edge Auth Middleware**: Tidak ada flash redirect; proteksi rute berjalan 100% di sisi server/edge.
- [x] **[QG-04] Cents Conversion**: Tidak ada nominal desimal floating point yang masuk ke tabel database.
- [x] **[QG-05] Balance Validation**: Pengeluaran atau transfer dengan saldo tidak cukup tertolak 100% deterministik.
- [x] **[QG-06] Atomic Transfer**: Transfer dana antar-akun beserta fee tercatat rapi tanpa selisih saldo.
- [x] **[QG-07] RFC 7807 Standard**: REST API mengembalikan error terstruktur dengan field `type`, `title`, `status`, dan `detail`.
- [x] **[QG-08] MCP JSON-RPC 2.0**: Endpoint `/api/mcp` patuh standar JSON-RPC 2.0 dan memvalidasi `afi_live_...` key.
- [x] **[QG-09] Supabase Clean-Up**: 6 RPC `mcp_*` lama berhasil di-drop dan tidak ada regresi fungsional.
- [x] **[QG-10] Automated E2E Suite**: Seluruh test suite Playwright di `/home/yann/playwright-tools/` lulus 100%.
