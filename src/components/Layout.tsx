'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  WalletCards,
  Receipt,
  PieChart,
  Bot,
  Settings,
  LogOut,
  Tags,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { FEATURES } from '@/config/features';
import { Header } from '@/components/Header';

interface LayoutProps {
  children: ReactNode;
}

interface SubNavItem {
  path: string;
  label: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  children?: SubNavItem[];
}

const baseNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/accounts', label: 'Accounts', icon: WalletCards },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  {
    path: '/budget',
    label: 'Budget',
    icon: PieChart,
    children: [
      { path: '/budget', label: 'Monthly Budget' },
      { path: '/budget/history', label: 'Budget History' },
    ],
  },
  { path: '/categories', label: 'Categories', icon: Tags },
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
  const router = useRouter();
  const pathname = usePathname();
  const [budgetOpen, setBudgetOpen] = useState(() =>
    pathname.startsWith('/budget')
  );

  const handleNavigate = (path: string) => {
    router.push(path);
    onLinkClick?.();
  };

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isParentActive = pathname.startsWith(item.path);

        if (hasChildren) {
          return (
            <div key={item.path} className="space-y-1">
              <button
                type="button"
                onClick={() => setBudgetOpen((prev) => !prev)}
                className={`w-full relative flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-colors text-left ${
                  isParentActive && !budgetOpen
                    ? 'bg-[#EDF8E8] text-[#2C6E20] font-semibold border border-[#D2ECD0]'
                    : 'text-[#6D776F] hover:text-[#172019] hover:bg-[#F6F7F5] font-medium border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-[18px] w-[18px] shrink-0 text-[#6D776F]" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[#9AA59C]">
                  {budgetOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
              </button>

              {budgetOpen && (
                <div className="pl-4 space-y-1 pt-0.5">
                  {item.children!.map((child) => {
                    const isChildActive =
                      child.path === '/budget'
                        ? pathname === '/budget' || pathname === '/budget/monthly'
                        : pathname === child.path;

                    return (
                      <button
                        key={child.path}
                        type="button"
                        onClick={() => handleNavigate(child.path)}
                        className={`w-full relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12.5px] transition-colors text-left ${
                          isChildActive
                            ? 'bg-[#EDF8E8] text-[#2C6E20] font-semibold border border-[#D2ECD0]'
                            : 'text-[#6D776F] hover:text-[#172019] hover:bg-[#F6F7F5] font-medium border border-transparent'
                        }`}
                      >
                        {isChildActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#529E42] rounded-r-md" />
                        )}
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const isActive = pathname === item.path;

        return (
          <button
            key={item.path}
            type="button"
            onClick={() => handleNavigate(item.path)}
            className={`w-full relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-colors text-left ${
              isActive
                ? 'bg-[#EDF8E8] text-[#2C6E20] font-semibold border border-[#D2ECD0]'
                : 'text-[#6D776F] hover:text-[#172019] hover:bg-[#F6F7F5] font-medium border border-transparent'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#529E42] rounded-r-md" />
            )}
            <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-[#529E42]' : 'text-[#6D776F]'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="flex h-full flex-col justify-between p-4 bg-white">
      <div className="space-y-6">
        {/* Brand Logo matching ACRU */}
        <div className="px-2 pt-1 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8DC53E]" />
            <span className="font-extrabold text-[22px] tracking-tight text-[#161F18] font-sans">
              Finantika
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <SidebarNav onLinkClick={onLinkClick} />
      </div>

      {/* Bottom Action */}
      <div className="pt-4 border-t border-[#EDF1EB]">
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-[#737E75] hover:text-[#DE4436] hover:bg-[#FDEFE8] rounded-xl transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex bg-[#F5F6F3] antialiased text-[#1A221C]">
      {/* Desktop Left Sidebar (~220px) */}
      <aside className="w-[220px] bg-white border-r border-[#E7EBE4] shrink-0 hidden md:flex flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer (Controlled by isSheetOpen) */}
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[240px] p-0 bg-white">
          <SidebarContent onLinkClick={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F5F6F3] min-h-screen">
        {/* Top Header Bar */}
        <Header onMobileMenuClick={() => setSheetOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
