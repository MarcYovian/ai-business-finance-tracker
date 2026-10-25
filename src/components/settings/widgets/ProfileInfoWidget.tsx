import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Calendar as CalendarIcon, Check, Loader2 } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';

export const ProfileInfoWidget: React.FC = () => {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating, uploadAvatar, isUploadingAvatar } =
    useUserProfile(user?.id);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+62');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || (user?.email ? user.email.split('@')[0] : ''));
      if (profile.phoneNumber) {
        if (profile.phoneNumber.startsWith('+62')) {
          setCountryCode('+62');
          setPhoneNumber(profile.phoneNumber.replace('+62', '').trim());
        } else {
          setPhoneNumber(profile.phoneNumber);
        }
      }
      if (profile.dateOfBirth) {
        try {
          setDateOfBirth(parseISO(profile.dateOfBirth));
        } catch {
          // ignore parsing error
        }
      }
    }
  }, [profile, user]);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await uploadAvatar(file);
        toast({
          title: 'Avatar updated',
          description: 'Your profile photo has been updated successfully.',
        });
      } catch (err: any) {
        toast({
          title: 'Avatar upload failed',
          description: err.message || 'Could not upload avatar image.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fullPhone = phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : null;
      const formattedDob = dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null;

      await updateProfile({
        displayName: displayName.trim(),
        phoneNumber: fullPhone,
        dateOfBirth: formattedDob,
      });

      toast({
        title: 'Profile updated',
        description: 'Your personal information details have been saved.',
      });
    } catch (err: any) {
      toast({
        title: 'Error saving profile',
        description: err.message || 'Could not save profile details.',
        variant: 'destructive',
      });
    }
  };

  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden">
      <form onSubmit={handleSaveChanges}>
        <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6">
          <div>
            <CardTitle className="text-lg font-bold text-[#161F18]">
              Profile Information
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-[#737E75]">
              Update your personal information and profile details.
            </CardDescription>
          </div>
          <Button
            type="submit"
            disabled={isUpdating || isLoading}
            className="bg-[#487336] hover:bg-[#3d632e] text-white font-medium rounded-xl px-4 py-2 text-sm shadow-sm transition-all"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-2">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar with Camera Button */}
            <div className="relative shrink-0 mx-auto md:mx-0">
              <Avatar className="h-24 w-24 rounded-full border-2 border-white shadow-md bg-[#EDF8E8]">
                <AvatarImage
                  src={profile?.avatarUrl || undefined}
                  alt={displayName || 'User'}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg font-bold text-[#2C6E20]">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileSelect}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-[#E2E6DF] shadow-md flex items-center justify-center text-[#4B5563] hover:text-[#161F18] hover:bg-[#F9FAF8] transition-all"
                title="Change photo"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#487336]" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-fullname" className="text-xs font-semibold text-[#161F18]">
                  Full name
                </Label>
                <Input
                  id="profile-fullname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="rounded-xl border-[#E2E6DF] text-sm bg-white"
                  required
                />
              </div>

              {/* Email Address (Read-only or from Auth) */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-email" className="text-xs font-semibold text-[#161F18]">
                  Email address
                </Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="rounded-xl border-[#E2E6DF] bg-[#F5F6F3] text-sm text-[#737E75] cursor-not-allowed"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone" className="text-xs font-semibold text-[#161F18]">
                  Phone number <span className="font-normal text-[#9AA59C]">(optional)</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-2 border border-[#E2E6DF] rounded-xl bg-white text-xs font-medium text-[#161F18] shrink-0">
                    <span className="text-base leading-none">🇮🇩</span>
                    <span>{countryCode}</span>
                  </div>
                  <Input
                    id="profile-phone"
                    type="tel"
                    placeholder="812 3456 7890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="rounded-xl border-[#E2E6DF] text-sm flex-1 bg-white"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-dob" className="text-xs font-semibold text-[#161F18]">
                  Date of birth <span className="font-normal text-[#9AA59C]">(optional)</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      id="profile-dob"
                      className="w-full flex items-center justify-between px-3 py-2 border border-[#E2E6DF] rounded-xl bg-white text-sm text-left hover:bg-[#F9FAF8] transition-colors"
                    >
                      <span className={dateOfBirth ? 'text-[#161F18]' : 'text-[#9AA59C]'}>
                        {dateOfBirth ? format(dateOfBirth, 'dd MMM yyyy') : 'Select birth date'}
                      </span>
                      <CalendarIcon className="h-4 w-4 text-[#737E75]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateOfBirth}
                      onSelect={setDateOfBirth}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1940}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};
