'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useFundSources } from '@/hooks/useFundSources';
import { useUserProfile } from '@/components/settings/hooks/useUserProfile';
import { TransactionDialog } from '@/components/TransactionDialog';
import { TransferDialog } from '@/components/TransferDialog';
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  LayoutDashboard,
  WalletCards,
  Receipt,
  PieChart,
  Bot,
  Tags,
  LogOut,
  User,
  Plus,
  ArrowRightLeft,
  CheckCheck,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Keyboard,
  ShieldCheck,
  Check,
  Calendar,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'budget' | 'ai' | 'system' | 'transaction';
  link?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuClick }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  // Search Palette State
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Quick Action Dialogs State
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Queries for global spotlight search
  const { data: transactions = [] } = useTransactions(user?.id || '');
  const { data: categories = [] } = useCategories(user?.id || '');
  const { data: fundSources = [] } = useFundSources(user?.id || '');

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Peringatan Anggaran',
      message: 'Pengeluaran Kategori Makanan & Minuman telah mencapai 82% dari batas pagu bulanan.',
      time: '15m yang lalu',
      read: false,
      type: 'budget',
      link: '/budget',
    },
    {
      id: '2',
      title: 'AI Financial Insight',
      message: 'Pengeluaran mingguan Anda lebih hemat Rp 450.000 dibandingkan minggu lalu.',
      time: '2 jam yang lalu',
      read: false,
      type: 'ai',
      link: '/ai-assistant',
    },
    {
      id: '3',
      title: 'Pengingat Mutasi Rekening',
      message: 'Periksa transaksi terbaru Anda untuk memastikan seluruh mutasi tercatat rapi.',
      time: '1 hari yang lalu',
      read: false,
      type: 'transaction',
      link: '/transactions',
    },
  ]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.link) {
      navigate(item.link);
    }
  };

  // Keyboard shortcut listener for Command + K / Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // User display name & avatar from database profile
  const { profile } = useUserProfile(user?.id);
  const userEmail = user?.email || '';
  const emailPrefix = user?.email ? user.email.split('@')[0] : 'User';
  const userDisplayName =
    profile?.displayName ||
    (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1));
  const userInitials =
    userDisplayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  const avatarUrl = profile?.avatarUrl || undefined;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSelectNavigation = (path: string) => {
    setIsSearchOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="h-16 px-3 sm:px-5 md:px-7 flex items-center justify-between border-b border-[#E7EBE4] bg-[#F5F6F3] shrink-0 sticky top-0 z-20 transition-all">
        {/* Left Side: Search Bar + Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl mr-2 sm:mr-3">
          {/* Mobile hamburger button */}
          {onMobileMenuClick && (
            <button
              type="button"
              onClick={onMobileMenuClick}
              className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border border-[#E2E6DF] flex items-center justify-center text-[#172019] shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-[#F9FAF8] transition-colors shrink-0"
              aria-label="Buka Menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4.5 w-4.5 sm:h-5 sm:w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* Search Trigger Bar matching the design in screenshot */}
          <div
            onClick={() => setIsSearchOpen(true)}
            className="group relative flex items-center flex-1 min-w-0 max-w-md h-9 sm:h-10 md:h-11 px-2.5 sm:px-3.5 md:px-4 rounded-xl sm:rounded-2xl bg-white border border-[#E2E6DF] shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:border-[#CAD2C5] hover:shadow-sm transition-all select-none"
          >
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#9AA59C] group-hover:text-[#6D776F] transition-colors shrink-0 mr-2 sm:mr-3" />
            <span className="text-[12px] sm:text-[13px] text-[#9AA59C] font-normal truncate flex-1">
              <span className="hidden xl:inline">Search transactions, categories, or anything...</span>
              <span className="hidden sm:inline xl:hidden">Search transactions, categories...</span>
              <span className="sm:hidden">Search...</span>
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] sm:text-[10.5px] font-mono text-[#8B968D] bg-[#F5F6F3] border border-[#E2E6DF] rounded-md shrink-0 ml-1.5">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right Side: Notification Bell + Settings Gear + User Profile Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
          {/* 1. Notification Bell Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl sm:rounded-2xl bg-white border border-[#E2E6DF] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center text-[#556057] hover:text-[#172019] hover:bg-[#F9FAF8] transition-all relative shrink-0"
                title="Notifikasi"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm p-0 rounded-2xl bg-white border border-[#E2E6DF] shadow-xl overflow-hidden"
            >
              <div className="p-3.5 border-b border-[#EDF1EB] flex items-center justify-between bg-[#FAFBF9]">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[13px] text-[#172019]">Notifikasi</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[10.5px] font-semibold">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotificationsAsRead}
                    className="text-[11px] font-medium text-[#2C6E20] hover:text-[#1D4A15] hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tandai dibaca
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#F1F3EF] max-h-[340px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-[12px] text-[#869288]">
                    Tidak ada notifikasi saat ini
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3.5 flex gap-3 text-left cursor-pointer transition-colors ${
                        item.read ? 'bg-white hover:bg-[#F9FAF8]' : 'bg-[#F4FAF1]/60 hover:bg-[#ECF7E8]'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'budget' && (
                          <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        )}
                        {item.type === 'ai' && (
                          <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                        {item.type === 'transaction' && (
                          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
                            <Receipt className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-[12px] truncate ${item.read ? 'font-medium text-[#333D35]' : 'font-bold text-[#172019]'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-[#9AA59C] shrink-0">{item.time}</span>
                        </div>
                        <p className="text-[11.5px] text-[#6D776F] leading-snug line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-[#EDF1EB] bg-[#FAFBF9] text-center">
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="text-[11.5px] font-medium text-[#556057] hover:text-[#172019] transition-colors"
                >
                  Buka Pengaturan Notifikasi
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* 2. Settings Gear Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl sm:rounded-2xl bg-white border border-[#E2E6DF] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center text-[#556057] hover:text-[#172019] hover:bg-[#F9FAF8] transition-all shrink-0"
                title="Pengaturan"
              >
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 max-w-[calc(100vw-1.5rem)] p-1.5 rounded-2xl bg-white border border-[#E2E6DF] shadow-xl"
            >
              <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] font-bold text-[#869288] uppercase tracking-wider">
                Pengaturan Cepat
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="px-2.5 py-2 text-[12.5px] rounded-xl cursor-pointer font-medium hover:bg-[#F5F7F4] flex items-center gap-2.5"
              >
                <Settings className="w-4 h-4 text-[#6D776F]" />
                <span>Pengaturan Umum</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/accounts')}
                className="px-2.5 py-2 text-[12.5px] rounded-xl cursor-pointer font-medium hover:bg-[#F5F7F4] flex items-center gap-2.5"
              >
                <WalletCards className="w-4 h-4 text-[#6D776F]" />
                <span>Rekening & Sumber Dana</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/categories')}
                className="px-2.5 py-2 text-[12.5px] rounded-xl cursor-pointer font-medium hover:bg-[#F5F7F4] flex items-center gap-2.5"
              >
                <Tags className="w-4 h-4 text-[#6D776F]" />
                <span>Kelola Kategori</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="px-2.5 py-2 text-[12.5px] rounded-xl cursor-pointer font-medium hover:bg-[#F5F7F4] flex items-center gap-2.5"
              >
                <Bot className="w-4 h-4 text-[#6D776F]" />
                <span>Integrasi AI API Keys</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. User Profile Pill Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="h-9 sm:h-10 md:h-11 px-1.5 sm:px-2 md:px-3 rounded-xl sm:rounded-2xl bg-white border border-[#E2E6DF] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-1.5 sm:gap-2 md:gap-2.5 cursor-pointer hover:bg-[#F9FAF8] hover:border-[#CAD2C5] transition-all select-none shrink-0"
              >
                <Avatar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full ring-1 ring-black/5 overflow-hidden shrink-0">
                  <AvatarImage src={avatarUrl} alt={userDisplayName} className="object-cover" />
                  <AvatarFallback className="bg-[#E2ED7C] text-[#233319] text-[10px] sm:text-[11px] font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                {/* Display name: Show on tablet (md:) and desktop */}
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-[12px] sm:text-[12.5px] font-semibold text-[#172019] leading-tight truncate max-w-[90px] lg:max-w-[120px] xl:max-w-[150px]">
                    {userDisplayName}
                  </span>
                  {/* Email: Only show on large desktop (lg:) where there's ample room */}
                  <span className="hidden lg:inline text-[9.5px] sm:text-[10px] text-[#869288] leading-tight truncate max-w-[120px] xl:max-w-[150px]">
                    {userEmail}
                  </span>
                </div>

                <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#869288] shrink-0" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-64 max-w-[calc(100vw-1.5rem)] p-1.5 rounded-2xl bg-white border border-[#E2E6DF] shadow-xl"
            >
              {/* Profile Card Summary Header */}
              <div className="px-3 py-2.5 mb-1 bg-[#FAFBF9] rounded-xl border border-[#EDF1EB] flex items-center gap-3">
                <Avatar className="w-9 h-9 rounded-full ring-1 ring-black/5 shrink-0">
                  <AvatarImage src={avatarUrl} alt={userDisplayName} />
                  <AvatarFallback className="bg-[#E2ED7C] text-[#233319] text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold text-[#172019] truncate">
                    {userDisplayName}
                  </span>
                  <span className="text-[10.5px] text-[#869288] truncate">
                    {userEmail}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-[#2C6E20] mt-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    Personal Account
                  </span>
                </div>
              </div>

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => navigate('/settings')}
                  className="px-2.5 py-2 text-[12.5px] rounded-xl cursor-pointer font-medium hover:bg-[#F5F7F4] flex items-center gap-2.5"
                >
                  <User className="w-4 h-4 text-[#6D776F]" />
                  <span>Profil & Akun</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/budget')}
                  className="px-2.5 py-2 text-[12.5px] rounded-xl cursor-pointer font-medium hover:bg-[#F5F7F4] flex items-center gap-2.5"
                >
                  <PieChart className="w-4 h-4 text-[#6D776F]" />
                  <span>Target & Anggaran</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/accounts')}
                  className="px-2.5 py-2 text-[12.5px] rounded-xl cursor-pointer font-medium hover:bg-[#F5F7F4] flex items-center gap-2.5"
                >
                  <WalletCards className="w-4 h-4 text-[#6D776F]" />
                  <span>Rekening & Dompet</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1 bg-[#EDF1EB]" />

              <DropdownMenuItem
                onClick={() => setIsSearchOpen(true)}
                className="px-2.5 py-2 text-[12.5px] rounded-xl cursor-pointer font-medium hover:bg-[#F5F7F4] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-4 h-4 text-[#6D776F]" />
                  <span>Pencarian Cepat</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#8B968D] bg-[#F5F6F3] border border-[#E2E6DF] rounded">
                  ⌘K
                </kbd>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-[#EDF1EB]" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="px-2.5 py-2 text-[12.5px] rounded-xl cursor-pointer font-medium text-[#DE4436] hover:bg-[#FDEFE8] hover:text-[#DE4436] flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4 text-[#DE4436]" />
                <span>Keluar Akun</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Command Palette / Spotlight Search Modal */}
      <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <CommandInput placeholder="Cari transaksi, kategori, menu, atau lakukan aksi cepat..." />
        <CommandList className="max-h-[380px]">
          <CommandEmpty>Tidak ada hasil yang ditemukan.</CommandEmpty>

          {/* Quick Actions Group */}
          <CommandGroup heading="Aksi Cepat">
            <CommandItem
              onSelect={() => {
                setIsSearchOpen(false);
                setIsAddTransactionOpen(true);
              }}
              className="cursor-pointer gap-2.5 py-2 text-[13px]"
            >
              <div className="w-6 h-6 rounded-lg bg-[#EDF8E8] text-[#2C6E20] flex items-center justify-center shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-[#172019]">Tambah Transaksi Baru</span>
              <span className="ml-auto text-[11px] text-[#869288]">Dialog</span>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                setIsSearchOpen(false);
                setIsTransferOpen(true);
              }}
              className="cursor-pointer gap-2.5 py-2 text-[13px]"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-[#172019]">Transfer Dana Antar Rekening</span>
              <span className="ml-auto text-[11px] text-[#869288]">Dialog</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelectNavigation('/ai-assistant')}
              className="cursor-pointer gap-2.5 py-2 text-[13px]"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-[#172019]">Tanya AI Assistant Keuangan</span>
              <span className="ml-auto text-[11px] text-[#869288]">AI Chat</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="my-1" />

          {/* Navigation Pages Group */}
          <CommandGroup heading="Navigasi Halaman">
            <CommandItem
              onSelect={() => handleSelectNavigation('/dashboard')}
              className="cursor-pointer gap-2.5 py-2 text-[13px]"
            >
              <LayoutDashboard className="w-4 h-4 text-[#6D776F]" />
              <span>Dashboard Utama</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelectNavigation('/accounts')}
              className="cursor-pointer gap-2.5 py-2 text-[13px]"
            >
              <WalletCards className="w-4 h-4 text-[#6D776F]" />
              <span>Daftar Akun & Rekening</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelectNavigation('/transactions')}
              className="cursor-pointer gap-2.5 py-2 text-[13px]"
            >
              <Receipt className="w-4 h-4 text-[#6D776F]" />
              <span>Semua Transaksi</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelectNavigation('/budget')}
              className="cursor-pointer gap-2.5 py-2 text-[13px]"
            >
              <PieChart className="w-4 h-4 text-[#6D776F]" />
              <span>Anggaran Bulanan</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelectNavigation('/categories')}
              className="cursor-pointer gap-2.5 py-2 text-[13px]"
            >
              <Tags className="w-4 h-4 text-[#6D776F]" />
              <span>Kategori Keuangan</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelectNavigation('/settings')}
              className="cursor-pointer gap-2.5 py-2 text-[13px]"
            >
              <Settings className="w-4 h-4 text-[#6D776F]" />
              <span>Pengaturan & Preferensi</span>
            </CommandItem>
          </CommandGroup>

          {/* Categories Search Group */}
          {categories.length > 0 && (
            <>
              <CommandSeparator className="my-1" />
              <CommandGroup heading="Kategori Terdaftar">
                {categories.slice(0, 5).map((category) => (
                  <CommandItem
                    key={category.id}
                    onSelect={() => handleSelectNavigation('/categories')}
                    className="cursor-pointer gap-2.5 py-1.5 text-[12.5px]"
                  >
                    <Tags className="w-3.5 h-3.5 text-[#869288]" />
                    <span>{category.name}</span>
                    <span className="ml-auto text-[10.5px] uppercase tracking-wider text-[#869288]">
                      {category.type}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Recent Transactions Group */}
          {transactions.length > 0 && (
            <>
              <CommandSeparator className="my-1" />
              <CommandGroup heading="Transaksi Terkini">
                {transactions.slice(0, 6).map((tx) => (
                  <CommandItem
                    key={tx.id}
                    onSelect={() => handleSelectNavigation('/transactions')}
                    className="cursor-pointer gap-2.5 py-2 text-[12.5px]"
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-500'
                          : tx.type === 'expense'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex flex-col min-w-0 flex-1 mr-2">
                      <span className="font-medium text-[#172019] truncate">
                        {tx.description || 'Transaksi Tanpa Nama'}
                      </span>
                      <span className="text-[10px] sm:text-[10.5px] text-[#869288]">
                        {format(new Date(tx.transactionDate), 'dd MMM yyyy')}
                      </span>
                    </div>
                    <span
                      className={`ml-auto shrink-0 font-mono text-[11.5px] sm:text-[12px] font-semibold ${
                        tx.type === 'income'
                          ? 'text-emerald-600'
                          : tx.type === 'expense'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {tx.type === 'expense' ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>

      {/* Global Quick Modals */}
      <TransactionDialog
        open={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
      />

      <TransferDialog
        open={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        fundSources={fundSources}
      />
    </>
  );
};
