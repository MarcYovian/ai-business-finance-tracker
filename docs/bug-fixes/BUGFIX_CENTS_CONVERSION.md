# Bug Fix: Cents Conversion for Currency Accuracy

## 1. The Problem: Floating-Point Inaccuracy

When dealing with currency, using floating-point numbers (e.g., `100.50`) can lead to precision errors due to the way computers store these numbers. This can result in small, unpredictable inaccuracies that accumulate over time, causing significant issues in financial calculations.

**Example of the problem:**

```javascript
0.1 + 0.2 // Results in 0.30000000000000004, not 0.3
```

This is unacceptable for a financial application where precision is paramount.

---

## 2. The Solution: Store Currency as Cents

To solve this problem, the application has adopted a standard practice in financial software: **all currency values are stored and manipulated as integers representing the smallest unit of the currency** (cents).

For Indonesian Rupiah (IDR), while there are no physical cents, we use a 100-multiplier system for consistency with standard financial data models. For example:

- `Rp 1.000` is stored as `100000`.
- `Rp 1.500` is stored as `150000`.

This approach ensures that all mathematical operations (addition, subtraction, multiplication) are performed on integers, which are always precise and free from floating-point errors.

---

## 3. Implementation

The conversion logic is centralized in `src/lib/currency.ts`.

### `formatCurrency(amountInCents)`

- **Purpose**: To display the currency value to the user in a readable format.
- **Action**: Takes an integer (e.g., `150000`) and divides it by 100 before formatting it as an IDR string (e.g., "Rp 1.500").

### `parseCurrency(input)`

- **Purpose**: To convert a user-input string into the integer format for storage.
- **Action**: Takes a string (e.g., "Rp 1.500"), removes all non-numeric characters, parses it into a number, and multiplies it by 100 to get the value in cents (e.g., `150000`).

By implementing this bug fix, we ensure the accuracy and reliability of all financial data within the application.
