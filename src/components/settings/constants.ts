import {
  User,
  Sliders,
  Globe,
  Bell,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { SettingsMenuItem } from './types';

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Your personal information',
    icon: User,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'App preferences and display',
    icon: Sliders,
  },
  {
    id: 'currency-region',
    label: 'Currency & Region',
    description: 'Currency, date, and language',
    icon: Globe,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alerts and reminders',
    icon: Bell,
  },
  {
    id: 'data-management',
    label: 'Data Management',
    description: 'Import, export, and reset data',
    icon: Database,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Password and security settings',
    icon: ShieldCheck,
  },
];

export const CURRENCY_OPTIONS = [
  { value: 'IDR', label: 'Indonesian Rupiah (Rp)', symbol: 'Rp' },
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'SGD', label: 'Singapore Dollar (S$)', symbol: 'S$' },
  { value: 'MYR', label: 'Malaysian Ringgit (RM)', symbol: 'RM' },
];

export const DATE_FORMAT_OPTIONS = [
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY (10 Nov 2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-11-10)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (10/11/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (11/10/2026)' },
];

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Jakarta', label: '(UTC+07:00) Jakarta, Indonesia' },
  { value: 'Asia/Makassar', label: '(UTC+08:00) Makassar, Bali' },
  { value: 'Asia/Jayapura', label: '(UTC+09:00) Jayapura, WIT' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore' },
  { value: 'UTC', label: '(UTC+00:00) Coordinated Universal Time' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa Indonesia' },
];

export const LANDING_PAGE_OPTIONS = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/accounts', label: 'Accounts' },
  { value: '/transactions', label: 'Transactions' },
  { value: '/budget', label: 'Budget' },
  { value: '/categories', label: 'Categories' },
];

export const ITEMS_PER_PAGE_OPTIONS = [
  { value: 10, label: '10 items' },
  { value: 25, label: '25 items' },
  { value: 50, label: '50 items' },
  { value: 100, label: '100 items' },
];
