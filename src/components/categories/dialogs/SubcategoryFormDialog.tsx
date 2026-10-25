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
import { Category } from '@/types/finance';
import { AVAILABLE_ICONS, CATEGORY_COLORS } from '../constants';
import { toast } from 'sonner';

interface SubcategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentCategory: Category | null;
  subcategoryToEdit?: Category | null;
  onSave: (data: {
    id?: string;
    parentId: string;
    name: string;
    type: 'income' | 'expense';
    icon?: string | null;
    color?: string | null;
    description?: string | null;
    is_active?: boolean;
  }) => Promise<void>;
}

export const SubcategoryFormDialog: React.FC<SubcategoryFormDialogProps> = ({
  open,
  onOpenChange,
  parentCategory,
  subcategoryToEdit,
  onSave,
}) => {
  const isEditing = Boolean(subcategoryToEdit);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tag');
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subcategoryToEdit) {
      setName(subcategoryToEdit.name || '');
      setSelectedIcon(subcategoryToEdit.icon?.replace('i-lucide-', '') || 'tag');
      setSelectedColor(subcategoryToEdit.color || parentCategory?.color || '#10B981');
      setDescription(subcategoryToEdit.description || '');
    } else {
      setName('');
      setSelectedIcon('tag');
      setSelectedColor(parentCategory?.color || '#10B981');
      setDescription('');
    }
  }, [subcategoryToEdit, parentCategory, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter subcategory name');
      return;
    }
    if (!parentCategory) {
      toast.error('Parent category not selected');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: subcategoryToEdit?.id,
        parentId: parentCategory.id,
        name: name.trim(),
        type: parentCategory.type,
        icon: selectedIcon,
        color: selectedColor,
        description: description.trim() || null,
        is_active: subcategoryToEdit ? subcategoryToEdit.is_active : true,
      });
      toast.success(isEditing ? 'Subcategory updated' : 'Subcategory created');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save subcategory');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-32px)] sm:w-full p-4 sm:p-6 rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[17px] sm:text-[18px] font-bold text-[#161F18]">
            {isEditing ? 'Edit Subcategory' : 'Add Subcategory'}
          </DialogTitle>
          {parentCategory && (
            <p className="text-[12px] text-[#737E75]">
              Adding to parent: <span className="font-semibold text-[#161F18]">{parentCategory.name}</span> ({parentCategory.type})
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Subcategory Name */}
          <div className="space-y-1.5">
            <Label htmlFor="subcat-name" className="text-[13px] font-medium text-[#161F18]">
              Subcategory Name
            </Label>
            <Input
              id="subcat-name"
              placeholder="e.g. Breakfast, Fuel, Rent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-[13px] rounded-xl border-[#E2E8DF] bg-[#FAFBF9]"
              autoFocus
            />
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
            <Label htmlFor="subcat-desc" className="text-[13px] font-medium text-[#161F18]">
              Description (Optional)
            </Label>
            <Textarea
              id="subcat-desc"
              rows={2}
              placeholder="Brief details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[13px] rounded-xl border-[#E2E8DF] bg-[#FAFBF9] resize-none"
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Subcategory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
