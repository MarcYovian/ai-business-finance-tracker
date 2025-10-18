# Feature: Delete Confirmation Dialog

## 1. Overview

To enhance user experience and prevent accidental data loss, a confirmation dialog has been implemented for all delete operations. This ensures that users are certain before permanently removing a transaction.

The dialog is built using the `AlertDialog` component from `shadcn/ui`, which is specifically designed for actions that require confirmation.

## 2. Rationale

- **Prevent Accidental Deletions**: Users can easily mis-click. A confirmation step provides a crucial safeguard.
- **Improve User Confidence**: Explicitly confirming destructive actions makes the application feel safer and more reliable.
- **Standard UX Practice**: Confirmation for deletion is a standard and expected user experience pattern in modern web applications.

## 3. Implementation Details

A reusable `DeleteConfirmationDialog` component was created to be used across the application wherever a delete confirmation is needed.

### `DeleteConfirmationDialog.tsx`

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  isPending,
}: DeleteConfirmationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            transaction and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onConfirm} disabled={isPending} variant="destructive">
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

## 4. Integration

The dialog was integrated into the `Transactions` page (`src/pages/Transactions.tsx`).

### State Management

State variables were added to manage the dialog's visibility and the ID of the transaction to be deleted.

```tsx
const [isDeleteOpen, setIsDeleteOpen] = useState(false);
const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
```

### Triggering the Dialog

The `handleDelete` function was updated to open the dialog instead of immediately deleting the transaction.

```tsx
const handleDelete = (id: string) => {
  setTransactionToDelete(id);
  setIsDeleteOpen(true);
};
```

### Handling Confirmation

A new function, `handleConfirmDelete`, was created to execute the deletion when the user confirms the action in the dialog.

```tsx
const handleConfirmDelete = async () => {
  if (!transactionToDelete) return;
  try {
    await deleteTransactionMutation.mutateAsync(transactionToDelete);
    toast({ title: 'Transaction deleted' });
    setIsDeleteOpen(false);
    setTransactionToDelete(null);
  } catch (error) {
    toast({ title: 'Error', description: 'Could not delete transaction.', variant: 'destructive' });
  }
};
```

### Rendering the Component

The `DeleteConfirmationDialog` is rendered within the page and controlled by the state variables.

```tsx
<DeleteConfirmationDialog
  open={isDeleteOpen}
  onClose={() => setIsDeleteOpen(false)}
  onConfirm={handleConfirmDelete}
  isPending={deleteTransactionMutation.isPending}
/>
```
