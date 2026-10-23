import { Layout } from "@/components/Layout";
import { TransferDialog } from "@/components/TransferDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  useAddCategory,
  useCategories,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/useCategories";
import {
  useAddFundSource,
  useDeleteFundSource,
  useFundSources,
} from "@/hooks/useFundSources";
import { formatCurrency, formatCurrencyForInput } from "@/lib/currency";
import { aiConfigStorage } from "@/lib/storage";
import {
  AlertCircle,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Coins,
  Landmark,
  Pencil,
  Plus,
  PlusCircle,
  Settings2,
  Sparkles,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

const ListSkeleton = () => (
  <div className="space-y-2">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between rounded-lg border p-3"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    ))}
  </div>
);

const EmptyList = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="text-center py-10 border-2 border-dashed rounded-lg p-6">
    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
    <h3 className="mt-4 text-lg font-medium">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
);

export default function Settings() {
  const { user } = useAuth();
  const [openAIKey, setOpenAIKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [aiProvider, setAiProvider] = useState("openai");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">(
    "expense"
  );
  const [newFundSourceName, setNewFundSourceName] = useState("");
  const [newFundSourceBalance, setNewFundSourceBalance] = useState("");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState<string | null>(
    null
  );
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(true);

  useEffect(() => {
    setOpenAIKey(aiConfigStorage.getOpenAIKey() || "");
    setGeminiKey(aiConfigStorage.getGeminiKey() || "");
    setAiProvider(aiConfigStorage.getProvider());
  }, []);

  const { data: allCategories = [], isLoading: categoriesLoading } =
    useCategories(user?.id || "");
  const { data: fundSources = [], isLoading: fundSourcesLoading } =
    useFundSources(user?.id || "");

  const addCategoryMutation = useAddCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const updateCategoryMutation = useUpdateCategory();
  const addFundSourceMutation = useAddFundSource();
  const deleteFundSourceMutation = useDeleteFundSource();

  const handleSaveKeys = () => {
    aiConfigStorage.setProvider(aiProvider as "openai" | "gemini");
    aiConfigStorage.setOpenAIKey(openAIKey);
    aiConfigStorage.setGeminiKey(geminiKey);
    toast({
      title: "Settings saved",
      description: "Your AI provider and API keys have been updated.",
    });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCategoryName.trim()) return;
    await addCategoryMutation.mutateAsync(
      { name: newCategoryName.trim(), userId: user.id, type: newCategoryType },
      {
        onSuccess: () => {
          setNewCategoryName("");
          toast({ title: "Category added" });
        },
        onError: () =>
          toast({
            title: "Error",
            description: "Could not add category.",
            variant: "destructive",
          }),
      }
    );
  };

  const handleAddSubCategory = async (parentId: string) => {
    if (!user || !newSubCategoryName.trim() || !activeParentId) return;

    // Find the parent category to get its type
    const parentCategory = allCategories.find((cat) => cat.id === parentId);
    if (!parentCategory) return;

    await addCategoryMutation.mutateAsync(
      {
        name: newSubCategoryName.trim(),
        userId: user.id,
        type: parentCategory.type,
        parentId: parentCategory.id,
      },
      {
        onSuccess: () => {
          setNewSubCategoryName("");
          setShowSubCategoryForm(null);
          setActiveParentId(null);
          toast({ title: "Sub-category added" });
        },
        onError: () =>
          toast({
            title: "Error",
            description: "Could not add sub-category.",
            variant: "destructive",
          }),
      }
    );
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategoryMutation.mutateAsync(id, {
      onSuccess: () => toast({ title: "Category deleted" }),
      onError: () =>
        toast({
          title: "Error",
          description: "Could not delete category.",
          variant: "destructive",
        }),
    });
  };

  const startEditingCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleSaveEditCategory = async () => {
    if (!editingCategoryId || !editingCategoryName.trim()) return;

    await updateCategoryMutation.mutateAsync(
      {
        id: editingCategoryId,
        name: editingCategoryName.trim(),
      },
      {
        onSuccess: () => {
          setEditingCategoryId(null);
          setEditingCategoryName("");
          toast({ title: "Category updated" });
        },
        onError: () =>
          toast({
            title: "Error",
            description: "Could not update category.",
            variant: "destructive",
          }),
      }
    );
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    setNewFundSourceBalance(numericValue);
  };

  const handleAddFundSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFundSourceName.trim()) return;
    const balanceInCents = Math.round(
      parseFloat(newFundSourceBalance || "0") * 100
    );
    await addFundSourceMutation.mutateAsync(
      {
        name: newFundSourceName.trim(),
        balance: balanceInCents,
        userId: user.id,
      },
      {
        onSuccess: () => {
          setNewFundSourceName("");
          setNewFundSourceBalance("");
          toast({ title: "Fund source added" });
        },
        onError: () =>
          toast({
            title: "Error",
            description: "Could not add fund source.",
            variant: "destructive",
          }),
      }
    );
  };

  const handleDeleteFundSource = async (id: string) => {
    await deleteFundSourceMutation.mutateAsync(id, {
      onSuccess: () => toast({ title: "Fund source deleted" }),
      onError: () =>
        toast({
          title: "Error",
          description: "Could not delete fund source.",
          variant: "destructive",
        }),
    });
  };

  // Group categories into income/expense, and organize as parent/sub-category structure
  const incomeCategories = allCategories.filter(
    (cat) => cat.type === "income" && !cat.parentId
  );
  const expenseCategories = allCategories.filter(
    (cat) => cat.type === "expense" && !cat.parentId
  );
  const subCategories = allCategories.filter((cat) => cat.parentId);

  // Function to get sub-categories for a parent
  const getSubCategories = (parentId: string) => {
    return subCategories.filter((sub) => sub.parentId === parentId);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application preferences and data.
          </p>
        </div>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="w-full grid grid-cols-1 sm:grid-cols-3">
            <TabsTrigger
              value="ai"
              className="flex items-center gap-2 py-2 sm:py-1.5 data-[state=active]:shadow-sm"
            >
              <Sparkles className="h-5 w-5" />
              <span>AI Settings</span>
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="flex items-center gap-2 py-2 sm:py-1.5 data-[state=active]:shadow-sm"
            >
              <Tag className="h-5 w-5" />
              <span>Categories</span>
            </TabsTrigger>
            <TabsTrigger
              value="funds"
              className="flex items-center gap-2 py-2 sm:py-1.5 data-[state=active]:shadow-sm"
            >
              <Coins className="h-5 w-5" />
              <span>Funds</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>AI Provider</CardTitle>
                    <CardDescription>
                      Choose your AI provider and enter the API key.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={aiProvider} onValueChange={setAiProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      value={openAIKey}
                      onChange={(e) => setOpenAIKey(e.target.value)}
                      placeholder="sk-..."
                      disabled={aiProvider !== "openai"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gemini-key">Gemini API Key</Label>
                    <Input
                      id="gemini-key"
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIza..."
                      disabled={aiProvider !== "gemini"}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveKeys} className="w-full sm:w-auto">
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Tag className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Transaction Categories</CardTitle>
                        <CardDescription>
                          Organize your transactions with custom categories.
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCategoryForm(!showAddCategoryForm)}
                    className="w-full sm:w-auto"
                  >
                    {showAddCategoryForm ? "Hide" : "Show"} Form
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add parent category form - collapsible */}
                {showAddCategoryForm && (
                  <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add New Category
                    </h3>
                    <form
                      onSubmit={handleAddCategory}
                      className="flex flex-col gap-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="category-name">Category Name</Label>
                        <Input
                          id="category-name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="e.g., Food & Beverage"
                          required
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="space-y-2 flex-1">
                          <Label htmlFor="category-type">Type</Label>
                          <RadioGroup
                            value={newCategoryType}
                            onValueChange={(value: "income" | "expense") =>
                              setNewCategoryType(value)
                            }
                            className="grid grid-cols-2 gap-2 mt-1"
                            id="category-type"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="income" id="income" />
                              <Label
                                htmlFor="income"
                                className="text-success flex-1 text-center py-2 border rounded-md"
                              >
                                Income
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="expense" id="expense" />
                              <Label
                                htmlFor="expense"
                                className="text-destructive flex-1 text-center py-2 border rounded-md"
                              >
                                Expense
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="submit"
                            disabled={addCategoryMutation.isPending}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {categoriesLoading ? (
                  <ListSkeleton />
                ) : (
                  <div className="space-y-6">
                    {/* Income categories */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <span className="text-success">
                            Income Categories
                          </span>
                          <span className="text-sm text-muted-foreground bg-success/10 px-2 py-1 rounded-full">
                            ({incomeCategories.length})
                          </span>
                        </h3>
                      </div>
                      {incomeCategories.length > 0 ? (
                        <div className="space-y-3">
                          {incomeCategories.map((category) => {
                            const subCats = getSubCategories(category.id);
                            const isExpanded =
                              expandedCategories[category.id] ?? true;

                            return (
                              <div key={category.id} className="space-y-2">
                                <div className="rounded-lg border bg-card p-4">
                                  {editingCategoryId === category.id ? (
                                    <div className="flex flex-col gap-3">
                                      <Input
                                        value={editingCategoryName}
                                        onChange={(e) =>
                                          setEditingCategoryName(e.target.value)
                                        }
                                        className="flex-1"
                                        autoFocus
                                        placeholder="Category name"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={handleSaveEditCategory}
                                          className="flex-1"
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleCancelEditCategory}
                                          className="flex-1"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="flex items-center gap-3 flex-1">
                                        <button
                                          onClick={() =>
                                            toggleCategoryExpansion(category.id)
                                          }
                                          className="p-1 rounded hover:bg-muted flex items-center justify-center"
                                        >
                                          {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )}
                                        </button>
                                        <Tag className="h-5 w-5 text-success" />
                                        <div className="flex-1">
                                          <div className="font-medium text-foreground">
                                            {category.name}
                                          </div>
                                          <div className="text-xs sm:text-sm text-muted-foreground">
                                            Income
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 mt-2 sm:mt-0">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            startEditingCategory(category)
                                          }
                                          className="h-9 px-3 flex items-center"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setActiveParentId(category.id);
                                            setShowSubCategoryForm(
                                              showSubCategoryForm ===
                                                category.id
                                                ? null
                                                : category.id
                                            );
                                            setNewSubCategoryName("");
                                          }}
                                          className="h-9 px-3 flex items-center"
                                        >
                                          <PlusCircle className="h-4 w-4" />
                                          <span className="hidden sm:inline ml-1">
                                            Sub
                                          </span>
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleDeleteCategory(category.id)
                                          }
                                          disabled={
                                            deleteCategoryMutation.isPending
                                          }
                                          className="h-9 px-3 text-destructive hover:text-destructive flex items-center"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {showSubCategoryForm === category.id && (
                                    <div className="mt-3 p-3 border rounded-lg bg-muted/30 flex flex-col sm:flex-row gap-2">
                                      <Input
                                        value={newSubCategoryName}
                                        onChange={(e) =>
                                          setNewSubCategoryName(e.target.value)
                                        }
                                        placeholder="Sub-category name..."
                                        className="flex-1"
                                        required
                                      />
                                      <div className="flex gap-2 w-full sm:w-auto">
                                        <Button
                                          onClick={() =>
                                            handleAddSubCategory(category.id)
                                          }
                                          disabled={!newSubCategoryName.trim()}
                                          className="flex-1 sm:flex-none"
                                        >
                                          Add
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() =>
                                            setShowSubCategoryForm(null)
                                          }
                                          className="flex-1 sm:flex-none"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {subCats.length > 0 && isExpanded && (
                                  <div className="space-y-2 ml-8">
                                    {subCats.map((subCategory) => (
                                      <div
                                        key={subCategory.id}
                                        className="flex items-center justify-between rounded-lg border bg-secondary/30 p-3"
                                      >
                                        {editingCategoryId ===
                                        subCategory.id ? (
                                          <div className="flex-1 flex flex-col gap-2">
                                            <Input
                                              value={editingCategoryName}
                                              onChange={(e) =>
                                                setEditingCategoryName(
                                                  e.target.value
                                                )
                                              }
                                              className="flex-1"
                                              autoFocus
                                              placeholder="Sub-category name"
                                            />
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={handleSaveEditCategory}
                                                className="flex-1"
                                              >
                                                Save
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={
                                                  handleCancelEditCategory
                                                }
                                                className="flex-1"
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex items-center gap-2 flex-1">
                                              <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                                              <Tag className="h-4 w-4 text-secondary-foreground/50" />
                                              <span className="text-secondary-foreground">
                                                {subCategory.name}
                                              </span>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  startEditingCategory(
                                                    subCategory
                                                  )
                                                }
                                                className="h-8 px-2 flex items-center"
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  handleDeleteCategory(
                                                    subCategory.id
                                                  )
                                                }
                                                disabled={
                                                  deleteCategoryMutation.isPending
                                                }
                                                className="h-8 px-2 text-destructive hover:text-destructive flex items-center"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyList
                          title="No Income Categories"
                          description="Add income categories to organize your revenue."
                        />
                      )}
                    </div>

                    {/* Expense categories */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <span className="text-destructive">
                            Expense Categories
                          </span>
                          <span className="text-sm text-muted-foreground bg-destructive/10 px-2 py-1 rounded-full">
                            ({expenseCategories.length})
                          </span>
                        </h3>
                      </div>
                      {expenseCategories.length > 0 ? (
                        <div className="space-y-3">
                          {expenseCategories.map((category) => {
                            const subCats = getSubCategories(category.id);
                            const isExpanded =
                              expandedCategories[category.id] ?? true;

                            return (
                              <div key={category.id} className="space-y-2">
                                <div className="rounded-lg border bg-card p-4">
                                  {editingCategoryId === category.id ? (
                                    <div className="flex flex-col gap-3">
                                      <Input
                                        value={editingCategoryName}
                                        onChange={(e) =>
                                          setEditingCategoryName(e.target.value)
                                        }
                                        className="flex-1"
                                        autoFocus
                                        placeholder="Category name"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={handleSaveEditCategory}
                                          className="flex-1"
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleCancelEditCategory}
                                          className="flex-1"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="flex items-center gap-3 flex-1">
                                        <button
                                          onClick={() =>
                                            toggleCategoryExpansion(category.id)
                                          }
                                          className="p-1 rounded hover:bg-muted flex items-center justify-center"
                                        >
                                          {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )}
                                        </button>
                                        <Tag className="h-5 w-5 text-destructive" />
                                        <div className="flex-1">
                                          <div className="font-medium text-foreground">
                                            {category.name}
                                          </div>
                                          <div className="text-xs sm:text-sm text-muted-foreground">
                                            Expense
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 mt-2 sm:mt-0">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            startEditingCategory(category)
                                          }
                                          className="h-9 px-3 flex items-center"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setActiveParentId(category.id);
                                            setShowSubCategoryForm(
                                              showSubCategoryForm ===
                                                category.id
                                                ? null
                                                : category.id
                                            );
                                            setNewSubCategoryName("");
                                          }}
                                          className="h-9 px-3 flex items-center"
                                        >
                                          <PlusCircle className="h-4 w-4" />
                                          <span className="hidden sm:inline ml-1">
                                            Sub
                                          </span>
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleDeleteCategory(category.id)
                                          }
                                          disabled={
                                            deleteCategoryMutation.isPending
                                          }
                                          className="h-9 px-3 text-destructive hover:text-destructive flex items-center"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {showSubCategoryForm === category.id && (
                                    <div className="mt-3 p-3 border rounded-lg bg-muted/30 flex flex-col sm:flex-row gap-2">
                                      <Input
                                        value={newSubCategoryName}
                                        onChange={(e) =>
                                          setNewSubCategoryName(e.target.value)
                                        }
                                        placeholder="Sub-category name..."
                                        className="flex-1"
                                        required
                                      />
                                      <div className="flex gap-2 w-full sm:w-auto">
                                        <Button
                                          onClick={() =>
                                            handleAddSubCategory(category.id)
                                          }
                                          disabled={!newSubCategoryName.trim()}
                                          className="flex-1 sm:flex-none"
                                        >
                                          Add
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() =>
                                            setShowSubCategoryForm(null)
                                          }
                                          className="flex-1 sm:flex-none"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {subCats.length > 0 && isExpanded && (
                                  <div className="space-y-2 ml-8">
                                    {subCats.map((subCategory) => (
                                      <div
                                        key={subCategory.id}
                                        className="flex items-center justify-between rounded-lg border bg-secondary/30 p-3"
                                      >
                                        {editingCategoryId ===
                                        subCategory.id ? (
                                          <div className="flex-1 flex flex-col gap-2">
                                            <Input
                                              value={editingCategoryName}
                                              onChange={(e) =>
                                                setEditingCategoryName(
                                                  e.target.value
                                                )
                                              }
                                              className="flex-1"
                                              autoFocus
                                              placeholder="Sub-category name"
                                            />
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={handleSaveEditCategory}
                                                className="flex-1"
                                              >
                                                Save
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={
                                                  handleCancelEditCategory
                                                }
                                                className="flex-1"
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex items-center gap-2 flex-1">
                                              <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                                              <Tag className="h-4 w-4 text-secondary-foreground/50" />
                                              <span className="text-secondary-foreground">
                                                {subCategory.name}
                                              </span>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  startEditingCategory(
                                                    subCategory
                                                  )
                                                }
                                                className="h-8 px-2 flex items-center"
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  handleDeleteCategory(
                                                    subCategory.id
                                                  )
                                                }
                                                disabled={
                                                  deleteCategoryMutation.isPending
                                                }
                                                className="h-8 px-2 text-destructive hover:text-destructive flex items-center"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyList
                          title="No Expense Categories"
                          description="Add expense categories to organize your spending."
                        />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funds">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Coins className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Fund Sources</CardTitle>
                      <CardDescription>
                        Track accounts and payment methods.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsTransferDialogOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" /> Transfer Funds
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  onSubmit={handleAddFundSource}
                  className="flex flex-col gap-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fund-name">Name</Label>
                      <Input
                        id="fund-name"
                        value={newFundSourceName}
                        onChange={(e) => setNewFundSourceName(e.target.value)}
                        placeholder="e.g., Business Bank"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fund-balance">Balance</Label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                          Rp
                        </span>
                        <Input
                          id="fund-balance"
                          type="text"
                          inputMode="numeric"
                          className="text-right pl-8"
                          value={formatCurrencyForInput(
                            newFundSourceBalance || "0"
                          )}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={addFundSourceMutation.isPending}
                    className="w-full sm:w-fit"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Source
                  </Button>
                </form>

                <div className="border-t pt-4" />

                {fundSourcesLoading ? (
                  <ListSkeleton />
                ) : fundSources.length > 0 ? (
                  <div className="space-y-3">
                    {fundSources.map((source) => (
                      <div
                        key={source.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-4 mb-3 sm:mb-0">
                          {source.name.toLowerCase().includes("bank") ? (
                            <Landmark className="h-6 w-6 text-muted-foreground" />
                          ) : (
                            <Wallet className="h-6 w-6 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{source.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Available Balance
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                          <p className="font-semibold text-lg w-full sm:w-auto text-right sm:text-left">
                            {formatCurrency(source.balance)}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFundSource(source.id)}
                            disabled={deleteFundSourceMutation.isPending}
                            className="w-full sm:w-auto text-destructive hover:text-destructive justify-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyList
                    title="No Fund Sources Found"
                    description="Add a bank account or credit card to get started."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TransferDialog
        open={isTransferDialogOpen}
        onClose={() => setIsTransferDialogOpen(false)}
        fundSources={fundSources}
      />
    </Layout>
  );
}
