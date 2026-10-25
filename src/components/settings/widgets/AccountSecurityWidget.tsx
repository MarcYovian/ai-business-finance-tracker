import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KeyRound, Shield, Laptop, ChevronRight } from 'lucide-react';
import { ChangePasswordDialog } from '../dialogs/ChangePasswordDialog';
import { toast } from '@/hooks/use-toast';

export const AccountSecurityWidget: React.FC = () => {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const handleMfaClick = () => {
    toast({
      title: 'Two-Factor Authentication',
      description: 'MFA setup is ready to connect via your Authenticator app (TOTP).',
    });
  };

  const handleSessionsClick = () => {
    toast({
      title: 'Active Sessions',
      description: 'Current session active on Linux Chrome. No suspicious logins detected.',
    });
  };

  return (
    <>
      <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden h-full flex flex-col justify-between">
        <div>
          <CardHeader className="pb-3 pt-6 px-6">
            <CardTitle className="text-base sm:text-lg font-bold text-[#161F18]">
              Account Security
            </CardTitle>
            <CardDescription className="text-xs text-[#737E75]">
              Keep your account secure.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-1 space-y-2.5">
            {/* Change Password Item */}
            <button
              type="button"
              onClick={() => setIsPasswordDialogOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E2E6DF] hover:border-[#529E42] hover:bg-[#F9FAF8] transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F5F6F3] text-[#4B5563] flex items-center justify-center shrink-0 group-hover:text-[#2C6E20] group-hover:bg-[#EDF8E8] transition-all">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#161F18] group-hover:text-[#2C6E20] transition-colors">
                    Change Password
                  </div>
                  <div className="text-[11px] text-[#737E75]">
                    Update your password regularly.
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#9AA59C] group-hover:text-[#2C6E20] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Two-Factor Authentication Item */}
            <button
              type="button"
              onClick={handleMfaClick}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E2E6DF] hover:border-[#529E42] hover:bg-[#F9FAF8] transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F5F6F3] text-[#4B5563] flex items-center justify-center shrink-0 group-hover:text-[#2C6E20] group-hover:bg-[#EDF8E8] transition-all">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#161F18] group-hover:text-[#2C6E20] transition-colors">
                    Two-Factor Authentication
                  </div>
                  <div className="text-[11px] text-[#737E75]">
                    Add an extra layer of security.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-[#F5F6F3] text-[#737E75] border-[#E2E6DF] font-normal px-2 py-0.5">
                  Not enabled
                </Badge>
                <ChevronRight className="h-4 w-4 text-[#9AA59C] group-hover:text-[#2C6E20] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </button>

            {/* Active Sessions Item */}
            <button
              type="button"
              onClick={handleSessionsClick}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E2E6DF] hover:border-[#529E42] hover:bg-[#F9FAF8] transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F5F6F3] text-[#4B5563] flex items-center justify-center shrink-0 group-hover:text-[#2C6E20] group-hover:bg-[#EDF8E8] transition-all">
                  <Laptop className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#161F18] group-hover:text-[#2C6E20] transition-colors">
                    Active Sessions
                  </div>
                  <div className="text-[11px] text-[#737E75]">
                    Manage your active login sessions.
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#9AA59C] group-hover:text-[#2C6E20] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </CardContent>
        </div>
      </Card>

      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
    </>
  );
};
