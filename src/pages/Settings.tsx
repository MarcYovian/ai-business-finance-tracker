import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiKeyStorage, categoryStorage, fundSourceStorage } from '@/lib/storage';
import { Category, FundSource } from '@/types/finance';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export default function Settings() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newFundSourceName, setNewFundSourceName] = useState('');
  const [newFundSourceBalance, setNewFundSourceBalance] = useState('');

  useEffect(() => {
    const savedKey = apiKeyStorage.get();
    if (savedKey) {
      setApiKey(savedKey);
    }
    loadData();
  }, []);

  const loadData = () => {
    if (user) {
      setCategories(categoryStorage.getAll(user.id));
      setFundSources(fundSourceStorage.getAll(user.id));
    }
  };

  const handleSaveApiKey = () => {
    apiKeyStorage.set(apiKey);
    toast({ title: 'API Key saved', description: 'Your OpenAI API key has been stored securely.' });
  };

  const handleAddCategory = () => {
    if (!user || !newCategoryName.trim()) return;
    categoryStorage.create(newCategoryName.trim(), user.id);
    setNewCategoryName('');
    loadData();
    toast({ title: 'Category added' });
  };

  const handleDeleteCategory = (id: string) => {
    categoryStorage.delete(id);
    loadData();
    toast({ title: 'Category deleted' });
  };

  const handleAddFundSource = () => {
    if (!user || !newFundSourceName.trim()) return;
    const balanceInCents = Math.round(parseFloat(newFundSourceBalance || '0') * 100);
    fundSourceStorage.create(newFundSourceName.trim(), balanceInCents, user.id);
    setNewFundSourceName('');
    setNewFundSourceBalance('');
    loadData();
    toast({ title: 'Fund source added' });
  };

  const handleDeleteFundSource = (id: string) => {
    fundSourceStorage.delete(id);
    loadData();
    toast({ title: 'Fund source deleted' });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your AI Finance Tracker</p>
        </div>

        <Tabs defaultValue="api" className="w-full">
          <TabsList>
            <TabsTrigger value="api">API Key</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="funds">Fund Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>OpenAI API Key</CardTitle>
                <CardDescription>
                  Your API key is stored locally and never sent to our servers. Get your key from{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                    OpenAI Platform
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                </div>
                <Button onClick={handleSaveApiKey}>Save API Key</Button>
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
              <CardHeader>
                <CardTitle>Fund Sources</CardTitle>
                <CardDescription>Track different accounts and payment methods</CardDescription>
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
    </Layout>
  );
}
