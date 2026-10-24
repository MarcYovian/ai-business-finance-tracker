import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserPreferences, AppTheme } from '@/types/finance';
import { UpdatePreferencesPayload } from '../types';

export const useUserPreferences = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user_preferences', userId],
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user preferences:', error);
        throw error;
      }

      if (!data) {
        // Auto create default preferences row
        const { data: created, error: insertError } = await supabase
          .from('user_preferences')
          .insert([{ user_id: userId }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user preferences:', insertError);
          return null;
        }

        return {
          id: created.id,
          userId: created.user_id,
          theme: created.theme || 'light',
          defaultLandingPage: created.default_landing_page || '/dashboard',
          itemsPerPage: created.items_per_page || 10,
          showAccountBalance: created.show_account_balance ?? true,
          showCategoryIcons: created.show_category_icons ?? true,
          compactMode: created.compact_mode ?? false,
          emailNotifications: created.email_notifications ?? true,
          budgetAlerts: created.budget_alerts ?? true,
          recurringReminders: created.recurring_reminders ?? true,
          lowBalanceAlerts: created.low_balance_alerts ?? true,
          createdAt: created.created_at,
          updatedAt: created.updated_at,
        };
      }

      return {
        id: data.id,
        userId: data.user_id,
        theme: (data.theme as AppTheme) || 'light',
        defaultLandingPage: data.default_landing_page || '/dashboard',
        itemsPerPage: data.items_per_page || 10,
        showAccountBalance: data.show_account_balance ?? true,
        showCategoryIcons: data.show_category_icons ?? true,
        compactMode: data.compact_mode ?? false,
        emailNotifications: data.email_notifications ?? true,
        budgetAlerts: data.budget_alerts ?? true,
        recurringReminders: data.recurring_reminders ?? true,
        lowBalanceAlerts: data.low_balance_alerts ?? true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    enabled: !!userId,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (payload: UpdatePreferencesPayload) => {
      if (!userId) throw new Error('User ID is required');

      const dbPayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.theme !== undefined) {
        dbPayload.theme = payload.theme;
        // Synchronize dark class on document root
        if (payload.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (payload.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle('dark', prefersDark);
        }
      }

      if (payload.defaultLandingPage !== undefined) {
        dbPayload.default_landing_page = payload.defaultLandingPage;
      }
      if (payload.itemsPerPage !== undefined) {
        dbPayload.items_per_page = payload.itemsPerPage;
      }
      if (payload.showAccountBalance !== undefined) {
        dbPayload.show_account_balance = payload.showAccountBalance;
      }
      if (payload.showCategoryIcons !== undefined) {
        dbPayload.show_category_icons = payload.showCategoryIcons;
      }
      if (payload.compactMode !== undefined) {
        dbPayload.compact_mode = payload.compactMode;
      }
      if (payload.emailNotifications !== undefined) {
        dbPayload.email_notifications = payload.emailNotifications;
      }
      if (payload.budgetAlerts !== undefined) {
        dbPayload.budget_alerts = payload.budgetAlerts;
      }
      if (payload.recurringReminders !== undefined) {
        dbPayload.recurring_reminders = payload.recurringReminders;
      }
      if (payload.lowBalanceAlerts !== undefined) {
        dbPayload.low_balance_alerts = payload.lowBalanceAlerts;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .update(dbPayload)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_preferences', userId] });
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    isUpdating: updatePreferencesMutation.isPending,
  };
};
