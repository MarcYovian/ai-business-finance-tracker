import React from 'react';
import { CurrencyRegionWidget } from '../widgets/CurrencyRegionWidget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Globe, Calendar, DollarSign } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export const CurrencyRegionSection: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.id);

  const now = new Date();
  const currencySymbol = profile?.defaultCurrency === 'USD' ? '$' : profile?.defaultCurrency === 'EUR' ? '€' : 'Rp';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <CurrencyRegionWidget />
        </div>

        {/* Format Preview Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 pt-6 px-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-lg bg-[#EDF8E8] text-[#2C6E20]">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-[#161F18]">
                    Regional Formatting
                  </CardTitle>
                  <CardDescription className="text-[11px] text-[#737E75]">
                    Example of currency and date representations.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-1 space-y-3">
              <div className="p-3 rounded-xl border border-[#E2E6DF] bg-[#FAFBF9] space-y-2.5">
                <div>
                  <span className="text-[11px] text-[#737E75] block">Currency Output:</span>
                  <span className="text-sm font-bold text-[#2C6E20]">
                    {currencySymbol} 1.250.000,00
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#737E75] block">Date Output:</span>
                  <span className="text-sm font-semibold text-[#161F18]">
                    {format(now, 'dd MMM yyyy')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#737E75] block">Timezone Offset:</span>
                  <span className="text-xs font-mono text-[#161F18]">
                    {profile?.timeZone || 'Asia/Jakarta'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
