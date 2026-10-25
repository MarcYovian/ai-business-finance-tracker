import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, AlertTriangle, Calendar, Wallet } from 'lucide-react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const NotificationPrefsWidget: React.FC = () => {
  const { user } = useAuth();
  const { preferences, updatePreferences, isUpdating } = useUserPreferences(user?.id);

  const emailNotifs = preferences?.emailNotifications ?? true;
  const budgetAlerts = preferences?.budgetAlerts ?? true;
  const recurringReminders = preferences?.recurringReminders ?? true;
  const lowBalanceAlerts = preferences?.lowBalanceAlerts ?? true;

  const handleToggle = async (key: 'emailNotifications' | 'budgetAlerts' | 'recurringReminders' | 'lowBalanceAlerts', val: boolean) => {
    try {
      await updatePreferences({ [key]: val });
      toast({
        title: 'Notification preferences updated',
        description: 'Changes have been saved to your account.',
      });
    } catch {
      // Handled in mutation
    }
  };

  return (
    <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-6 px-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-[#EDF8E8] text-[#2C6E20]">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-[#161F18]">
              Notification Preferences
            </CardTitle>
            <CardDescription className="text-xs text-[#737E75]">
              Choose which financial alerts and reminders you receive.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-1 space-y-4">
        {/* Email Notifications */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-[#E2E6DF] hover:bg-[#F9FAF8] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#161F18]">
                Email Notifications
              </Label>
              <p className="text-[11px] text-[#737E75]">
                Receive periodic financial digests and critical alerts via email.
              </p>
            </div>
          </div>
          <Switch
            checked={emailNotifs}
            onCheckedChange={(c) => handleToggle('emailNotifications', c)}
            disabled={isUpdating}
            className="data-[state=checked]:bg-[#529E42]"
          />
        </div>

        {/* Budget Spending Alerts */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-[#E2E6DF] hover:bg-[#F9FAF8] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#161F18]">
                Budget Limit Alerts
              </Label>
              <p className="text-[11px] text-[#737E75]">
                Get notified when monthly spending reaches over 80% of category limit.
              </p>
            </div>
          </div>
          <Switch
            checked={budgetAlerts}
            onCheckedChange={(c) => handleToggle('budgetAlerts', c)}
            disabled={isUpdating}
            className="data-[state=checked]:bg-[#529E42]"
          />
        </div>

        {/* Recurring Payment Reminders */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-[#E2E6DF] hover:bg-[#F9FAF8] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#161F18]">
                Recurring Bill Reminders
              </Label>
              <p className="text-[11px] text-[#737E75]">
                Reminders 2 days before subscriptions and scheduled bills are due.
              </p>
            </div>
          </div>
          <Switch
            checked={recurringReminders}
            onCheckedChange={(c) => handleToggle('recurringReminders', c)}
            disabled={isUpdating}
            className="data-[state=checked]:bg-[#529E42]"
          />
        </div>

        {/* Low Balance Warning */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-[#E2E6DF] hover:bg-[#F9FAF8] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#161F18]">
                Low Balance Warnings
              </Label>
              <p className="text-[11px] text-[#737E75]">
                Notify when account balance drops below minimum threshold.
              </p>
            </div>
          </div>
          <Switch
            checked={lowBalanceAlerts}
            onCheckedChange={(c) => handleToggle('lowBalanceAlerts', c)}
            disabled={isUpdating}
            className="data-[state=checked]:bg-[#529E42]"
          />
        </div>
      </CardContent>
    </Card>
  );
};
