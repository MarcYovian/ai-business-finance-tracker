import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import {
  useCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useCategories';
import {
  TotalCategoriesWidget,
  IncomeCategoriesWidget,
  ExpenseCategoriesWidget,
  UnusedCategoriesWidget,
  AllCategoriesTableWidget,
  CategoryDetailWidget,
  SubcategoriesListWidget,
  CategoryFormDialog,
  SubcategoryFormDialog,
  DeleteCategoryDialog,
  CategoriesSkeleton,
  useCategoriesAnalytics,
  CategoryTypeFilter,
  CategoryWithAnalytics,
} from '@/components/categories';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Category } from '@/types/finance';

export const Categories: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  // Data queries
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories(userId);
  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions(userId);

  // Mutations
  const addCategoryMutation = useAddCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Local UI State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<CategoryTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [parentForSubcategory, setParentForSubcategory] = useState<Category | null>(null);
  const [subcategoryToEdit, setSubcategoryToEdit] = useState<Category | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithAnalytics | null>(null);

  // Analytics Hook
  const {
    summary,
    filteredCategories,
    selectedCategoryAnalytics,
  } = useCategoriesAnalytics({
    categories,
    transactions,
    selectedCategoryId,
    typeFilter,
    searchQuery,
  });

  // Handlers
  const handleOpenAddCategory = () => {
    setCategoryToEdit(null);
    setCategoryDialogOpen(true);
  };

  const handleOpenEditCategory = (cat: CategoryWithAnalytics) => {
    setCategoryToEdit(cat);
    setCategoryDialogOpen(true);
  };

  const handleOpenAddSubcategory = (parent: CategoryWithAnalytics) => {
    setParentForSubcategory(parent);
    setSubcategoryToEdit(null);
    setSubcategoryDialogOpen(true);
  };

  const handleOpenEditSubcategory = (sub: CategoryWithAnalytics) => {
    // Find parent of this subcategory
    const parent = categories.find((c) => c.id === sub.parentId) || null;
    setParentForSubcategory(parent);
    setSubcategoryToEdit(sub);
    setSubcategoryDialogOpen(true);
  };

  const handleOpenDelete = (cat: CategoryWithAnalytics) => {
    setCategoryToDelete(cat);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (cat: CategoryWithAnalytics) => {
    await updateCategoryMutation.mutateAsync({
      id: cat.id,
      is_active: cat.is_active === false ? true : false,
    });
  };

  const handleSaveCategory = async (data: {
    id?: string;
    name: string;
    type: 'income' | 'expense';
    icon?: string | null;
    color?: string | null;
    description?: string | null;
    is_active?: boolean;
  }) => {
    if (data.id) {
      await updateCategoryMutation.mutateAsync({
        id: data.id,
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        description: data.description,
        is_active: data.is_active,
      });
    } else {
      await addCategoryMutation.mutateAsync({
        name: data.name,
        userId,
        type: data.type,
        icon: data.icon,
        color: data.color,
        description: data.description,
        is_active: data.is_active,
      });
    }
  };

  const handleSaveSubcategory = async (data: {
    id?: string;
    parentId: string;
    name: string;
    type: 'income' | 'expense';
    icon?: string | null;
    color?: string | null;
    description?: string | null;
    is_active?: boolean;
  }) => {
    if (data.id) {
      await updateCategoryMutation.mutateAsync({
        id: data.id,
        parentId: data.parentId,
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        description: data.description,
        is_active: data.is_active,
      });
    } else {
      await addCategoryMutation.mutateAsync({
        name: data.name,
        userId,
        type: data.type,
        parentId: data.parentId,
        icon: data.icon,
        color: data.color,
        description: data.description,
        is_active: data.is_active,
      });
    }
  };

  const handleConfirmDelete = async (categoryId: string) => {
    await deleteCategoryMutation.mutateAsync(categoryId);
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
    }
  };

  if (isLoadingCategories || isLoadingTransactions) {
    return (
      <Layout>
        <CategoriesSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-3.5 sm:p-6 lg:p-7 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#161F18] tracking-tight">
              Categories
            </h1>
            <p className="text-xs sm:text-[13px] text-[#737E75] mt-0.5">
              Organize your transactions with custom categories and subcategories.
            </p>
          </div>

          <Button
            onClick={handleOpenAddCategory}
            className="w-full sm:w-auto h-9 sm:h-10 px-4 rounded-xl bg-[#529E42] hover:bg-[#438335] text-white font-semibold text-xs sm:text-[13px] gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        {/* 4 Stat Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <TotalCategoriesWidget
            total={summary.totalCategories}
            parents={summary.totalParents}
            subcategories={summary.totalSubcategories}
          />
          <IncomeCategoriesWidget
            total={summary.incomeCategories}
            parents={summary.incomeParents}
            subcategories={summary.incomeSubcategories}
          />
          <ExpenseCategoriesWidget
            total={summary.expenseCategories}
            parents={summary.expenseParents}
            subcategories={summary.expenseSubcategories}
          />
          <UnusedCategoriesWidget
            count={summary.unusedCategoriesCount}
          />
        </div>

        {/* Main Grid: Left Table (7 cols), Right Detail + Subcategories (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: All Categories Table */}
          <div className="lg:col-span-7">
            <AllCategoriesTableWidget
              categories={filteredCategories}
              selectedCategoryId={selectedCategoryAnalytics.category?.id || null}
              onSelectCategory={(id) => setSelectedCategoryId(id)}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onEditCategory={handleOpenEditCategory}
              onAddSubcategory={handleOpenAddSubcategory}
              onDeleteCategory={handleOpenDelete}
              onToggleStatus={handleToggleStatus}
            />
          </div>

          {/* Right Column: Category Detail Widget & Subcategories List Widget */}
          <div className="lg:col-span-5 space-y-6">
            <CategoryDetailWidget
              analytics={selectedCategoryAnalytics}
              onEditCategory={handleOpenEditCategory}
            />

            <SubcategoriesListWidget
              parentCategory={selectedCategoryAnalytics.category}
              subcategories={selectedCategoryAnalytics.subcategories}
              onAddSubcategory={handleOpenAddSubcategory}
              onEditSubcategory={handleOpenEditSubcategory}
              onDeleteSubcategory={handleOpenDelete}
              onDeleteParentCategory={handleOpenDelete}
            />
          </div>
        </div>

        {/* Dialogs */}
        <CategoryFormDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          categoryToEdit={categoryToEdit}
          onSave={handleSaveCategory}
        />

        <SubcategoryFormDialog
          open={subcategoryDialogOpen}
          onOpenChange={setSubcategoryDialogOpen}
          parentCategory={parentForSubcategory}
          subcategoryToEdit={subcategoryToEdit}
          onSave={handleSaveSubcategory}
        />

        <DeleteCategoryDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          category={categoryToDelete}
          onConfirmDelete={handleConfirmDelete}
        />
      </div>
    </Layout>
  );
};

export default Categories;
