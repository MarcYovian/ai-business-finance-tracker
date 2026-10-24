import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const NotificationsHistoryWidget: React.FC = () => {
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['settings_recent_notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-6 px-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-[#161F18]">
              Recent Activity Alerts
            </CardTitle>
            <CardDescription className="text-xs text-[#737E75]">
              System alerts and automated reminders logged for your account.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-1">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-[#E2E6DF] rounded-xl p-4">
            <Bell className="mx-auto h-8 w-8 text-[#9AA59C] mb-2" />
            <p className="text-xs font-medium text-[#161F18]">No notifications yet</p>
            <p className="text-[11px] text-[#737E75]">
              Alerts regarding budgets, goals, and security will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((item: any) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-[#E2E6DF] bg-[#FAFBF9]"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EDF8E8] text-[#2C6E20] flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#161F18] flex items-center justify-between">
                    <span>{item.title}</span>
                    <span className="text-[10px] text-[#9AA59C] flex items-center gap-1 font-normal">
                      <Clock className="h-3 w-3" />
                      {item.created_at
                        ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
                        : 'just now'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737E75] mt-0.5 line-clamp-2">
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
