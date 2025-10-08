import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiConfigStorage } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { TransferDialog } from '@/components/TransferDialog';
import { useCategories } from '@/hooks/useCategories';
import { useFundSources } from '@/hooks/useFundSources';
import { useAddCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useAddFundSource, useDeleteFundSource } from '@/hooks/useFundSources';

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

  const { data: categories = [] } = useCategories(user?.id || '');
  const { data: fundSources = [] } = useFundSources(user?.id || '');

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

  const handleAddCategory = async () => {
    if (!user || !newCategoryName.trim()) return;
    try {
      await addCategoryMutation.mutateAsync({ name: newCategoryName.trim(), userId: user.id });
      setNewCategoryName('');
      toast({ title: 'Category added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not add category.', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategoryMutation.mutateAsync(id);
      toast({ title: 'Category deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete category.', variant: 'destructive' });
    }
  };

  const handleAddFundSource = async () => {
    if (!user || !newFundSourceName.trim()) return;
    try {
      const balanceInCents = Math.round(parseFloat(newFundSourceBalance || '0') * 100);
      await addFundSourceMutation.mutateAsync({ 
        name: newFundSourceName.trim(), 
        balance: balanceInCents, 
        userId: user.id 
      });
      setNewFundSourceName('');
      setNewFundSourceBalance('');
      toast({ title: 'Fund source added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not add fund source.', variant: 'destructive' });
    }
  };

  const handleDeleteFundSource = async (id: string) => {
    try {
      await deleteFundSourceMutation.mutateAsync(id);
      toast({ title: 'Fund source deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete fund source.', variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your AI Finance Tracker</p>
        </div>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList>
            <TabsTrigger value="ai">AI Settings</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="funds">Fund Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>AI Provider & API Keys</CardTitle>
                <CardDescription>Choose your AI provider and enter the corresponding API key.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>AI Provider</Label>
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
                      disabled={aiProvider !== 'openai'}
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
                      disabled={aiProvider !== 'gemini'}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveKeys}>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Categories</CardTitle>
                <CardDescription>Organize your transactions with custom categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Marketing, Software, Office Supplies"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {categories.length > 0 ? (
                    categories.map(category => (
                      <div key={category.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span>{category.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No categories yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funds">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Fund Sources</CardTitle>
                  <CardDescription>Track different accounts and payment methods</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setIsTransferDialogOpen(true)}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transfer Funds
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newFundSourceName}
                    onChange={(e) => setNewFundSourceName(e.target.value)}
                    placeholder="e.g., Business Bank, Credit Card"
                    className="flex-1"
                  />
                  <Input
                    value={newFundSourceBalance}
                    onChange={(e) => setNewFundSourceBalance(e.target.value)}
                    placeholder="Initial balance"
                    className="w-32"
                  />
                  <Button onClick={handleAddFundSource}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {fundSources.length > 0 ? (
                    fundSources.map(source => (
                      <div key={source.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(source.balance)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFundSource(source.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No fund sources yet</p>
                  )}
                </div>
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
