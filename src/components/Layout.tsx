import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LayoutDashboard, Receipt, Bot, Settings, LogOut, Target } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

import { FEATURES } from '@/config/features';

interface LayoutProps {
  children: ReactNode;
}

const baseNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/budget', label: 'Budget', icon: Target },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Bot },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const navItems = baseNavItems.filter((item) => {
  if (item.path === '/ai-assistant' && !FEATURES.ENABLE_AI) {
    return false;
  }
  return true;
});

const SidebarNav = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onLinkClick?.();
  };

  return (
    <nav className="flex-1 space-y-1 p-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Button
            key={item.path}
            variant={isActive ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleNavigate(item.path)}
          >
            <Icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
};

const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-6">
        <h1 className="text-2xl font-bold">AI-Fi Tracker</h1>
        <p className="text-sm text-muted-foreground">Smart Finance Manager</p>
      </div>
      <SidebarNav onLinkClick={onLinkClick} />
      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setSheetOpen] = useState(false);

  if (isMobile === undefined) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 bg-background border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent onLinkClick={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold">AI-Fi Tracker</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card">
        <SidebarContent />
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
};
