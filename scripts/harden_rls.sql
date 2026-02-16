-- =====================================================
-- RLS HARDENING SCRIPT
-- Run this in Supabase SQL Editor BEFORE going to production
-- =====================================================

-- 1. Ensure RLS is enabled on ALL tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_site_web ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 2. Force RLS for table owners (prevents bypassing via service role in app code)
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.interventions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_lines FORCE ROW LEVEL SECURITY;
ALTER TABLE public.leads_site_web FORCE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements FORCE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.team_availability FORCE ROW LEVEL SECURITY;
ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log FORCE ROW LEVEL SECURITY;

-- 3. Drop any legacy permissive policies that may exist from development
DROP POLICY IF EXISTS "Public Access" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.products;
DROP POLICY IF EXISTS "Enable update for all users" ON public.products;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.products;

-- Repeat for other sensitive tables
DROP POLICY IF EXISTS "Public Access" ON public.clients;
DROP POLICY IF EXISTS "Public Access" ON public.interventions;
DROP POLICY IF EXISTS "Public Access" ON public.invoices;
DROP POLICY IF EXISTS "Public Access" ON public.users;

-- 4. Verify: List all policies (run manually to check)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
