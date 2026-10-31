-- ============================================================================
-- Migration: Consolidate Database Layer, Clean Up Redundant RPCs & Hardening
-- Date: 2026-11-01
-- Author: Principal Database Engineer & DBA
-- ============================================================================

BEGIN;

-- 1. HARDENING: Perbaiki search_path dan privilege pada fungsi verify_api_key
CREATE OR REPLACE FUNCTION public.verify_api_key(p_key_hash TEXT)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_key_id UUID;
BEGIN
    SELECT id, user_id INTO v_key_id, v_user_id
    FROM public.user_api_keys
    WHERE key_hash = p_key_hash AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        UPDATE public.user_api_keys
        SET last_used_at = now()
        WHERE id = v_key_id;
    END IF;

    RETURN v_user_id;
END;
$$;

-- Cabut akses eksekusi publik anonim; batasi hanya untuk authenticated & service_role
REVOKE EXECUTE ON FUNCTION public.verify_api_key(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_api_key(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.verify_api_key(TEXT) TO authenticated, service_role;

-- 2. PENYEMPURNAAN TABEL user_api_keys (Non-destructive ALTER)
ALTER TABLE public.user_api_keys 
  ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT ARRAY['read', 'write'],
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 3. PERBAIKAN INDEKS PERFORMA (Covering Indexes untuk Foreign Keys)
CREATE INDEX IF NOT EXISTS idx_transactions_source_fund_id 
  ON public.transactions (source_fund_id) 
  WHERE source_fund_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_destination_fund_id 
  ON public.transactions (destination_fund_id) 
  WHERE destination_fund_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id 
  ON public.categories (parent_id) 
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_patterns_category_id 
  ON public.recurring_patterns (category_id) 
  WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_patterns_source_fund_id 
  ON public.recurring_patterns (source_fund_id) 
  WHERE source_fund_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_patterns_destination_fund_id 
  ON public.recurring_patterns (destination_fund_id) 
  WHERE destination_fund_id IS NOT NULL;

-- 4. ELIMINASI DUPLIKASI RPC MUTASI NATIVE LAMA (Menjaga 1 Standar SSOT)
DROP FUNCTION IF EXISTS public.create_transaction_with_balance_update(text, bigint, text, uuid, uuid, uuid, timestamp with time zone, text, uuid);
DROP FUNCTION IF EXISTS public.update_transaction_with_balance_adjustment(uuid, bigint, uuid, uuid, timestamp with time zone, text, uuid, text);
DROP FUNCTION IF EXISTS public.delete_transaction_with_balance_adjustment(uuid);

-- 5. ELIMINASI REDUNDANSI: DROP FUNGSI READ RPC mcp_*
DROP FUNCTION IF EXISTS public.mcp_get_fund_source(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.mcp_get_transaction(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.mcp_list_categories(uuid, text, text);
DROP FUNCTION IF EXISTS public.mcp_list_fund_sources(uuid, text);
DROP FUNCTION IF EXISTS public.mcp_list_transactions(uuid, text, text, timestamp with time zone, timestamp with time zone, uuid, integer);
DROP FUNCTION IF EXISTS public.mcp_verify_auth(uuid, text);

COMMIT;
