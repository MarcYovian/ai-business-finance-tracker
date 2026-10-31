-- ============================================================================
-- Rollback Plan: Restore mcp_* Read RPC Functions
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.mcp_verify_auth(p_user_id UUID, p_key_hash TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_verified_user_id UUID;
BEGIN
    IF auth.uid() IS NOT NULL THEN
        IF auth.uid() != p_user_id THEN RAISE EXCEPTION 'Unauthorized: User ID mismatch'; END IF;
        RETURN auth.uid();
    ELSIF p_key_hash IS NOT NULL THEN
        SELECT user_id INTO v_verified_user_id FROM public.user_api_keys
        WHERE key_hash = p_key_hash AND is_active = true LIMIT 1;
        IF v_verified_user_id IS NULL OR v_verified_user_id != p_user_id THEN
            RAISE EXCEPTION 'Unauthorized: Invalid or inactive API key';
        END IF;
        UPDATE public.user_api_keys SET last_used_at = now() WHERE key_hash = p_key_hash;
        RETURN v_verified_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Missing authentication context';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mcp_list_fund_sources(p_user_id UUID, p_key_hash TEXT DEFAULT NULL)
RETURNS SETOF public.fund_sources LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_uid UUID;
BEGIN
    v_uid := public.mcp_verify_auth(p_user_id, p_key_hash);
    RETURN QUERY SELECT * FROM public.fund_sources WHERE user_id = v_uid ORDER BY created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.mcp_list_categories(p_user_id UUID, p_key_hash TEXT DEFAULT NULL, p_type TEXT DEFAULT NULL)
RETURNS SETOF public.categories LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_uid UUID;
BEGIN
    v_uid := public.mcp_verify_auth(p_user_id, p_key_hash);
    RETURN QUERY SELECT * FROM public.categories WHERE user_id = v_uid AND (p_type IS NULL OR type = p_type) ORDER BY name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.mcp_list_transactions(p_user_id UUID, p_key_hash TEXT DEFAULT NULL, p_type TEXT DEFAULT NULL, p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL, p_category_id UUID DEFAULT NULL, p_limit INT DEFAULT 50)
RETURNS SETOF public.transactions LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_uid UUID;
BEGIN
    v_uid := public.mcp_verify_auth(p_user_id, p_key_hash);
    RETURN QUERY SELECT * FROM public.transactions WHERE user_id = v_uid AND (p_type IS NULL OR type = p_type) AND (p_start_date IS NULL OR transaction_date >= p_start_date) AND (p_end_date IS NULL OR transaction_date <= p_end_date) AND (p_category_id IS NULL OR category_id = p_category_id) ORDER BY transaction_date DESC LIMIT LEAST(GREATEST(p_limit, 1), 100);
END;
$$;

COMMIT;
