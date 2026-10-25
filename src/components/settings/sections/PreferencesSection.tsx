import React from 'react';
import { AppPreferencesWidget } from '../widgets/AppPreferencesWidget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle2, Sliders } from 'lucide-react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useAuth } from '@/contexts/AuthContext';

export const PreferencesSection: React.FC = () => {
  const { user } = useAuth();
  const { preferences } = useUserPreferences(user?.id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main preferences widget taking 2 columns */}
        <div className="lg:col-span-2">
          <AppPreferencesWidget />
        </div>

        {/* Live Preview Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 pt-6 px-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-lg bg-[#EDF8E8] text-[#2C6E20]">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-[#161F18]">
                    Live Display Preview
                  </CardTitle>
                  <CardDescription className="text-[11px] text-[#737E75]">
                    Simulated view based on your current preferences.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-1 space-y-3">
              <div className="p-3 rounded-xl border border-[#E2E6DF] bg-[#FAFBF9] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#737E75]">Applied Theme:</span>
                  <Badge variant="outline" className="capitalize text-emerald-700 bg-emerald-50 border-emerald-200">
                    {preferences?.theme || 'light'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#737E75]">Landing Page:</span>
                  <span className="font-semibold text-[#161F18]">
                    {preferences?.defaultLandingPage || '/dashboard'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#737E75]">Table Rows:</span>
                  <span className="font-semibold text-[#161F18]">
                    {preferences?.itemsPerPage || 10} items
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#737E75]">Show Balance:</span>
                  <span className="font-semibold text-[#161F18]">
                    {preferences?.showAccountBalance ? 'Visible' : 'Hidden (••••••)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#737E75]">Compact Mode:</span>
                  <span className="font-semibold text-[#161F18]">
                    {preferences?.compactMode ? 'Active (Dense)' : 'Normal (Comfortable)'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50/70 p-3 text-[11px] text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Preferences automatically synchronize across all your dashboard views and devices.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
