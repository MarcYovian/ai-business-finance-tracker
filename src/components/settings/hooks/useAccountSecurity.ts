import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export const useAccountSecurity = () => {
  const [mfaStatus, setMfaStatus] = useState<'not_enabled' | 'enabled'>('not_enabled');

  const sessionQuery = useQuery({
    queryKey: ['account_session_info'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Error changing password:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Password updated',
        description: 'Your account password has been successfully changed.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Error updating password',
        description: err.message || 'Could not update password.',
        variant: 'destructive',
      });
    },
  });

  return {
    session: sessionQuery.data,
    isLoadingSession: sessionQuery.isLoading,
    mfaStatus,
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
  };
};
