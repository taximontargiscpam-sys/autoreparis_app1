-- =====================================================
-- DELETE USER ACCOUNT (Apple App Store Requirement)
-- Run this in Supabase SQL Editor
-- =====================================================
-- This function allows a user to fully delete their own account
-- including the auth.users record (required by Apple since June 2023)

-- Revoke default PUBLIC access first
DROP FUNCTION IF EXISTS public.delete_own_account();

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void AS $$
BEGIN
  -- Delete from app's users table first (if exists)
  DELETE FROM public.users WHERE id = auth.uid();

  -- Delete the auth user (this is the critical part Apple requires)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- Revoke default PUBLIC execute permission, then grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
