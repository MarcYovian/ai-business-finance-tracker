# DESIGN — Personal Finance Management UI/UX Specification

> Version: 1.0 · Date: 2026-10-23 · Companion: `PRD.md` · Status: Ready for UI generation
>
> Visual inspiration: supplied ACRU dashboard screenshot. **Create an original design**, not a pixel-for-pixel clone. Preserve its high-level qualities: spacious white cards, quiet neutral canvas, slim navigation, high information density without clutter, chart-led overview, fresh lime/green accent, restrained typography.
>
> **Design choices below are proposals**, not facts extracted from the database. Backend capabilities and limits are in `PRD.md` and `02-database-and-rpc.md`.

## 1. Design direction

**Keywords:** calm, modern, trustworthy, approachable, organized, premium fintech, functional minimalism.

**Principles:**
1. **Clarity before decoration:** Financial numbers, trends and next actions dominate.
2. **One primary action per view:** Add Transaction is globally prominent; other CTAs are contextual.
3. **Progressive disclosure:** Dashboard is a summary; details live in dedicated pages.
4. **Honest finance:** Never represent mock data as live; never fake bank integration, payment card controls, or AI advice.
5. **Accessible by default:** Status is not color-only; 44px touch targets on mobile; meaningful text alternatives for charts.
6. **Mobile is not a shrunk desktop:** Reflow information, change table patterns, and prioritize essential actions.

## 2. Visual design tokens

### Color palette — light theme (primary)

| Token | Hex | Usage |
|---|---|---|
| `--bg-app` | `#F5F6F3` | App background |
| `--bg-sidebar` | `#FFFFFF` | Navigation surface |
| `--bg-card` | `#FFFFFF` | Cards/panels |
| `--bg-subtle` | `#F7F8F5` | Hover/secondary surface |
| `--text-primary` | `#18211C` | Main headings and money |
| `--text-secondary` | `#66736B` | Supporting labels |
| `--text-muted` | `#89958C` | Timestamps and hints |
| `--border` | `#E7ECE6` | Dividers/card borders |
| `--accent` | `#9CD447` | Brand accent, chart highlight |
| `--accent-hover` | `#8BC43A` | Accent hover |
| `--accent-soft` | `#EFF8DE` | Selected nav, success-soft |
| `--accent-ink` | `#24351A` | Text on bright accent |
| `--positive` | `#31845B` | Positive finance values |
| `--negative` | `#C65D51` | Expense/negative finance values |
| `--warning` | `#C38A2B` | Budget near limit |
| `--info` | `#527BA8` | Neutral info |
| `--chart-income` | `#9CD447` | Income series |
| `--chart-expense` | `#F0AD72` | Expense series |
| `--chart-balance` | `#4E8B74` | Balance series |

**Contrast rule:** Lime accent is NOT used as tiny text on white; use dark text on lime-filled buttons, or darker positive green for text. Validate actual contrast to WCAG AA.

### Dark theme (optional P2)
`--bg-app:#111714`, `--bg-sidebar:#17201B`, `--bg-card:#1C2620`, `--bg-subtle:#243027`, `--text-primary:#F1F5EE`, `--text-secondary:#B1BFB5`, `--border:#334239`, `--accent:#A8DC59`. Only implement dark mode if complete token and chart contrast coverage is possible; default to light.

### Typography
- Preferred: **Inter** or **Plus Jakarta Sans** with system sans fallback; do not depend on a paid font.
- Main page heading: 28px/36px, weight 650–700 desktop; 24px/32px mobile.
- Section heading: 18px/26px, weight 650.
- Card title: 14px/20px, weight 600.
- KPI: 30–36px/1.15 desktop; 25–30px mobile, weight 700, `font-variant-numeric: tabular-nums`.
- Body: 14px/22px; secondary 12–13px/18px; never below 12px for core content.
- Use Indonesian UI copy, e.g., “Ringkasan Keuangan”, “Tambah Transaksi”, “Pemasukan”, “Pengeluaran”, “Transfer”, “Sisa Anggaran”. Keep technical route names in English internally.

### Spacing, shape, shadow
- Base spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48` px.
- Cards: 16px radius, 1px border, subtle shadow `0 4px 20px rgba(22,40,28,.035)`.
- Controls: 10–12px radius; pill filters only when appropriate.
- App shell outer radius: 20px on large desktop when inset; mobile app fills viewport.
- Card padding: 20–24px desktop, 16px mobile; section gaps 16–24px.
- Avoid thick borders, excessive gradients, glassmorphism, and loud shadows.

## 3. Responsive layout and breakpoints

| Viewport | Navigation | Grid | Spacing |
|---|---|---|---|
| `>=1440px` | 232px persistent sidebar | 12-column, 20px gutters | 28–32px content padding |
| `1024–1439px` | 216px sidebar | 12-column, 16px gutters | 24px |
| `768–1023px` | 72px icon sidebar or drawer | 8-column | 20px |
| `<768px` | Header + bottom navigation + More drawer | 4-column; stacked content | 16px |

**Max content width:** 1600px centered; do not create vast blank margins on typical laptop screens.

**Desktop shell:** Sidebar left, topbar right, content below. Topbar: page context/breadcrumb, optional scoped search, Add Transaction, notification bell, avatar. Sidebar groups: Overview, Finance, Insights, System. Active route gets pale lime background and dark text/icon; hover uses subtle neutral.

**Mobile shell:** Compact top header with page title, bell, avatar. Bottom nav: Beranda, Transaksi, Akun, Anggaran, Lainnya. “Lainnya” exposes Goals, Recurring, Analytics, Settings. Add Transaction via prominent floating button or header CTA; never obscure list rows or bottom nav. Filters open bottom sheet. Transaction table becomes stacked transaction cards.

## 4. Page-specific layout specs

### 4.1 Dashboard `/dashboard`

**Desktop 12-column wireframe:**

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Ringkasan Keuangan         [Periode: Oktober 2026 ▼]  [+ Tambah Transaksi]│
├─────────────────┬─────────────────┬─────────────────┬───────────────────┤
│ Total Saldo     │ Pemasukan       │ Pengeluaran     │ Arus Kas Bersih   │
│ Rp xx.xxx.xxx   │ Rp xx.xxx.xxx   │ Rp xx.xxx.xxx   │ +Rp xx.xxx.xxx    │
├───────────────────────────────────────────┬───────────────────────────────┤
│ Cash Flow Overview (8 cols)               │ Akun Saya (4 cols)           │
│ income/expense line or bar chart          │ bank, wallet, cash summary   │
├───────────────────────────┬───────────────┴───────────────────────────────┤
│ Pengeluaran per Kategori  │ Anggaran Bulan Ini + progress                 │
├───────────────────────────┼───────────────────────────────────────────────┤
│ Target Keuangan           │ Transaksi Terbaru                             │
└───────────────────────────┴───────────────────────────────────────────────┘
```

- KPI cards: one bold value, concise label, contextual trend **only if comparable period data exists**.
- Chart: toggles 7 hari / 30 hari / 12 bulan only if underlying query supports each granularity; axis labels, tooltip, legend, accessible table alternative.
- Accounts widget: bank/e-wallet/cash icons and actual ledger balances, NOT mock VISA card images or payment actions.
- Budget widget: utilization bar with category label and remaining amount; click navigates to `/budgets`.
- Goals widget: progress cards and target date; click navigates to `/goals`.
- Transactions: last 5–7 records with type icon, description, category/account, date, amount, and “Lihat Semua”.
- Mobile order: page title → balance KPI → income/expense mini KPIs → cash flow chart → quick add → budget → recent transactions → goals/accounts. No horizontal chart clipping.

### 4.2 Transactions `/transactions`

**Header:** title, short explanation, `+ Tambah Transaksi`.
**Toolbar:** search, period/date range, type tabs, account, category, status, reset filters.
**Desktop list columns:** Date, Transaction (icon + description), Category, Account, Type/Status, Amount, Actions. Sticky header if list scrolls. Right-aligned tabular numeric amounts.
**Mobile:** Each row becomes a card: icon + description + amount on first line, date/category/account below, status badge. Tap opens detail drawer/page.
**Add/Edit flow:** Segmented Income | Expense | Transfer. Dynamic fields. Amount large and first. Transfer shows From/To account selectors, optional fee and “Total debited” preview. Footer: Cancel / Save; loading state disables duplicate submits. Delete requires confirmation.
**Visual semantics:** Income `+` and positive ink, expense `−` and negative ink, transfer neutral icon and label; do not use red/green alone.

### 4.3 Accounts `/accounts`

**Header:** `Akun & Dompet`, total of comparable currency accounts, `+ Tambah Akun`.
**Grid:** 3 cards per row large desktop, 2 tablet, 1 mobile. Each card shows icon, account name, type, currency, balance, optional activity count. Use restrained flat colored icon containers, not fake bank-brand marks or card numbers.
**Detail:** balance header, active state, recent account transactions, edit/deactivate actions. Provide warnings on linked transactions. Multi-currency: group by currency or show separate totals; do not sum unconverted currencies.

### 4.4 Budgets `/budgets`

**Header:** `Anggaran`, period switcher, `+ Buat Anggaran`.
**Top:** total planned, total spent, remaining, utilization percentage.
**Body:** budget cards and/or category rows with icon, category, planned, spent, remaining, progress bar. Status: safe < threshold, warning >= threshold, exceeded >100% (threshold is configurable). Detail/edit view allows allocation input and threshold adjustment only if supported by selected API.
**Mobile:** one-column progress rows; compact totals; edit allocations in full-screen drawer.

### 4.5 Financial Goals `/goals`

**Header:** `Target Keuangan`, `+ Tambah Target`.
**Grid:** 2–3 cards per row, each with icon, name, current/target, progress %, deadline, remaining days, status. Include on-track indicator from `get_goals_with_progress()` when available.
**Detail:** goal overview, description, progress history only if data exists; otherwise no invented timeline. If manual progress edit is used, label clearly “Perbarui progres”.

### 4.6 Recurring `/recurring`

**Header:** `Transaksi Berulang`, `+ Tambah Jadwal`.
**Sections:** upcoming next executions, active patterns, paused patterns. Row shows name, amount, frequency, source/destination, next date, active toggle.
**Caution:** Do not show “auto-paid” or “payment succeeded” without verified backend scheduler and transaction status. Display a neutral “Terjadwal” state otherwise.

### 4.7 Analytics `/analytics`

**Header:** `Analisis Keuangan`, date filter, optional comparison toggle.
**Layout:** income vs expense trend (full-width or 8 cols), category donut/bar (4 cols), top categories, monthly comparison, account breakdown. Use charts with readable axis labels and tooltips; add a tabular accessible summary.
**No fabricated precision:** Trends and comparison metrics require actual time series queries; mock data is demo-only.

### 4.8 Notifications `/notifications`

**Header:** `Notifikasi`, unread count, `Tandai Semua Dibaca`.
**Tabs:** Semua | Belum Dibaca. Group by day. Each item: contextual icon, title, description, timestamp, unread dot, link. Header bell shows unread count; dropdown displays recent 4–5 and link to all.

### 4.9 Settings `/settings`

**Tabs or vertical subnav:** Profil, Kategori, Preferensi.
**Profile:** display name, avatar, default currency; account/auth settings only if Supabase Auth flows are implemented.
**Categories:** separate Pemasukan/Pengeluaran tabs; hierarchical list, icon/color, active state, add/edit/deactivate. Explain impact before deleting a referenced category.
**Preferences:** appearance and locale as UI preferences; do not claim DB persistence unless implemented.

## 5. Reusable component library

| Component | Variants / states | Rules |
|---|---|---|
| `AppShell` | desktop/tablet/mobile | Sidebar + header + content + bottom nav |
| `SidebarNavItem` | default/hover/active/disabled | Icon + label + accessible active state |
| `PageHeader` | title/subtitle/actions | Align controls without crowding |
| `MetricCard` | default/positive/negative/loading | Label, numeric value, optional contextual delta |
| `FinanceAmount` | income/expense/transfer/private | Tabular numerals, locale, explicit sign |
| `AccountCard` | active/inactive/loading | No payment card UI without capability |
| `TransactionRow` | desktop/mobile | Type, description, account, date, amount |
| `BudgetProgress` | safe/warning/exceeded/empty | Label and numeric %, not color only |
| `GoalCard` | active/paused/completed/overdue | Progress and target date |
| `RecurringRow` | active/paused/upcoming | Next execution and frequency |
| `ChartCard` | loading/empty/error/populated | Legend, tooltip, period, fallback table |
| `FilterBar` | desktop/mobile-sheet | Persist selections during navigation where sensible |
| `MoneyInput` | default/error/disabled | Locale-friendly input, canonical unit conversion |
| `Dialog/Drawer` | create/edit/confirm | Focus trap, escape, safe close behavior |
| `Toast` | success/error/info | Success only after server confirms |
| `EmptyState` | onboarding/no-results | Useful CTA, never fake transactions |
| `Skeleton` | cards/list/charts | Layout stable during load |

## 6. Interaction patterns

- **Buttons:** Primary filled dark `#18211C` with white text or lime `#9CD447` with dark text; choose one consistent primary treatment. Secondary outlined neutral; tertiary text; destructive red with confirmation.
- **Inputs:** 44px min height desktop; 48px mobile. Persistent labels, inline help and errors. Monetary fields show currency prefix; negative entry disallowed for transaction amount (type controls direction).
- **Modals:** Desktop centered up to 560px for transaction form; on mobile use full-screen sheet with sticky footer and safe-area padding.
- **Dropdowns:** Keyboard operable; long account/category lists searchable.
- **Hover:** 150–200ms subtle transitions; respect `prefers-reduced-motion`.
- **Table:** Row hover + focus, clear sort indicators, pagination or virtualized list for large data; no arbitrary unbounded fetch.
- **Privacy toggle:** Eye icon masks all monetary values consistently within current view; state persistence optional and explicitly implemented.
- **Date filters:** Visible start/end and timezone assumptions. Avoid misleading current-balance changes when selecting a historical income/expense period.

## 7. Status, data visualization and formatting

- Positive income: leading `+`; expense: leading `−`; transfer: neutral `↔` or directional icon, not counted as income.
- Budget threshold: use progress color + text (“Aman”, “Mendekati Batas”, “Melebihi Anggaran”).
- Currency: Indonesian grouping separators and currency labels; monetary scale must be resolved against database convention before API integration.
- Dates: `23 Okt 2026` in list, `23 Oktober 2026, 14.30` in detail.
- Chart lines: 2–3px; gridlines faint; tooltip includes full currency and period; use 2–5 meaningful categories, aggregate remainder as “Lainnya” only if mathematically accurate.
- Use illustrations sparingly. Icons should be Lucide or equivalent; consistent 18–20px stroke icons.

## 8. Empty, loading, error and privacy states

**First-time dashboard:** “Mulai catat keuanganmu” with `Tambah Akun` CTA, followed by `Catat Transaksi` after account setup. Do not show imaginary balances.

**No results after filtering:** “Tidak ada transaksi yang cocok” + `Reset Filter`.

**Loading:** Skeletons sized like final cards/table rows, no flashing numbers.

**Error:** Short human-readable message + Retry; preserve form entries. Auth expiry redirects through a proper sign-in flow.

**Partial data:** Show successfully loaded widgets while an individual widget displays its own retry/error state.

**Privacy:** Avoid full account numbers, secret tokens, sensitive details in fixtures, logs, or generated screenshot data.

## 9. Recommended frontend organization (framework-agnostic)

```text
src/
  app/ or routes/
    dashboard/
    transactions/
    accounts/
    budgets/
    goals/
    recurring/
    analytics/
    notifications/
    settings/
  components/
    layout/           # AppShell, Sidebar, Topbar, MobileNav
    ui/               # Button, Input, Dialog, Badge, Tabs, Skeleton
    finance/          # MetricCard, MoneyInput, AccountCard, TransactionRow
    charts/           # CashFlowChart, CategoryChart
  features/
    transactions/     # forms, validation, queries, mutations
    accounts/
    budgets/
    goals/
    recurring/
  lib/
    finance-format.ts # money/date display + scale conversion
    supabase/         # typed client and verified RPC wrappers
  styles/
    tokens.css
```

**Generator may adapt file structure to the project's existing framework.** Do not migrate the stack or invent libraries without examining the repository. Use the project's current router, styling conventions, and Supabase client when available.

## 10. Screen generation sequence

1. Generate tokens, AppShell, Sidebar, Topbar, MobileNav, core UI primitives.
2. Generate Dashboard with realistic **explicitly labeled sample** data and responsive layouts.
3. Generate Transactions including three dynamic form types and details.
4. Generate Accounts and Budgets with their forms and progress states.
5. Generate Settings and Categories.
6. Generate Goals, Recurring, Notifications, Analytics.
7. Add empty/loading/error/permission states, keyboard access, and mobile QA.
8. Replace demo adapters with verified Supabase queries and RPCs **only after** checking contracts and permissions.

## 11. UI generation prompt (copy/paste)

> Build a polished, responsive **personal finance management web app** using `PRD.md` as the product and backend contract and `DESIGN.md` as the visual design specification. Use the provided ACRU screenshot only as visual inspiration for calm fintech layout, white cards, left sidebar, restrained lime accents, and chart-first dashboard; create an original interface. The app is for individuals, not business finance. Implement routes Dashboard, Transactions, Accounts & Wallets, Budgets, Financial Goals, Recurring Transactions, Analytics, Notifications, and Settings/Categories. Desktop has a grouped sidebar and topbar; mobile has compact header and bottom navigation. Build interactive flows and complete loading, empty, error and success states. Use Indonesian copy and IDR formatting. Use clearly marked demo data if real integration is unavailable. Do not invent bank sync, card payment actions, investment trading, AI financial advisor, or automatic recurring execution. Do not write directly to account balances. Respect documented Supabase schema/RPC contracts and flag any unverified behavior as an integration TODO. Prioritize usability, accessibility, responsive quality, and a consistent design system.

## 12. Visual QA checklist

- [ ] Clear hierarchy at 1440, 1280, 1024, 768, 390 and 360px.
- [ ] Sidebar never crowds content; mobile bottom navigation has safe-area padding.
- [ ] KPI figures remain legible and do not overflow.
- [ ] Chart axes, legends and tooltips are usable on touch devices.
- [ ] Tables become readable cards on mobile; no accidental horizontal page scroll.
- [ ] Form fields and validation are usable on mobile keyboard.
- [ ] Every action has a functional destination or is explicitly disabled with explanation.
- [ ] No misleading fake card/bank/transfer capabilities.
- [ ] Status and charts remain interpretable without color.
- [ ] All pages share spacing, type scale, icon style and component behavior.

---

**Design system is intentionally implementation-neutral.** Follow existing repository technology; `PRD.md` and `02-database-and-rpc.md` take precedence for financial behavior and data integrity.
