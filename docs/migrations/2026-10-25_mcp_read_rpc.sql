-- Migration: Secure RPC functions for Model Context Protocol (MCP) data access
-- Date: 2026-10-25
-- Description: Provides SECURITY DEFINER functions to allow verified MCP clients (authenticated via user API keys)
--              to safely read fund sources, categories, and transactions respecting user isolation.

-- 1. Helper function to verify authentication context (JWT or API key hash)
CREATE OR REPLACE FUNCTION public.mcp_verify_auth(p_user_id UUID, p_key_hash TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_verified_user_id UUID;
BEGIN
    -- Check 1: User authenticated via standard Supabase JWT session
    IF auth.uid() IS NOT NULL THEN
        IF auth.uid() != p_user_id THEN
            RAISE EXCEPTION 'Unauthorized: User ID mismatch';
        END IF;
        RETURN auth.uid();
    -- Check 2: Authenticated via personal API Key hash
    ELSIF p_key_hash IS NOT NULL THEN
        SELECT user_id INTO v_verified_user_id
        FROM public.user_api_keys
        WHERE key_hash = p_key_hash AND is_active = true
        LIMIT 1;

        IF v_verified_user_id IS NULL OR v_verified_user_id != p_user_id THEN
            RAISE EXCEPTION 'Unauthorized: Invalid or inactive API key';
        END IF;

        UPDATE public.user_api_keys
        SET last_used_at = now()
        WHERE key_hash = p_key_hash;

        RETURN v_verified_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Missing authentication context';
    END IF;
END;
$$;

-- 2. List fund sources for verified user
CREATE OR REPLACE FUNCTION public.mcp_list_fund_sources(
    p_user_id UUID,
    p_key_hash TEXT DEFAULT NULL
)
RETURNS SETOF public.fund_sources
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_uid UUID;
BEGIN
    v_uid := public.mcp_verify_auth(p_user_id, p_key_hash);
    RETURN QUERY
    SELECT * FROM public.fund_sources
    WHERE user_id = v_uid
    ORDER BY created_at ASC;
END;
$$;

-- 3. Get single fund source for verified user
CREATE OR REPLACE FUNCTION public.mcp_get_fund_source(
    p_id UUID,
    p_user_id UUID,
    p_key_hash TEXT DEFAULT NULL
)
RETURNS SETOF public.fund_sources
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_uid UUID;
BEGIN
    v_uid := public.mcp_verify_auth(p_user_id, p_key_hash);
    RETURN QUERY
    SELECT * FROM public.fund_sources
    WHERE id = p_id AND user_id = v_uid
    LIMIT 1;
END;
$$;

-- 4. List categories for verified user
CREATE OR REPLACE FUNCTION public.mcp_list_categories(
    p_user_id UUID,
    p_key_hash TEXT DEFAULT NULL,
    p_type TEXT DEFAULT NULL
)
RETURNS SETOF public.categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_uid UUID;
BEGIN
    v_uid := public.mcp_verify_auth(p_user_id, p_key_hash);
    RETURN QUERY
    SELECT * FROM public.categories
    WHERE user_id = v_uid
      AND (p_type IS NULL OR type = p_type)
    ORDER BY name ASC;
END;
$$;

-- 5. List transactions with filters for verified user
CREATE OR REPLACE FUNCTION public.mcp_list_transactions(
    p_user_id UUID,
    p_key_hash TEXT DEFAULT NULL,
    p_type TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 50
)
RETURNS SETOF public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_uid UUID;
BEGIN
    v_uid := public.mcp_verify_auth(p_user_id, p_key_hash);
    RETURN QUERY
    SELECT * FROM public.transactions
    WHERE user_id = v_uid
      AND (p_type IS NULL OR type = p_type)
      AND (p_start_date IS NULL OR transaction_date >= p_start_date)
      AND (p_end_date IS NULL OR transaction_date <= p_end_date)
      AND (p_category_id IS NULL OR category_id = p_category_id)
    ORDER BY transaction_date DESC
    LIMIT LEAST(GREATEST(p_limit, 1), 100);
END;
$$;

-- 6. Get single transaction for verified user
CREATE OR REPLACE FUNCTION public.mcp_get_transaction(
    p_id UUID,
    p_user_id UUID,
    p_key_hash TEXT DEFAULT NULL
)
RETURNS SETOF public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_uid UUID;
BEGIN
    v_uid := public.mcp_verify_auth(p_user_id, p_key_hash);
    RETURN QUERY
    SELECT * FROM public.transactions
    WHERE id = p_id AND user_id = v_uid
    LIMIT 1;
END;
$$;
