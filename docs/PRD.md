# PRD — Personal Finance Management

> Version: 1.0 · Date: 2026-10-23 · Status: UI generation specification · Language: Indonesian-first
>
> **Sources:** `02-database-and-rpc.md` (backend source of truth), user-provided ACRU dashboard screenshot (visual reference), and agreed product direction: **personal finance for individuals, not business accounting**.
>
> **Interpretation:** Statements marked **[DB]** are grounded in the database document; **[PRODUCT]** are proposed product decisions; **[FUTURE]** require additional backend capability or verification. This PRD does not claim the frontend has been implemented.

## 1. Product summary

Build a responsive web app that helps individuals understand where their money is, record money movement, plan spending, and achieve savings goals. Redesign the existing four-menu application (Dashboard, Transaction, Budget, Settings) into a clear, accessible personal finance workspace inspired by the reference dashboard's restrained cards, sidebar, visual hierarchy, and lime-green accents. **Do not copy the reference brand, fictitious payment-card capabilities, or payment-network features.**

### Goals
1. See account balances, monthly income, expenses, and net cash flow within seconds.
2. Record income, expense, and transfers with confidence that account balances stay consistent.
3. Understand and control spending through category budgets and alerts.
4. Track savings goals and upcoming recurring commitments.
5. Discover trends through lightweight analytics, without overwhelming the dashboard.
6. Provide excellent desktop, tablet, and mobile experiences.

### Non-goals (initial release)
Bank sync, contact-to-contact payments, virtual cards, stock/investment trading, loans/debt amortization, OCR receipts, AI recommendations, tax filing, shared household wallets, and enterprise accounting. These are **not** implied by the existing database.

### Target users
- Individual salaried worker with multiple bank/e-wallet/cash balances.
- Student or young professional trying to maintain a budget.
- Freelancer managing *personal* irregular income (not invoicing/business bookkeeping).

### Success criteria (proposed product metrics)
- A first-time user can add an account and first transaction without instructions.
- A returning user can understand monthly cash flow in under 10 seconds.
- Common actions (add expense/income/transfer) take at most one primary action from dashboard or Transactions.
- All supported screens work at 360px width and with keyboard navigation.
- No fabricated financial data in production empty states; demo mode clearly labels sample data.

## 2. Information architecture

**Main sidebar (desktop):**

```text
OVERVIEW
  Dashboard                     /dashboard
FINANCE
  Transactions                  /transactions
  Accounts & Wallets            /accounts
  Budgets                       /budgets
  Financial Goals               /goals
  Recurring Transactions        /recurring
INSIGHTS
  Analytics & Reports           /analytics
SYSTEM
  Settings                      /settings

HEADER (global): Search (scoped/optional), Notifications bell (/notifications), user menu, Add Transaction CTA
SETTINGS SUBNAV: Profile (/settings/profile), Categories (/settings/categories), Preferences (/settings/preferences)
```

**Navigation decision:** Nine *logical* pages including Notifications and Settings, but eight visible primary sidebar entries; Notifications is accessed from the header bell. Account details, budget details, goal details, and transaction details are child routes or dialogs, not extra top-level sidebar items.

### Routes and source mapping

| Route | Primary user intent | Source of truth | Release |
|---|---|---|---|
| `/dashboard` | See financial health at a glance | `get_dashboard_summary()`, `get_monthly_spending()`, `get_goals_with_progress()`, `transactions`, `fund_sources` | P0 |
| `/transactions` | Find, add, edit, delete transactions | `transactions`, transaction mutation RPCs, `categories`, `fund_sources` | P0 |
| `/accounts` | Manage bank, wallet, cash, card sources | `fund_sources`, `transactions` | P0 |
| `/budgets` | Plan and compare category spending | `budgets`, `budget_items`, budget RPCs | P0 |
| `/goals` | Track savings goals | `financial_goals`, `get_goals_with_progress()` | P1 |
| `/recurring` | Manage recurring patterns | `recurring_patterns` | P1 |
| `/analytics` | Review cash flow and spending breakdown | `transactions`, `get_monthly_spending()`; custom queries for time series | P2 |
| `/notifications` | Read and acknowledge alerts | `notifications`, notification RPCs | P1 |
| `/settings/*` | Manage profile, categories, currency preference | `user_profiles`, `categories`, Supabase Auth | P0 |

## 3. Functional requirements

### FR-01 Dashboard (P0)
**Widgets:** Total Balance, Monthly Income, Monthly Expenses, Monthly Net Cash Flow; time-series income/expense chart; Spending by Category; Budget Utilization; Savings Goal Progress; Recent Transactions; Accounts Snapshot. Use selectable month and, where supported, a comparison period. Show money in IDR by default.

**Behavior:** A date-range selector updates all *period-dependent* metrics consistently. Distinguish total balance (current snapshot) from period totals (income, expenses, net flow). Never include internal transfers as income or expenses; transfer fees count as expenses. Use appropriate loading, error, empty, and partial-data states. Recent transactions link to transaction detail.

**Data:** `get_dashboard_summary()` returns `total_balance`, `total_income`, `total_expense`, `net_flow`, active budget/goal counts, and account count [DB]. Its exact date semantics should be verified before using it as a monthly metric; use date-filtered aggregation if needed [PRODUCT]. `get_monthly_spending(year,month)` returns category spending [DB]. Trend series across days/months require additional queries [PRODUCT].

**Acceptance:** Metric labels have explicit period; charts never present illustrative values as real; all cards have useful drilldowns.

### FR-02 Transactions (P0)
**Views:** Searchable, sortable transaction table/list; filters by type (All/Income/Expense/Transfer), date, account, category, and status; transaction detail; Add/Edit transaction modal or drawer; Delete confirmation.

**Form:** Type, amount, date/time, description, category for income/expense, source account for expense, destination account for income, both accounts for transfer, optional transfer fee, notes where supported. Display `completed`, `pending`, `failed` status [DB]. For transfers, destination must differ from source [PRODUCT validation].

**Ledger rules [DB]:** `income` requires destination fund and income category; `expense` requires source fund and expense category; `transfer` requires source + destination and no category. Amount > 0. Fee is represented as a linked child expense transaction. Mutations MUST use documented balance-aware RPCs; do not directly mutate `fund_sources.balance` from frontend. Display transfer fee as a detail line rather than double-counting the transfer itself as an expense.

**Implementation caveat:** Compatibility RPC signatures and native RPC signatures differ. Select and test one canonical mutation pathway before binding UI. Notes and status edits may not be supported by every compatibility RPC. Verify auth ownership and concurrency safeguards in SECURITY DEFINER RPCs.

**Acceptance:** Account balance refreshes after success; server error is surfaced without optimistic false success; deletion warns that balances will be reverted; transaction list shows meaningful empty and filtered-empty states.

### FR-03 Accounts & Wallets (P0)
**Views:** Cards/list for bank, wallet, cash, credit card, other; balance and currency; active/inactive state; account detail with transaction history; Add/Edit account; deactivate rather than destructive delete where linked transactions exist.

**Data [DB]:** `fund_sources(id,user_id,name,type,balance,currency,description,is_active,...)`. `balance` is a maintained ledger field; changing it directly from client is forbidden. **Do not invent bank integrations, physical/virtual card numbers, card controls, or payment functionality.** The `credit_card` type is a bookkeeping source, not proof of credit-limit/billing-cycle modeling.

**Acceptance:** Accounts total excludes inactive accounts only according to a clearly stated product rule; multi-currency amounts must not be summed without conversion (FX support is not documented). For MVP, clearly separate currencies or restrict aggregate totals to default currency.

### FR-04 Budgets (P0)
**Views:** Budget list and period selector; budget detail with category allocation rows; planned, spent, remaining, utilization percentage; Add/Edit budget and allocations; threshold warnings; active/inactive status.

**Data [DB]:** `budgets` support monthly/quarterly/yearly periods, `total_limit`, `alert_threshold`; `budget_items` have category, planned and spent amounts. RPCs include `get_budget_spending_details`, `get_budget_spending_summary`, `get_budget_details`, `upsert_budget_with_items`, `refresh_budget_spending`. Expense changes trigger budget spending updates.

**Business rules:** Percent used = spent/planned ×100 when planned >0; distinguish zero-allocation as N/A. Show warning at threshold and danger when over 100%. Budget detail must not count transfers as spending. Avoid creating multiple overlapping budgets with confusing totals; if overlaps are supported, label their scopes.

**Known backend issues to validate:** Documented `get_or_create_budget_for_month` inserts `total_limit=0` while schema requires `total_limit>0`; `upsert_budget_with_items` uses `ON CONFLICT(id)` without a supplied id, which may not update an existing budget as intended. Verify and resolve before relying on edit flows. Documented `get_budget_details` uses timestamp BETWEEN dates; confirm inclusive end-date behavior. Do not silently assume these are resolved.

### FR-05 Financial Goals (P1)
**Views:** Goal cards with name, target, current progress, target date, status (`active`, `completed`, `paused`), priority; goal detail and add/edit; progress and days remaining; on-track indicator.

**Data [DB]:** `financial_goals` and `get_goals_with_progress()`.

**Caveat:** `current_amount` is stored independently; no documented goal contribution ledger or automatic linkage from transactions to goals. For MVP, progress can be edited manually with clear UI copy; do not claim transfers automatically fund a goal [FUTURE].

### FR-06 Recurring Transactions (P1)
**Views:** List of recurring patterns, next execution date, frequency/interval, amount, type, account, active state; add/edit/pause; upcoming schedule preview.

**Data [DB]:** `recurring_patterns` supports daily/weekly/monthly/yearly, interval, next_execution_date, start/end dates, income/expense/transfer. `transactions.recurring_pattern_id` can link generated entries.

**Critical distinction:** A database pattern is not evidence that a scheduler is active. If execution service is not verified, label items **Scheduled patterns** and do not promise automatic debits; provide optional manual confirmation [PRODUCT]. Never silently charge an account based only on the UI.

### FR-07 Analytics & Reports (P2)
**Views:** Monthly income vs expense trend, cash flow trend, category donut/bar, top spending categories, account-based spending, period comparison, transaction count. Date filters with consistent date semantics.

**Data:** `get_monthly_spending` supports monthly category totals [DB]; time-series and period-over-period comparisons need aggregation queries/views [PRODUCT]. CSV export is optional [FUTURE] and must be labeled as such if not built.

**Acceptance:** Charts show units, periods, accessible text alternatives, and no misleading aggregation; transfers excluded from income/expense analysis except fee expense.

### FR-08 Notifications (P1)
**Views:** Bell badge, notification dropdown preview, full notification center; unread/all tabs; mark one/all as read; deep link to related entity.

**Data [DB]:** `notifications` and RPCs `mark_notification_read`, `mark_all_notifications_read`, `get_unread_notifications_count`. Documented triggers include budget alerts, low balance, goal milestones. Handle empty and no-unread states.

### FR-09 Settings & Categories (P0)
**Profile:** Display name, avatar, default currency [DB]. **Categories:** income/expense, hierarchical parent-child, name, color, icon, sort order, active state [DB]. **Preferences:** appearance, locale, number formatting are UI/local preferences [PRODUCT], not documented persisted database columns. Security/auth controls depend on Supabase Auth, not `user_profiles` alone.

**Acceptance:** Categories used in transactions cannot be silently deleted with data loss; prefer deactivate. Default currency does not automatically convert historical balances.

## 4. Global interaction requirements

- **Primary CTA:** “+ Add Transaction” in desktop header; compact floating action or bottom-nav action on mobile.
- **Navigation:** Active item clearly indicated; breadcrumbs for detail pages; responsive collapsible sidebar; mobile bottom nav limited to Dashboard, Transactions, Accounts, Budgets, More.
- **Search:** Global search is optional; if shown, it must work or be clearly scoped. No decorative fake search field.
- **Feedback:** Loading skeletons, empty states with clear CTA, retry on network errors, inline validation, success toast only after confirmed server success, destructive confirmation.
- **Currency:** Format via `Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})` for integer-rupiah display **only after resolving DB monetary scale**. The source document describes integer cents and gives `Rp 50.000,00 → 5000000`; do not assume stored bigint equals whole rupiah. Centralize conversion and test examples.
- **Time:** Store/handle transaction dates as `timestamptz`; display user-local time; consistent period boundaries and time zone.
- **Privacy:** Mask balances option [PRODUCT], no real account identifiers in screenshot fixtures, RLS per authenticated user [DB].
- **Accessibility:** WCAG 2.2 AA target; semantic headings, visible focus, color-independent statuses, keyboard-operable dialogs and charts, reduced-motion support.
- **Security:** Never trust client-supplied `user_id` in SECURITY DEFINER functions without server-side `auth.uid()` ownership checks; verify ownership for referenced account/category/transaction/budget IDs. RLS alone does not replace function authorization.

## 5. User journeys

**A. First-time setup:** Sign up/sign in → empty Dashboard → Add first account → Add income or expense → see updated balance and dashboard.

**B. Daily expense:** Click Add Transaction → Expense → amount + category + source + date → Save → confirm → update transactions, account, budget and dashboard.

**C. Move money:** Transactions → Transfer → source + destination + amount + optional fee → review → save → account balances change; transfer excluded from income/expense totals.

**D. Budgeting:** Budgets → Create monthly budget → allocate category amounts → view usage → receive warning when threshold reached (subject to verified trigger behavior).

**E. Goal:** Goals → Create emergency fund target → set target date → manually update current progress (until goal-contribution flow exists) → see goal card on dashboard.

## 6. UI states and edge cases

| Area | Edge case | Required UI |
|---|---|---|
| Dashboard | New account/no transactions | Helpful onboarding, zero state, no fake trends |
| Transactions | Insufficient source balance | Show backend validation error, keep entered form values |
| Transactions | Pending/failed status | Distinct badge; clarify whether included in balances/analytics after backend verification |
| Transactions | Transfer with fee | Show transfer and linked fee clearly; no double count |
| Accounts | Multiple currencies | No invalid sum; label currency per account |
| Budgets | 0 planned allocation | N/A percentage, no divide-by-zero |
| Budgets | >100% spent | Over-budget status and actual overage |
| Goals | Past target date | Overdue indicator without changing stored status automatically |
| Recurring | Scheduler unavailable | No misleading “automatically paid” message |
| Notifications | Broken deep link | Graceful fallback to notification detail |
| All | Slow or failed request | Skeleton, retry, retained filters where possible |

## 7. Implementation phases

**P0 — Core redesign:** App shell, Dashboard, Transactions, Accounts, Budgets, Settings/Categories, shared components, mobile responsive, accessible states, backend RPC audit.

**P1 — Planning:** Financial Goals, Recurring Patterns, Notifications, polished dashboard previews.

**P2 — Insights:** Analytics & Reports, richer time series, period comparison, optional export after data-query verification.

## 8. Data and integration contracts

- Supabase PostgreSQL 15+ and Supabase Auth are documented [DB].
- User-scoped entities: `user_profiles`, `fund_sources`, `categories`, `transactions`, `budgets`, `recurring_patterns`, `financial_goals`, `notifications`; `budget_items` inherits ownership through `budgets` [DB].
- Ledger mutation must be server-side atomic [DB]. Never write directly to balances [DB].
- `get_dashboard_summary()` returns totals/counts; `get_monthly_spending(year,month)` returns category totals; `get_goals_with_progress()` returns progress metrics [DB].
- Some RPC descriptions and SQL definitions may diverge; verify signatures, grants, actual deployed behavior and time scopes before integrating.
- The design generator may use **clearly marked mock data** for visual prototyping. Real application integration must bind to verified schema and RPC behavior.

## 9. Acceptance checklist for generated UI

- [ ] Every primary route renders and navigates correctly.
- [ ] Desktop sidebar, tablet collapsed sidebar, mobile bottom navigation work.
- [ ] Consistent tokens and components from `DESIGN.md`.
- [ ] All finance values use consistent localized formatting and sign conventions.
- [ ] Income, expense, and transfer have distinct creation flows.
- [ ] All screens have loading, empty, error, and populated states.
- [ ] Forms validate fields, preserve state on error, and confirm destructive actions.
- [ ] No invented payments, cards, investments, or AI advisor features.
- [ ] Sample data is labeled demo/placeholder; never implied to be connected financial data.
- [ ] No direct balance writes; integration TODOs explicitly marked.
- [ ] Mobile usable at 360px and keyboard accessible.

## 10. Open questions / decisions before production

1. What is the canonical monetary unit and scale per currency in the deployed DB? The document uses integer cents and an IDR example with a 100× scale.
2. Are pending and failed transactions included in balance, budget, and dashboard aggregations?
3. Is recurring execution handled by a deployed scheduler, or only stored as patterns?
4. How should goal `current_amount` be updated: manual entry or a future contributions ledger?
5. Are multi-currency conversions in scope? None are documented.
6. Which of the two sets of transaction RPCs is canonical in the deployed app?
7. Are overlapping budgets allowed and how should they be summarized?
8. Verify `get_or_create_budget_for_month`, budget upsert semantics, and inclusive end dates before production integration.

---

**Instruction to UI generator:** Read `DESIGN.md` together with this PRD. Generate all specified routes with realistic **demo** data and complete interactive UI states. Treat DB-backed behaviors as integration contracts, not evidence that live API access is available. Never add unrequested product domains.
