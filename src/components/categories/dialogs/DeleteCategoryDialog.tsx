import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { CategoryWithAnalytics } from '../types';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryWithAnalytics | null;
  onConfirmDelete: (categoryId: string) => Promise<void>;
}

export const DeleteCategoryDialog: React.FC<DeleteCategoryDialogProps> = ({
  open,
  onOpenChange,
  category,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!category) return null;

  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const hasTransactions = category.transactionCount > 0;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirmDelete(category.id);
      toast.success(`Category "${category.name}" deleted successfully.`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md w-[calc(100vw-32px)] sm:w-full p-4 sm:p-6 rounded-2xl bg-white">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <AlertDialogTitle className="text-[18px] font-bold text-[#161F18]">
            Delete Category &quot;{category.name}&quot;?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] text-[#737E75] space-y-2">
            <p>
              Are you sure you want to delete this category? This action cannot be undone.
            </p>
            {hasSubcategories && (
              <p className="p-2.5 rounded-xl bg-[#FFF7ED] text-[#C2410C] font-medium border border-[#FED7AA] text-[12px]">
                ⚠️ Warning: This category has {category.subcategories.length} subcategories. Deleting it will detach or delete its subcategories.
              </p>
            )}
            {hasTransactions && (
              <p className="p-2.5 rounded-xl bg-[#FEF2F2] text-[#B91C1C] font-medium border border-[#FECACA] text-[12px]">
                ⚠️ This category currently has {category.transactionCount} associated transaction(s).
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="pt-2 gap-2 sm:gap-0">
          <AlertDialogCancel
            disabled={isDeleting}
            className="rounded-xl border-[#E2E8DF] h-10 text-[13px]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="rounded-xl bg-[#DE4436] hover:bg-[#C9382B] text-white h-10 text-[13px] font-semibold"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
