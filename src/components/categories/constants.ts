import React from 'react';
import {
  Utensils,
  Coffee,
  Car,
  Fuel,
  Bus,
  Home,
  Zap,
  Briefcase,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  DollarSign,
  Gift,
  HeartPulse,
  GraduationCap,
  Plane,
  Film,
  Smartphone,
  PiggyBank,
  CreditCard,
  Tag,
  Package,
  Layers,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  // Lucide icon names (standard or prefixed)
  utensils: Utensils,
  'i-lucide-utensils': Utensils,
  coffee: Coffee,
  'i-lucide-coffee': Coffee,
  car: Car,
  'i-lucide-car': Car,
  fuel: Fuel,
  'i-lucide-fuel': Fuel,
  bus: Bus,
  'i-lucide-bus': Bus,
  home: Home,
  'i-lucide-home': Home,
  zap: Zap,
  'i-lucide-zap': Zap,
  briefcase: Briefcase,
  'i-lucide-briefcase': Briefcase,
  'shopping-bag': ShoppingBag,
  'i-lucide-shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  'i-lucide-shopping-cart': ShoppingCart,
  wallet: Wallet,
  'i-lucide-wallet': Wallet,
  'dollar-sign': DollarSign,
  'i-lucide-dollar-sign': DollarSign,
  gift: Gift,
  'i-lucide-gift': Gift,
  'heart-pulse': HeartPulse,
  'i-lucide-heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'i-lucide-graduation-cap': GraduationCap,
  plane: Plane,
  'i-lucide-plane': Plane,
  film: Film,
  'i-lucide-film': Film,
  smartphone: Smartphone,
  'i-lucide-smartphone': Smartphone,
  'piggy-bank': PiggyBank,
  'i-lucide-piggy-bank': PiggyBank,
  'credit-card': CreditCard,
  'i-lucide-credit-card': CreditCard,
  tag: Tag,
  'i-lucide-tag': Tag,
  package: Package,
  'i-lucide-package': Package,
  layers: Layers,
  'i-lucide-layers': Layers,
  sparkles: Sparkles,
};

export const AVAILABLE_ICONS = [
  { name: 'utensils', label: 'Utensils', icon: Utensils },
  { name: 'coffee', label: 'Coffee', icon: Coffee },
  { name: 'car', label: 'Car', icon: Car },
  { name: 'fuel', label: 'Fuel', icon: Fuel },
  { name: 'bus', label: 'Public Transport', icon: Bus },
  { name: 'home', label: 'Home', icon: Home },
  { name: 'zap', label: 'Utilities', icon: Zap },
  { name: 'briefcase', label: 'Work / Salary', icon: Briefcase },
  { name: 'shopping-bag', label: 'Shopping', icon: ShoppingBag },
  { name: 'shopping-cart', label: 'Groceries', icon: ShoppingCart },
  { name: 'wallet', label: 'Wallet', icon: Wallet },
  { name: 'dollar-sign', label: 'Income', icon: DollarSign },
  { name: 'gift', label: 'Gift', icon: Gift },
  { name: 'heart-pulse', label: 'Health', icon: HeartPulse },
  { name: 'graduation-cap', label: 'Education', icon: GraduationCap },
  { name: 'plane', label: 'Travel', icon: Plane },
  { name: 'film', label: 'Entertainment', icon: Film },
  { name: 'smartphone', label: 'Gadget / Internet', icon: Smartphone },
  { name: 'piggy-bank', label: 'Savings', icon: PiggyBank },
  { name: 'credit-card', label: 'Credit / Debt', icon: CreditCard },
  { name: 'tag', label: 'Tag', icon: Tag },
];

export const CATEGORY_COLORS = [
  { name: 'Green', hex: '#10B981', bg: '#EDF8E8', text: '#529E42' },
  { name: 'Blue', hex: '#3B82F6', bg: '#EFF6FF', text: '#2563EB' },
  { name: 'Red', hex: '#EF4444', bg: '#FEF2F2', text: '#DC2626' },
  { name: 'Orange', hex: '#F97316', bg: '#FFF7ED', text: '#EA580C' },
  { name: 'Amber', hex: '#F59E0B', bg: '#FEF3C7', text: '#D97706' },
  { name: 'Purple', hex: '#8B5CF6', bg: '#F5F3FF', text: '#7C3AED' },
  { name: 'Pink', hex: '#EC4899', bg: '#FDF2F8', text: '#DB2777' },
  { name: 'Cyan', hex: '#06B6D4', bg: '#ECFEFF', text: '#0891B2' },
  { name: 'Slate', hex: '#64748B', bg: '#F1F5F9', text: '#475569' },
];

export const SUBCATEGORY_PALETTE = [
  '#529E42', // green
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#10B981', // emerald
  '#6366F1', // indigo
];

export function getCategoryIcon(iconKey?: string | null): LucideIcon {
  if (!iconKey) return Tag;
  const cleaned = iconKey.toLowerCase().trim();
  return CATEGORY_ICON_MAP[cleaned] || Tag;
}
