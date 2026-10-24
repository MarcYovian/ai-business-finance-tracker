import React from 'react';
import { NotificationPrefsWidget } from '../widgets/NotificationPrefsWidget';
import { NotificationsHistoryWidget } from '../widgets/NotificationsHistoryWidget';

export const NotificationsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 1. Notification Preferences Switches */}
      <NotificationPrefsWidget />

      {/* 2. Notifications History Feed from DB */}
      <NotificationsHistoryWidget />
    </div>
  );
};
