import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Category } from '@/types/finance';
import { AVAILABLE_ICONS, CATEGORY_COLORS } from '../constants';
import { toast } from 'sonner';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToEdit?: Category | null;
  onSave: (data: {
    id?: string;
    name: string;
    type: 'income' | 'expense';
    icon?: string | null;
    color?: string | null;
    description?: string | null;
    is_active?: boolean;
  }) => Promise<void>;
}

export const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({
  open,
  onOpenChange,
  categoryToEdit,
  onSave,
}) => {
  const isEditing = Boolean(categoryToEdit);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedIcon, setSelectedIcon] = useState('shopping-bag');
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
      setType(categoryToEdit.type || 'expense');
      setSelectedIcon(categoryToEdit.icon?.replace('i-lucide-', '') || 'shopping-bag');
      setSelectedColor(categoryToEdit.color || '#10B981');
      setDescription(categoryToEdit.description || '');
      setIsActive(categoryToEdit.is_active !== false);
    } else {
      setName('');
      setType('expense');
      setSelectedIcon('shopping-bag');
      setSelectedColor('#10B981');
      setDescription('');
      setIsActive(true);
    }
  }, [categoryToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: categoryToEdit?.id,
        name: name.trim(),
        type,
        icon: selectedIcon,
        color: selectedColor,
        description: description.trim() || null,
        is_active: isActive,
      });
      toast.success(isEditing ? 'Category updated' : 'Category created');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-32px)] sm:w-full p-4 sm:p-6 rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[17px] sm:text-[18px] font-bold text-[#161F18]">
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-name" className="text-[13px] font-medium text-[#161F18]">
              Category Name
            </Label>
            <Input
              id="cat-name"
              placeholder="e.g. Food & Dining, Salary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-[13px] rounded-xl border-[#E2E8DF] bg-[#FAFBF9]"
              autoFocus
            />
          </div>

          {/* Type: Income / Expense */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#161F18]">Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 px-3 rounded-xl text-[13px] font-semibold transition-colors border ${
                  type === 'expense'
                    ? 'bg-[#FEF2F2] border-[#FECDCA] text-[#DE4436]'
                    : 'bg-[#FAFBF9] border-[#E2E8DF] text-[#737E75] hover:bg-[#F2F5F0]'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 px-3 rounded-xl text-[13px] font-semibold transition-colors border ${
                  type === 'income'
                    ? 'bg-[#EDF8E8] border-[#D4EECD] text-[#529E42]'
                    : 'bg-[#FAFBF9] border-[#E2E8DF] text-[#737E75] hover:bg-[#F2F5F0]'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#161F18]">Icon</Label>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-[#E2E8DF] rounded-xl bg-[#FAFBF9]">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    title={item.label}
                    onClick={() => setSelectedIcon(item.name)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#161F18] text-white shadow-xs scale-105'
                        : 'text-[#6E7B71] hover:bg-black/5'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#161F18]">Color Theme</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORY_COLORS.map((col) => {
                const isSelected = selectedColor === col.hex;
                return (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setSelectedColor(col.hex)}
                    style={{ backgroundColor: col.hex }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      isSelected ? 'ring-2 ring-offset-2 ring-[#161F18] scale-110' : 'hover:scale-105'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc" className="text-[13px] font-medium text-[#161F18]">
              Description (Optional)
            </Label>
            <Textarea
              id="cat-desc"
              rows={2}
              placeholder="Brief description about what transactions belong here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[13px] rounded-xl border-[#E2E8DF] bg-[#FAFBF9] resize-none"
            />
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between pt-1">
            <Label htmlFor="cat-active" className="text-[13px] font-medium text-[#161F18] cursor-pointer">
              Active Category
            </Label>
            <Switch
              id="cat-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-[#E2E8DF] h-10 text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#529E42] hover:bg-[#438335] text-white h-10 text-[13px] font-semibold"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
