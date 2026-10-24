-- Migration: Settings, Preferences, Profile Extensions, and Avatars Bucket
-- Date: 2026-10-24
-- Description: Adds user preferences table, profile extensions, avatar storage bucket, and reset data RPC.

-- 1. Extend user_profiles with new fields
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD MMM YYYY',
  ADD COLUMN IF NOT EXISTS time_zone TEXT DEFAULT 'Asia/Jakarta',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- 2. Ensure RLS policies on user_profiles use user_id = auth.uid()
CREATE POLICY "user_profiles_select_by_user_id" 
ON public.user_profiles FOR SELECT 
TO public 
USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_by_user_id" 
ON public.user_profiles FOR INSERT 
TO public 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_by_user_id" 
ON public.user_profiles FOR UPDATE 
TO public 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 3. Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    default_landing_page TEXT NOT NULL DEFAULT '/dashboard',
    items_per_page INTEGER NOT NULL DEFAULT 10 CHECK (items_per_page IN (10, 25, 50, 100)),
    show_account_balance BOOLEAN NOT NULL DEFAULT true,
    show_category_icons BOOLEAN NOT NULL DEFAULT true,
    compact_mode BOOLEAN NOT NULL DEFAULT false,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    budget_alerts BOOLEAN NOT NULL DEFAULT true,
    recurring_reminders BOOLEAN NOT NULL DEFAULT true,
    low_balance_alerts BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_select_policy" 
ON public.user_preferences FOR SELECT 
TO public 
USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert_policy" 
ON public.user_preferences FOR INSERT 
TO public 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_policy" 
ON public.user_preferences FOR UPDATE 
TO public 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. Update handle_new_user trigger function to auto-create user_preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- 5. Backfill existing users into user_preferences
INSERT INTO public.user_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 6. Set up storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "avatar_public_read_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatar_user_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatar_user_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "avatar_user_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- 7. RPC Function for Reset App Data (Multi-tenant secure)
CREATE OR REPLACE FUNCTION public.reset_user_financial_data(
  p_user_id UUID,
  p_reset_transactions BOOLEAN DEFAULT true,
  p_reset_budgets BOOLEAN DEFAULT true,
  p_reset_goals BOOLEAN DEFAULT false,
  p_reset_accounts_balance BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_transactions INT := 0;
  v_deleted_budgets INT := 0;
  v_deleted_goals INT := 0;
BEGIN
  -- Strict multi-tenant security verification
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Anda hanya dapat mereset data milik Anda sendiri.';
  END IF;

  -- 1. Reset transactions if requested
  IF p_reset_transactions THEN
    WITH deleted AS (
      DELETE FROM public.transactions
      WHERE user_id = p_user_id
      RETURNING id
    )
    SELECT count(*) INTO v_deleted_transactions FROM deleted;
  END IF;

  -- 2. Reset budgets if requested
  IF p_reset_budgets THEN
    WITH deleted AS (
      DELETE FROM public.budgets
      WHERE user_id = p_user_id
      RETURNING id
    )
    SELECT count(*) INTO v_deleted_budgets FROM deleted;
  END IF;

  -- 3. Reset financial goals if requested
  IF p_reset_goals THEN
    WITH deleted AS (
      DELETE FROM public.financial_goals
      WHERE user_id = p_user_id
      RETURNING id
    )
    SELECT count(*) INTO v_deleted_goals FROM deleted;
  END IF;

  -- 4. Reset fund source balances to 0 if requested
  IF p_reset_accounts_balance THEN
    UPDATE public.fund_sources
    SET balance = 0, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_transactions', v_deleted_transactions,
    'deleted_budgets', v_deleted_budgets,
    'deleted_goals', v_deleted_goals
  );
END;
$$;
