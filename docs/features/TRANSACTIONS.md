# Feature: Transaction Management

## 1. Overview

Transaction management is a core feature of the AI-Fi Finance Tracker. It allows users to create, read, update, and delete their financial transactions. The system provides a clear and intuitive interface for managing income, expenses, and transfers.

## 2. Form Validation

To ensure data integrity and provide a better user experience, the transaction form (`TransactionDialog.tsx`) uses `zod` for schema-based validation and `react-hook-form` for form state management.

### Rationale

- **Data Integrity**: Prevents invalid or incomplete data from being submitted to the database.
- **User Experience**: Provides immediate and clear feedback to the user about form errors.
- **Maintainability**: Centralizes validation logic, making it easier to manage and update.

### Implementation

#### Validation Schema

A `zod` schema is defined to validate the transaction data. It includes conditional validation using `.superRefine` to handle the different requirements for `income`, `expense`, and `transfer` transaction types.

**`transactionSchema` in `TransactionDialog.tsx`:**

```tsx
const transactionSchema = z
  .object({
    description: z.string().min(1, "Description is required."),
    amount: z
      .string()
      .refine((val) => /[\d,]+/.test(val) && parseFloat(val) > 0, {
        message: "Amount must be a positive number.",
      }),
    type: z.enum(["income", "expense", "transfer"]),
    transactionDate: z.string().min(1, "Date is required."),
    categoryId: z.string().nullable().optional(),
    sourceFundId: z.string().nullable().optional(),
    destinationFundId: z.string().nullable().optional(),
    fee: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "transfer") {
      if (!data.sourceFundId || data.sourceFundId === "__none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceFundId"],
          message: "Source fund is required for transfers.",
        });
      }
      if (!data.destinationFundId || data.destinationFundId === "__none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationFundId"],
          message: "Destination fund is required for transfers.",
        });
      }
      if (
        data.sourceFundId &&
        data.destinationFundId &&
        data.sourceFundId === data.destinationFundId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationFundId"],
          message: "Destination fund cannot be the same as source fund.",
        });
      }
    } else if (data.type === "income") {
      if (!data.destinationFundId || data.destinationFundId === "__none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationFundId"],
          message: "Destination fund is required for income.",
        });
      }
    } else if (data.type === "expense") {
      if (!data.sourceFundId || data.sourceFundId === "__none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceFundId"],
          message: "Source fund is required for expenses.",
        });
      }
    }
  });
```

#### Form Integration

`react-hook-form` is used to manage the form state, and the `zodResolver` connects our schema to the form.

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// ...

const form = useForm<TransactionFormData>({
  resolver: zodResolver(transactionSchema),
  // ...
});
```

UI components from `shadcn/ui` are wrapped in `FormField` and `Controller` components to integrate with `react-hook-form` and display validation messages.

```tsx
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <Input placeholder="e.g., Coffee with client" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```
