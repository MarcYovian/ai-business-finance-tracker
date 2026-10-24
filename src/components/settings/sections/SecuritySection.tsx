import React, { useState } from 'react';
import { AccountSecurityWidget } from '../widgets/AccountSecurityWidget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, KeyRound, Smartphone, Laptop } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordDialog } from '../dialogs/ChangePasswordDialog';

export const SecuritySection: React.FC = () => {
  const { user } = useAuth();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Account Security Action Card */}
        <AccountSecurityWidget />

        {/* Security Overview & Session Status Card */}
        <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden h-full flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 pt-6 px-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-lg bg-[#EDF8E8] text-[#2C6E20]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-[#161F18]">
                    Account Protection
                  </CardTitle>
                  <CardDescription className="text-xs text-[#737E75]">
                    Current security posture and active authentication status.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-1 space-y-3.5">
              <div className="p-3.5 rounded-xl border border-[#E2E6DF] bg-[#FAFBF9] space-y-1">
                <div className="text-xs font-semibold text-[#161F18] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-[#2C6E20]" /> Active Session
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Now
                  </span>
                </div>
                <p className="text-[11px] text-[#737E75]">
                  Signed in as <span className="font-semibold text-[#161F18]">{user?.email}</span> via Supabase GoTrue Auth.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E2E6DF] bg-[#FAFBF9] space-y-1">
                <div className="text-xs font-semibold text-[#161F18] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-[#4B5563]" /> Multi-Factor Auth (MFA)
                  </span>
                  <span className="text-[10px] text-[#737E75] bg-[#F5F6F3] px-2 py-0.5 rounded-full border border-[#E2E6DF]">
                    Ready to Connect
                  </span>
                </div>
                <p className="text-[11px] text-[#737E75]">
                  Supports TOTP authentication apps such as Google Authenticator, 1Password, or Authy.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setIsPasswordDialogOpen(true)}
                  className="w-full bg-[#529E42] hover:bg-[#438235] text-white rounded-xl text-xs py-2 h-9"
                >
                  <KeyRound className="h-3.5 w-3.5 mr-2" /> Change Account Password
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
    </div>
  );
};
