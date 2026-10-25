import { LucideIcon } from 'lucide-react';
import { UserProfile, UserPreferences, AppTheme } from '@/types/finance';

export type SettingsSectionId =
  | 'profile'
  | 'preferences'
  | 'currency-region'
  | 'notifications'
  | 'data-management'
  | 'security'
  | 'mcp-api';

export interface SettingsMenuItem {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface UpdateProfilePayload {
  displayName?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  defaultCurrency?: string;
  dateFormat?: string;
  timeZone?: string;
  language?: string;
  avatarUrl?: string | null;
}

export interface UpdatePreferencesPayload {
  theme?: AppTheme;
  defaultLandingPage?: string;
  itemsPerPage?: number;
  showAccountBalance?: boolean;
  showCategoryIcons?: boolean;
  compactMode?: boolean;
  emailNotifications?: boolean;
  budgetAlerts?: boolean;
  recurringReminders?: boolean;
  lowBalanceAlerts?: boolean;
}

export interface DataUsageStats {
  transactionsCount: number;
  accountsCount: number;
  categoriesCount: number;
  budgetsCount: number;
}
