Tentu, sebagai programmer, saya akan menyelesaikan dokumentasi teknis Anda dan memberikan rekomendasi lokasi penyimpanannya.

Dokumen `BUDGET_INTEGRATION.md` ini adalah contoh dokumentasi teknis internal yang sangat baik.

---

### **1. Konten Lengkap untuk `BUDGET_INTEGRATION.md`**

Berikut adalah isi file yang sudah saya lengkapi. Anda bisa langsung menyalin dan menempelkannya.

```markdown
# 💰 Budget Integration - Transaction Dialog

## 🎯 Overview

The budget integration feature provides **real-time feedback** to the user about the impact of a transaction on their budget **as they type**. The system will display an automatic visualization and warning system.

---

## ✨ Features

### 1. **Real-Time Budget Impact Visualization**

- ✅ Progress bar showing budget utilization.
- ✅ Automatically updates as the user changes the amount or category.
- ✅ Displays spent vs. budgeted amounts.
- ✅ Calculates the remaining budget.

### 2. **Smart Warning System**

3 levels of warnings based on budget usage:

#### 🟢 **Within Budget** (0-80%)
```

✓ Within budget limits
Progress Bar: Blue (Primary)

```

#### 🟡 **Near Limit** (81-100%)
```

⚠ Near Budget Limit\! You're approaching your budget limit.
Progress Bar: Yellow
Border: Yellow (warning)

```

#### 🔴 **Over Budget** (>100%)
```

⚠ Over Budget\! This expense will exceed your budget by Rp XXX.
Progress Bar: Red
Border: Red (destructive)

````

### 3. **Smart Context Awareness**
- ✅ The budget is calculated based on the **transaction's month**.
- ✅ When editing a transaction, the original amount is temporarily excluded from the "spent" total to give an accurate impact preview.
- ✅ The feature only appears for **expense** transactions with a selected category.
- ✅ Income and Transfer types do not show budget information.

### 4. **Visual Components**

```tsx
┌─────────────────────────────────────────┐
│ Budget Impact         Food & Dining     │
├─────────────────────────────────────────┤
│ ⚠ Over Budget!                          │
│ This expense will exceed your budget    │
│ by Rp 50.000                            │
├─────────────────────────────────────────┤
│ █████████████████████████ 110%          │
├─────────────────────────────────────────┤
│ ↓ Spent: Rp 550.000   Budgeted: 500K   │
│         Over by: Rp 50.000              │
└─────────────────────────────────────────┘
````

---

## 🔧 Implementation Details

### Budget Calculation Logic (`useMemo` Hook)

The core logic is encapsulated in a `useMemo` hook within `TransactionDialog.tsx` to ensure efficient re-calculation only when relevant dependencies change.

```typescript
const budgetImpact = useMemo(() => {
  // 1. Only show for 'expense' type
  if (type !== "expense") return null;

  // 2. Only show if a category is selected
  if (!selectedCategoryId || selectedCategoryId === "__none") return null;

  // 3. Find the specific budget item for the selected category
  const budgetItem = budgetDetails.find(
    (item) => item.category_id === selectedCategoryId
  );

  if (!budgetItem) return null; // No budget set for this category

  // 4. Parse the current amount from the input string
  const currentAmountInCents =
    parseCurrencyWithoutMultiplier(amountString || "0") * 100;

  // 5. Smart calculation for EDIT mode:
  // Temporarily subtract the transaction's original amount from the total spent
  // to accurately preview the impact of the NEW amount.
  const originalSpent =
    transaction?.categoryId === selectedCategoryId
      ? budgetItem.spent - transaction.amount
      : budgetItem.spent;

  // 6. Calculate the new totals based on the current input
  const newSpent = originalSpent + currentAmountInCents;
  const budgeted = budgetItem.amount;
  const remaining = budgeted - newSpent;
  const progress = budgeted > 0 ? (newSpent / budgeted) * 100 : 0;

  // 7. Determine the status and return a comprehensive object
  const isOverBudget = newSpent > budgeted;

  return {
    categoryName: budgetItem.category_name,
    budgeted,
    newSpent,
    remaining,
    progress: Math.min(progress, 100), // Cap progress at 100% for the progress bar
    isOverBudget,
    isNearLimit: progress > 80 && !isOverBudget,
    isWellWithinBudget: progress <= 80,
    overBudgetAmount: isOverBudget ? Math.abs(remaining) : 0,
  };
}, [type, selectedCategoryId, amountString, budgetDetails, transaction]);
```

### Conditional Rendering in JSX

The returned `budgetImpact` object is then used to conditionally render different `Alert` components and style the `Progress` bar.

```typescript
{budgetImpact && (
  // ... container div

  // Over Budget Warning
  {budgetImpact.isOverBudget && (
    <Alert variant="destructive">
      {/* ... icon and description ... */}
    </Alert>
  )}

  // Near Limit Warning
  {budgetImpact.isNearLimit && (
    <Alert className="border-yellow-500 ...">
      {/* ... icon and description ... */}
    </Alert>
  )}

  // ... Progress Bar with conditional styling ...
  <Progress
    value={budgetImpact.progress}
    indicatorClassName={cn(
      budgetImpact.isOverBudget && "bg-destructive",
      budgetImpact.isNearLimit && "bg-yellow-500",
      budgetImpact.isWellWithinBudget && "bg-primary"
    )}
  />

  // ... Text details for spent, budgeted, remaining ...
)}
```

---

## 📊 Visual States

### State 1: Within Budget (Healthy)

```
Category: Food & Dining
Amount: Rp 100.000

┌─────────────────────────────────────────┐
│ ✓ Within budget limits                  │
│ ████████████░░░░░░░░░░░░ 60%            │
│ ↓ Spent: Rp 300.000   Budget: Rp 500.000  │
│      Remaining: Rp 200.000              │
└─────────────────────────────────────────┘
```

### State 2: Near Limit (Warning)

```
Category: Food & Dining
Amount: Rp 100.000

┌─────────────────────────────────────────┐
│ ⚠ Near Budget Limit!                    │
│ You're approaching your budget limit.   │
│ ████████████████████░░░ 85%             │
│ ↓ Spent: Rp 425.000   Budget: Rp 500.000  │
│      Remaining: Rp 75.000               │
└─────────────────────────────────────────┘
```

### State 3: Over Budget (Critical)

```
Category: Food & Dining
Amount: Rp 100.000

┌─────────────────────────────────────────┐
│ ⚠ Over Budget!                          │
│ This expense will exceed your budget by │
│ Rp 50.000                               │
│ █████████████████████████ 110%          │
│ ↓ Spent: Rp 550.000   Budgeted: 500.000 │
│         Over by: Rp 50.000              │
└─────────────────────────────────────────┘
```
