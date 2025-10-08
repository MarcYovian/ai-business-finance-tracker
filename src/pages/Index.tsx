import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, TrendingUp, Zap } from 'lucide-react';

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
            AI-Powered Finance Tracking
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Manage your business finances with the power of artificial intelligence. 
            Just tell us about your transactions in plain English.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Bot className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold">AI Assistant</h3>
              <p className="text-muted-foreground">
                Talk to your finances naturally. No forms, no complicated interfaces.
              </p>
            </div>
            
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <TrendingUp className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Smart Insights</h3>
              <p className="text-muted-foreground">
                Get intelligent analysis of your spending patterns and financial health.
              </p>
            </div>
            
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Zap className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Add transactions in seconds. Track everything without the busywork.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
