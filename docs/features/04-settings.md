# ✨ Feature: Settings

## 1. Overview

Halaman Settings (`src/pages/Settings.tsx`) adalah pusat kontrol konfigurasi profil pengguna, preferensi aplikasi, regional/mata uang, pengaturan notifikasi, manajemen cadangan data, dan keamanan akun pada aplikasi **AI Business Finance Tracker**.

Desain antarmuka baru mengikuti arsitektur modular terpisah di direktori `src/components/settings/`, di mana kode antarmuka dipecah menjadi komponen *sections*, *widgets*, *dialogs*, dan *hooks* agar maintainability tetap tinggi dan kode tidak menumpuk dalam 1 file besar.

Seluruh navigasi sub-menu tetap berjalan di bawah URL utama `/settings` dengan query parameter `?tab=` untuk menjaga state navigasi yang bersih dan mendukung bookmarking.

---

## 2. Struktur Direktori Komponen Modular

```text
src/components/settings/
├── sections/                   # Komponen halaman sub-menu
│   ├── ProfileSection.tsx       # 1. Profile
│   ├── PreferencesSection.tsx   # 2. Preferences
│   ├── CurrencyRegionSection.tsx# 3. Currency & Region
│   ├── NotificationsSection.tsx # 4. Notifications
│   ├── DataManagementSection.tsx# 5. Data Management
│   └── SecuritySection.tsx      # 6. Security
├── widgets/                    # Widget independen & reusable
│   ├── ProfileInfoWidget.tsx    # Informasi foto, nama, email, phone, DOB
│   ├── AppPreferencesWidget.tsx # Tema (Light/Dark/System), landing page, switches
│   ├── CurrencyRegionWidget.tsx # Dropdown mata uang, format tanggal, timezone, bahasa
│   ├── QuickActionsWidget.tsx   # Widget aksi cepat (Export, Import CSV, Reset Data)
│   ├── AccountSecurityWidget.tsx# Widget status keamanan akun (Password, 2FA, Sessions)
│   ├── NotificationPrefsWidget.tsx # Sakelar preferensi notifikasi
│   ├── NotificationsHistoryWidget.tsx # Umpan riwayat aktivitas notifikasi dari DB
│   └── DataStatsWidget.tsx      # Ringkasan statistik penyimpanan akun
├── dialogs/                    # Dialog interaktif
│   ├── ChangePasswordDialog.tsx # Modal ubah kata sandi
│   ├── ImportCsvDialog.tsx      # Modal impor mutasi transaksi CSV
│   └── ResetDataConfirmDialog.tsx # Modal konfirmasi pembersihan data aman
├── hooks/                      # Custom hooks reaktif
│   ├── useUserProfile.ts        # Query & Mutation user_profiles + upload avatar
│   ├── useUserPreferences.ts    # Query & Mutation user_preferences
│   ├── useDataManagement.ts     # Export backup, import CSV, reset RPC
│   └── useAccountSecurity.ts    # Change password, MFA, active session
├── types.ts                    # Antarmuka TypeScript
├── constants.ts                # Opsi daftar mata uang, format tanggal, zona waktu
└── index.ts                    # Barrel export
```

---

## 3. Rincian Sub-Halaman & Widget

### 3.1 Profile
- **`ProfileInfoWidget`**:
  - Foto avatar profil dengan tombol kamera untuk mengunggah foto baru ke Supabase Storage bucket `avatars`.
  - Nama lengkap pengguna (`display_name`).
  - Alamat email (terkoneksi langsung ke Supabase Auth).
  - Nomor telepon dengan pemilih kode negara (default `+62`).
  - Tanggal lahir dengan pemilih kalender interaktif.
  - Tombol simpan perubahan (*Save changes*).
- Menampilkan widget **Quick Actions** dan **Account Security** pada tampilan beranda.

### 3.2 Preferences
- **`AppPreferencesWidget`**:
  - **Theme**: Pilihan mode tampilan *Light*, *Dark*, dan *System* yang langsung disinkronkan ke root stylesheet.
  - **Default landing page**: Halaman yang pertama kali dimuat setelah login (Dashboard, Accounts, Transactions, Budget, Categories).
  - **Items per page**: Jumlah data per halaman tabel (10, 25, 50, 100 items).
  - **Show account balance**: Sakelar untuk menampilkan/menyembunyikan nominal saldo.
  - **Show category icons**: Sakelar untuk menampilkan ikon kategori pada daftar transaksi.
  - **Compact mode**: Sakelar untuk tata letak tabel yang lebih rapat/kompak.
- Dilengkapi kartu **Live Display Preview** untuk melihat simulasi konfigurasi secara real-time.

### 3.3 Currency & Region
- **`CurrencyRegionWidget`**:
  - **Currency**: Pilihan mata uang default akun (IDR - Rupiah, USD, EUR, SGD, MYR).
  - **Date format**: Format tampilan tanggal (`DD MMM YYYY`, `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`).
  - **Time zone**: Zona waktu lokal (`Asia/Jakarta`, `Asia/Makassar`, `Asia/Jayapura`, `Asia/Singapore`, `UTC`).
  - **Language**: Bahasa antarmuka (`English`, `Bahasa Indonesia`).
- Kartu **Regional Formatting** menyajikan pratinjau format angka dan tanggal saat ini.

### 3.4 Notifications
- **`NotificationPrefsWidget`**:
  - Sakelar notifikasi email (*Email Notifications*).
  - Peringatan batas pagu anggaran (*Budget Limit Alerts* &gt; 80%).
  - Pengingat tagihan transaksi berulang (*Recurring Bill Reminders*).
  - Peringatan saldo akun menipis (*Low Balance Warnings*).
- **`NotificationsHistoryWidget`**: Menampilkan 5 riwayat peringatan sistem terkini langsung dari tabel database `public.notifications`.

### 3.5 Data Management
- **`DataStatsWidget`**: Menampilkan metrik jumlah transaksi, akun rekening/dompet, kategori, dan rencana anggaran yang tersimpan.
- **`QuickActionsWidget`**:
  - **Export Data**: Mengunduh cadangan lengkap seluruh data akun dalam format JSON atau CSV.
  - **Import Transactions**: Mengunggah file CSV mutasi transaksi dengan validasi header dan tanggal otomatis.
  - **Reset App Data**: Dialog konfirmasi penghapusan data dengan kode verifikasi ketik `RESET` dan pemanggilan RPC PostgreSQL atomik `reset_user_financial_data`.

### 3.6 Security
- **`AccountSecurityWidget`**:
  - **Change Password**: Membuka dialog pembaruan kata sandi Supabase Auth.
  - **Two-Factor Authentication (2FA)**: Memeriksa dan mengelola status proteksi MFA TOTP.
  - **Active Sessions**: Memeriksa sesi browser aktif yang sedang terhubung.
