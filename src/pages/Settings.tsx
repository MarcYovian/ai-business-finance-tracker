import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiConfigStorage } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, ArrowRightLeft, Tag, Landmark, Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { TransferDialog } from '@/components/TransferDialog';
import { useCategories, useAddCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useFundSources, useAddFundSource, useDeleteFundSource } from '@/hooks/useFundSources';
import { Skeleton } from '@/components/ui/skeleton';

const ListSkeleton = () => (
  <div className="space-y-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    ))}
  </div>
);

const EmptyList = ({ title, description }: { title: string, description: string }) => (
  <div className="text-center py-10 border-2 border-dashed rounded-lg">
    <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
    <h3 className="mt-4 text-lg font-medium">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
);

export default function Settings() {
  const { user } = useAuth();
  const [openAIKey, setOpenAIKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newFundSourceName, setNewFundSourceName] = useState('');
  const [newFundSourceBalance, setNewFundSourceBalance] = useState('');
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  useEffect(() => {
    setOpenAIKey(aiConfigStorage.getOpenAIKey() || '');
    setGeminiKey(aiConfigStorage.getGeminiKey() || '');
    setAiProvider(aiConfigStorage.getProvider());
  }, []);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories(user?.id || '');
  const { data: fundSources = [], isLoading: fundSourcesLoading } = useFundSources(user?.id || '');

  const addCategoryMutation = useAddCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const addFundSourceMutation = useAddFundSource();
  const deleteFundSourceMutation = useDeleteFundSource();

  const handleSaveKeys = () => {
    aiConfigStorage.setProvider(aiProvider as 'openai' | 'gemini');
    aiConfigStorage.setOpenAIKey(openAIKey);
    aiConfigStorage.setGeminiKey(geminiKey);
    toast({ title: 'Settings saved', description: 'Your AI provider and API keys have been updated.' });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCategoryName.trim()) return;
    await addCategoryMutation.mutateAsync({ name: newCategoryName.trim(), userId: user.id }, {
      onSuccess: () => {
        setNewCategoryName('');
        toast({ title: 'Category added' });
      },
      onError: () => toast({ title: 'Error', description: 'Could not add category.', variant: 'destructive' }),
    });
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategoryMutation.mutateAsync(id, {
      onSuccess: () => toast({ title: 'Category deleted' }),
      onError: () => toast({ title: 'Error', description: 'Could not delete category.', variant: 'destructive' }),
    });
  };

  const handleAddFundSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFundSourceName.trim()) return;
    const balanceInCents = Math.round(parseFloat(newFundSourceBalance || '0') * 100);
    await addFundSourceMutation.mutateAsync({ name: newFundSourceName.trim(), balance: balanceInCents, userId: user.id }, {
      onSuccess: () => {
        setNewFundSourceName('');
        setNewFundSourceBalance('');
        toast({ title: 'Fund source added' });
      },
      onError: () => toast({ title: 'Error', description: 'Could not add fund source.', variant: 'destructive' }),
    });
  };

  const handleDeleteFundSource = async (id: string) => {
    await deleteFundSourceMutation.mutateAsync(id, {
      onSuccess: () => toast({ title: 'Fund source deleted' }),
      onError: () => toast({ title: 'Error', description: 'Could not delete fund source.', variant: 'destructive' }),
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences and data.</p>
        </div>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai">AI Settings</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="funds">Fund Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>AI Provider</CardTitle>
                <CardDescription>Choose your AI provider and enter the API key.</CardDescription>
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
                    <Input id="openai-key" type="password" value={openAIKey} onChange={(e) => setOpenAIKey(e.target.value)} placeholder="sk-..." disabled={aiProvider !== 'openai'} />
                  </div>
                  <div>
                    <Label htmlFor="gemini-key">Gemini API Key</Label>
                    <Input id="gemini-key" type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="AIza..." disabled={aiProvider !== 'gemini'} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveKeys}>Save Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Categories</CardTitle>
                <CardDescription>Organize your transactions with custom categories.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddCategory} className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                  <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g., Marketing, Software..." className="flex-1" required />
                  <Button type="submit" disabled={addCategoryMutation.isPending} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Category
                  </Button>
                </form>
                <div className="border-t -mx-6" />
                {categoriesLoading ? <ListSkeleton /> : categories.length > 0 ? (
                  <div className="space-y-2">
                    {categories.map(category => (
                      <div key={category.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <Tag className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)} disabled={deleteCategoryMutation.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : <EmptyList title="No Categories Found" description="Create your first category to start organizing transactions." />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funds">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>Fund Sources</CardTitle>
                    <CardDescription>Track accounts and payment methods.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setIsTransferDialogOpen(true)} className="w-full sm:w-auto">
                    <ArrowRightLeft className="h-4 w-4 mr-2" /> Transfer Funds
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddFundSource} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="fund-name">Name</Label>
                    <Input id="fund-name" value={newFundSourceName} onChange={(e) => setNewFundSourceName(e.target.value)} placeholder="e.g., Business Bank" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fund-balance">Balance</Label>
                    <Input id="fund-balance" value={newFundSourceBalance} onChange={(e) => setNewFundSourceBalance(e.target.value)} placeholder="0.00" type="number" step="0.01" className="sm:w-36" required />
                  </div>
                  <Button type="submit" disabled={addFundSourceMutation.isPending} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Source
                  </Button>
                </form>
                <div className="border-t -mx-6" />
                {fundSourcesLoading ? <ListSkeleton /> : fundSources.length > 0 ? (
                  <div className="space-y-2">
                    {fundSources.map(source => (
                      <div key={source.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          {source.name.toLowerCase().includes('bank') ? <Landmark className="h-5 w-5 text-muted-foreground" /> : <Wallet className="h-5 w-5 text-muted-foreground" />}
                          <div>
                            <p className="font-medium">{source.name}</p>
                            <p className="text-sm text-muted-foreground">Available Balance</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{formatCurrency(source.balance)}</p>
                          <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 mt-1" onClick={() => handleDeleteFundSource(source.id)} disabled={deleteFundSourceMutation.isPending}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyList title="No Fund Sources Found" description="Add a bank account or credit card to get started." />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TransferDialog open={isTransferDialogOpen} onClose={() => setIsTransferDialogOpen(false)} fundSources={fundSources} />
    </Layout>
  );
}
