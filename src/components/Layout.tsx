import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  LayoutDashboard,
  WalletCards,
  Receipt,
  PieChart,
  Bot,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  Zap,
  Tags,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { FEATURES } from '@/config/features';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [budgetOpen, setBudgetOpen] = useState(() =>
    location.pathname.startsWith('/budget')
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    onLinkClick?.();
  };

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isParentActive = location.pathname.startsWith(item.path);

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
                        ? location.pathname === '/budget' || location.pathname === '/budget/monthly'
                        : location.pathname === child.path;

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

        const isActive = location.pathname === item.path;

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
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const userDisplayName = user?.email ? user.email.split('@')[0] : 'Arya Danuarta';
  const userFormattedName =
    userDisplayName.charAt(0).toUpperCase() + userDisplayName.slice(1);
  const userEmail = user?.email || 'm.danuarta@finantika.com';
  const userInitials = userFormattedName.slice(0, 2).toUpperCase();

  const handleAddTransaction = () => {
    navigate('/transactions');
  };

  const handleOpenSettings = () => {
    navigate('/settings');
  };

  if (isMobile === undefined) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex bg-[#F5F6F3] antialiased text-[#1A221C]">
      {/* Desktop Left Sidebar (~220px) */}
      <aside className="w-[220px] bg-white border-r border-[#E7EBE4] shrink-0 hidden md:flex flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F5F6F3] min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 px-4 sm:px-7 flex items-center justify-between border-b border-[#E7EBE4] bg-[#F5F6F3] shrink-0 sticky top-0 z-20">
          {/* Left: Mobile hamburger or Search Bar */}
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Trigger */}
            <div className="md:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl bg-white border border-[#E2E6DF]">
                    <Menu className="h-5 w-5 text-[#172019]" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[240px] p-0 bg-white">
                  <SidebarContent onLinkClick={() => setSheetOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>

            {/* Search Bar matching ACRU */}
            <div className="relative w-44 sm:w-72 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9AA59C]" />
              <input
                type="text"
                placeholder="Pencarian cepat..."
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-white border border-[#E3E8E0] text-[13px] text-[#172019] placeholder:text-[#9AA59C] focus:outline-none focus:border-[#8DC53E] focus:ring-1 focus:ring-[#8DC53E] transition-all"
              />
            </div>
          </div>

          {/* Right: Header Actions matching ACRU */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell with red dot */}
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-white border border-[#E2E6DF] flex items-center justify-center text-[#556057] hover:text-[#172019] hover:bg-[#F9FAF8] transition-colors relative"
              title="Notifikasi"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#DE4436] rounded-full" />
            </button>

            {/* Settings Gear Button */}
            <button
              type="button"
              onClick={handleOpenSettings}
              className="w-9 h-9 rounded-xl bg-white border border-[#E2E6DF] flex items-center justify-center text-[#556057] hover:text-[#172019] hover:bg-[#F9FAF8] transition-colors"
              title="Pengaturan"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* User Profile Pill */}
            <div
              onClick={handleOpenSettings}
              className="flex items-center gap-2.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white border border-[#E2E6DF] cursor-pointer hover:bg-[#F9FAF8] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#E2ED7C] text-[#233319] flex items-center justify-center font-bold text-[11px] shrink-0">
                {userInitials}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[12px] font-bold text-[#172019] leading-tight truncate max-w-[120px]">
                  {userFormattedName}
                </span>
                <span className="text-[10px] text-[#869288] leading-tight truncate max-w-[120px]">
                  {userEmail}
                </span>
              </div>
            </div>

            {/* Tambah Transaksi CTA Button */}
            <button
              type="button"
              onClick={handleAddTransaction}
              className="flex items-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-xl bg-white border border-[#18211A] text-[#18211A] hover:bg-[#18211A] hover:text-white font-semibold text-[12px] transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tambah Transaksi</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
