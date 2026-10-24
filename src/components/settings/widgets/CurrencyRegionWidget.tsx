import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
  LANGUAGE_OPTIONS,
} from '../constants';
import { toast } from '@/hooks/use-toast';

export const CurrencyRegionWidget: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateProfile, isUpdating } = useUserProfile(user?.id);

  const currentCurrency = profile?.defaultCurrency || 'IDR';
  const currentDateFormat = profile?.dateFormat || 'DD MMM YYYY';
  const currentTimezone = profile?.timeZone || 'Asia/Jakarta';
  const currentLanguage = profile?.language || 'en';

  const handleCurrencyChange = async (val: string) => {
    try {
      await updateProfile({ defaultCurrency: val });
      toast({
        title: 'Currency updated',
        description: `Default currency set to ${val}.`,
      });
    } catch {
      // Handled in mutation
    }
  };

  const handleDateFormatChange = async (val: string) => {
    try {
      await updateProfile({ dateFormat: val });
      toast({
        title: 'Date format updated',
        description: `Date display format set to ${val}.`,
      });
    } catch {
      // Handled in mutation
    }
  };

  const handleTimezoneChange = async (val: string) => {
    try {
      await updateProfile({ timeZone: val });
      toast({
        title: 'Time zone updated',
        description: `Time zone updated to ${val}.`,
      });
    } catch {
      // Handled in mutation
    }
  };

  const handleLanguageChange = async (val: string) => {
    try {
      await updateProfile({ language: val });
      toast({
        title: 'Language updated',
        description: `Interface language updated.`,
      });
    } catch {
      // Handled in mutation
    }
  };

  return (
    <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3 pt-6 px-6">
          <CardTitle className="text-base sm:text-lg font-bold text-[#161F18]">
            Currency & Region
          </CardTitle>
          <CardDescription className="text-xs text-[#737E75]">
            Set your local currency, date format, and language.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-1 space-y-4">
          {/* Currency */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#F0F2EE]">
            <Label className="text-xs font-semibold text-[#161F18]">Currency</Label>
            <Select value={currentCurrency} onValueChange={handleCurrencyChange} disabled={isUpdating}>
              <SelectTrigger className="w-full sm:w-[220px] rounded-xl border-[#E2E6DF] bg-white text-xs h-9">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-xs">
                    <span className="font-semibold text-emerald-600 mr-1.5">{c.symbol}</span>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date format */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#F0F2EE]">
            <Label className="text-xs font-semibold text-[#161F18]">Date format</Label>
            <Select value={currentDateFormat} onValueChange={handleDateFormatChange} disabled={isUpdating}>
              <SelectTrigger className="w-full sm:w-[220px] rounded-xl border-[#E2E6DF] bg-white text-xs h-9">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time zone */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#F0F2EE]">
            <Label className="text-xs font-semibold text-[#161F18]">Time zone</Label>
            <Select value={currentTimezone} onValueChange={handleTimezoneChange} disabled={isUpdating}>
              <SelectTrigger className="w-full sm:w-[220px] rounded-xl border-[#E2E6DF] bg-white text-xs h-9">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-1">
            <Label className="text-xs font-semibold text-[#161F18]">Language</Label>
            <Select value={currentLanguage} onValueChange={handleLanguageChange} disabled={isUpdating}>
              <SelectTrigger className="w-full sm:w-[220px] rounded-xl border-[#E2E6DF] bg-white text-xs h-9">
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-[#737E75]" />
                  <SelectValue placeholder="Select language" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((l) => (
                  <SelectItem key={l.value} value={l.value} className="text-xs">
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
