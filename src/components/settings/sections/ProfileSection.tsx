import React from 'react';
import { ProfileInfoWidget } from '../widgets/ProfileInfoWidget';
import { AppPreferencesWidget } from '../widgets/AppPreferencesWidget';
import { CurrencyRegionWidget } from '../widgets/CurrencyRegionWidget';
import { QuickActionsWidget } from '../widgets/QuickActionsWidget';
import { AccountSecurityWidget } from '../widgets/AccountSecurityWidget';

export const ProfileSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 1. Profile Information Card */}
      <ProfileInfoWidget />

      {/* 2. Middle Row: App Preferences & Currency/Region */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <AppPreferencesWidget />
        <CurrencyRegionWidget />
      </div>

      {/* 3. Bottom Row: Quick Actions & Account Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <QuickActionsWidget />
        <AccountSecurityWidget />
      </div>
    </div>
  );
};
