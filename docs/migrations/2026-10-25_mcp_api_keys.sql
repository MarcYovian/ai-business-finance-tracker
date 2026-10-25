-- Migration: User API Keys for MCP & AI Integrations
-- Date: 2026-10-25
-- Description: Creates user_api_keys table and verify_api_key RPC function for authenticating Model Context Protocol (MCP) clients.

-- 1. Create user_api_keys table
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'AI Assistant',
    key_hash TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Index for faster lookup during MCP authentication
CREATE INDEX IF NOT EXISTS idx_user_api_keys_hash ON public.user_api_keys (key_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys (user_id);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Users can only manage their own API keys
CREATE POLICY "user_api_keys_select_policy"
ON public.user_api_keys FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_api_keys_insert_policy"
ON public.user_api_keys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_api_keys_update_policy"
ON public.user_api_keys FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_api_keys_delete_policy"
ON public.user_api_keys FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. RPC Function: verify_api_key
-- SECURITY DEFINER allows this function to look up the key_hash and update last_used_at,
-- returning the associated user_id without exposing full table data to the anon key.
CREATE OR REPLACE FUNCTION public.verify_api_key(p_key_hash TEXT)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_key_id UUID;
BEGIN
    SELECT id, user_id INTO v_key_id, v_user_id
    FROM public.user_api_keys
    WHERE key_hash = p_key_hash AND is_active = true
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        UPDATE public.user_api_keys
        SET last_used_at = now()
        WHERE id = v_key_id;
    END IF;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
