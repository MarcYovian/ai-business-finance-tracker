import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/finance';
import { UpdateProfilePayload } from '../types';

export const useUserProfile = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user_profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      if (!data) {
        // Auto create default profile if not exists
        const { data: created, error: insertError } = await supabase
          .from('user_profiles')
          .insert([{ user_id: userId }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          return null;
        }

        return {
          id: created.id,
          userId: created.user_id,
          displayName: created.display_name,
          avatarUrl: created.avatar_url,
          defaultCurrency: created.default_currency || 'IDR',
          phoneNumber: created.phone_number || null,
          dateOfBirth: created.date_of_birth || null,
          dateFormat: created.date_format || 'DD MMM YYYY',
          timeZone: created.time_zone || 'Asia/Jakarta',
          language: created.language || 'en',
          createdAt: created.created_at,
          updatedAt: created.updated_at,
        };
      }

      return {
        id: data.id,
        userId: data.user_id,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        defaultCurrency: data.default_currency || 'IDR',
        phoneNumber: data.phone_number || null,
        dateOfBirth: data.date_of_birth || null,
        dateFormat: data.date_format || 'DD MMM YYYY',
        timeZone: data.time_zone || 'Asia/Jakarta',
        language: data.language || 'en',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    enabled: !!userId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      if (!userId) throw new Error('User ID is required');

      const dbPayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.displayName !== undefined) dbPayload.display_name = payload.displayName;
      if (payload.phoneNumber !== undefined) dbPayload.phone_number = payload.phoneNumber;
      if (payload.dateOfBirth !== undefined) dbPayload.date_of_birth = payload.dateOfBirth;
      if (payload.defaultCurrency !== undefined) dbPayload.default_currency = payload.defaultCurrency;
      if (payload.dateFormat !== undefined) dbPayload.date_format = payload.dateFormat;
      if (payload.timeZone !== undefined) dbPayload.time_zone = payload.timeZone;
      if (payload.language !== undefined) dbPayload.language = payload.language;
      if (payload.avatarUrl !== undefined) dbPayload.avatar_url = payload.avatarUrl;

      const { data, error } = await supabase
        .from('user_profiles')
        .update(dbPayload)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profile', userId] });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error('User ID is required');

      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = publicUrlData.publicUrl;

      // Automatically update profile avatar_url
      await updateProfileMutation.mutateAsync({ avatarUrl });

      return avatarUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profile', userId] });
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,
  };
};
