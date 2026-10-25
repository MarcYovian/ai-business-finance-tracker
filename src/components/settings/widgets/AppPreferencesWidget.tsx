import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useAuth } from '@/contexts/AuthContext';
import { LANDING_PAGE_OPTIONS, ITEMS_PER_PAGE_OPTIONS } from '../constants';
import { AppTheme } from '@/types/finance';
import { toast } from '@/hooks/use-toast';

export const AppPreferencesWidget: React.FC = () => {
  const { user } = useAuth();
  const { preferences, updatePreferences, isUpdating } = useUserPreferences(user?.id);

  const currentTheme = preferences?.theme || 'light';
  const defaultPage = preferences?.defaultLandingPage || '/dashboard';
  const itemsPerPage = preferences?.itemsPerPage || 10;
  const showBalance = preferences?.showAccountBalance ?? true;
  const showIcons = preferences?.showCategoryIcons ?? true;
  const compactMode = preferences?.compactMode ?? false;

  const handleThemeChange = async (theme: AppTheme) => {
    try {
      await updatePreferences({ theme });
      toast({
        title: 'Theme updated',
        description: `Theme preference switched to ${theme}.`,
      });
    } catch {
      // Handled in mutation
    }
  };

  const handleLandingPageChange = async (val: string) => {
    try {
      await updatePreferences({ defaultLandingPage: val });
      toast({
        title: 'Landing page updated',
        description: 'Default start page updated successfully.',
      });
    } catch {
      // Handled in mutation
    }
  };

  const handleItemsPerPageChange = async (val: string) => {
    try {
      await updatePreferences({ itemsPerPage: parseInt(val, 10) });
      toast({
        title: 'Table pagination updated',
        description: `Tables will now display ${val} items per page.`,
      });
    } catch {
      // Handled in mutation
    }
  };

  const handleToggleBalance = async (checked: boolean) => {
    try {
      await updatePreferences({ showAccountBalance: checked });
    } catch {
      // Handled in mutation
    }
  };

  const handleToggleIcons = async (checked: boolean) => {
    try {
      await updatePreferences({ showCategoryIcons: checked });
    } catch {
      // Handled in mutation
    }
  };

  const handleToggleCompact = async (checked: boolean) => {
    try {
      await updatePreferences({ compactMode: checked });
    } catch {
      // Handled in mutation
    }
  };

  return (
    <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3 pt-6 px-6">
          <CardTitle className="text-base sm:text-lg font-bold text-[#161F18]">
            App Preferences
          </CardTitle>
          <CardDescription className="text-xs text-[#737E75]">
            Customize your app experience.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-1 space-y-5">
          {/* Theme Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#F0F2EE]">
            <div>
              <Label className="text-xs font-semibold text-[#161F18]">Theme</Label>
              <p className="text-[11px] text-[#737E75]">Choose your preferred theme.</p>
            </div>
            <div className="inline-flex p-1 bg-[#F5F6F3] rounded-xl border border-[#E2E6DF] shrink-0">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentTheme === 'light'
                    ? 'bg-white text-[#2C6E20] shadow-sm border border-[#D2ECD0]'
                    : 'text-[#6D776F] hover:text-[#161F18]'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentTheme === 'dark'
                    ? 'bg-[#161F18] text-white shadow-sm'
                    : 'text-[#6D776F] hover:text-[#161F18]'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentTheme === 'system'
                    ? 'bg-white text-[#161F18] shadow-sm border border-[#E2E6DF]'
                    : 'text-[#6D776F] hover:text-[#161F18]'
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Default Landing Page */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#F0F2EE]">
            <div>
              <Label className="text-xs font-semibold text-[#161F18]">
                Default landing page
              </Label>
              <p className="text-[11px] text-[#737E75]">Page to open after login.</p>
            </div>
            <Select value={defaultPage} onValueChange={handleLandingPageChange}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-[#E2E6DF] bg-white text-xs h-9">
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent>
                {LANDING_PAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Per Page */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#F0F2EE]">
            <div>
              <Label className="text-xs font-semibold text-[#161F18]">Items per page</Label>
              <p className="text-[11px] text-[#737E75]">Number of items in tables.</p>
            </div>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-[#E2E6DF] bg-white text-xs h-9">
                <SelectValue placeholder="Items count" />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show Account Balance Toggle */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <Label className="text-xs font-semibold text-[#161F18]">
                Show account balance
              </Label>
              <p className="text-[11px] text-[#737E75]">
                Display account balance on dashboard and accounts page.
              </p>
            </div>
            <Switch
              checked={showBalance}
              onCheckedChange={handleToggleBalance}
              disabled={isUpdating}
              className="data-[state=checked]:bg-[#529E42]"
            />
          </div>

          {/* Show Category Icons Toggle */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <Label className="text-xs font-semibold text-[#161F18]">
                Show category icons
              </Label>
              <p className="text-[11px] text-[#737E75]">
                Display icons for categories in transactions.
              </p>
            </div>
            <Switch
              checked={showIcons}
              onCheckedChange={handleToggleIcons}
              disabled={isUpdating}
              className="data-[state=checked]:bg-[#529E42]"
            />
          </div>

          {/* Compact Mode Toggle */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <Label className="text-xs font-semibold text-[#161F18]">Compact mode</Label>
              <p className="text-[11px] text-[#737E75]">
                Use a more compact layout for tables and lists.
              </p>
            </div>
            <Switch
              checked={compactMode}
              onCheckedChange={handleToggleCompact}
              disabled={isUpdating}
              className="data-[state=checked]:bg-[#529E42]"
            />
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
