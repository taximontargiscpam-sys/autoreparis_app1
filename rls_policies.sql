-- =====================================================
-- PROPER RLS POLICIES WITH RBAC
-- Run this AFTER schema.sql in your Supabase SQL Editor
-- =====================================================

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user has write access
CREATE OR REPLACE FUNCTION public.has_write_access()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'frontdesk', 'mecanicien')
    AND actif = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
    AND actif = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- DROP old permissive policies
-- =====================================================
DO $$
DECLARE
  tbl TEXT;
  pol RECORD;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','clients','vehicles','products','interventions',
    'intervention_lines','leads_site_web','stock_movements',
    'vehicle_photos','team_availability','invoices','activity_log'
  ])
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END;
$$;

-- =====================================================
-- USERS table: admins manage, users read
-- =====================================================
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (
    public.is_admin() OR id = auth.uid()
  );

CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (public.is_admin());

-- =====================================================
-- CLIENTS: all authenticated read, write roles can modify
-- =====================================================
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT WITH CHECK (public.has_write_access());

CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE USING (public.has_write_access());

CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE USING (public.is_admin());

-- =====================================================
-- VEHICLES: same as clients
-- =====================================================
CREATE POLICY "vehicles_select" ON public.vehicles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "vehicles_insert" ON public.vehicles
  FOR INSERT WITH CHECK (public.has_write_access());

CREATE POLICY "vehicles_update" ON public.vehicles
  FOR UPDATE USING (public.has_write_access());

CREATE POLICY "vehicles_delete" ON public.vehicles
  FOR DELETE USING (public.is_admin());

-- =====================================================
-- PRODUCTS: authenticated read, write roles modify, admin delete
-- =====================================================
CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (public.has_write_access());

CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (public.has_write_access());

CREATE POLICY "products_delete" ON public.products
  FOR DELETE USING (public.is_admin());

-- SECURITY FIX: Explicitly drop any legacy 'Public Access' policy on products
-- that may have been created during development. This ensures only authenticated
-- users with proper roles can access product data.
DROP POLICY IF EXISTS "Public Access" ON public.products;

-- =====================================================
-- INTERVENTIONS: all read, write roles modify, admin delete
-- =====================================================
CREATE POLICY "interventions_select" ON public.interventions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "interventions_insert" ON public.interventions
  FOR INSERT WITH CHECK (public.has_write_access());

CREATE POLICY "interventions_update" ON public.interventions
  FOR UPDATE USING (public.has_write_access());

CREATE POLICY "interventions_delete" ON public.interventions
  FOR DELETE USING (public.is_admin());

-- =====================================================
-- INTERVENTION_LINES: all read, write roles modify
-- =====================================================
CREATE POLICY "intervention_lines_select" ON public.intervention_lines
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "intervention_lines_insert" ON public.intervention_lines
  FOR INSERT WITH CHECK (public.has_write_access());

CREATE POLICY "intervention_lines_update" ON public.intervention_lines
  FOR UPDATE USING (public.has_write_access());

CREATE POLICY "intervention_lines_delete" ON public.intervention_lines
  FOR DELETE USING (public.has_write_access());

-- =====================================================
-- LEADS: all read, frontdesk+admin modify
-- =====================================================
CREATE POLICY "leads_select" ON public.leads_site_web
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "leads_insert" ON public.leads_site_web
  FOR INSERT WITH CHECK (public.has_write_access());

CREATE POLICY "leads_update" ON public.leads_site_web
  FOR UPDATE USING (public.has_write_access());

CREATE POLICY "leads_delete" ON public.leads_site_web
  FOR DELETE USING (public.is_admin());

-- =====================================================
-- STOCK_MOVEMENTS: all read, write roles insert
-- =====================================================
CREATE POLICY "stock_movements_select" ON public.stock_movements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "stock_movements_insert" ON public.stock_movements
  FOR INSERT WITH CHECK (public.has_write_access());

-- =====================================================
-- VEHICLE_PHOTOS: all read, write roles modify
-- =====================================================
CREATE POLICY "vehicle_photos_select" ON public.vehicle_photos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "vehicle_photos_insert" ON public.vehicle_photos
  FOR INSERT WITH CHECK (public.has_write_access());

CREATE POLICY "vehicle_photos_delete" ON public.vehicle_photos
  FOR DELETE USING (public.has_write_access());

-- =====================================================
-- TEAM_AVAILABILITY: all read, write roles modify own
-- =====================================================
CREATE POLICY "team_availability_select" ON public.team_availability
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "team_availability_insert" ON public.team_availability
  FOR INSERT WITH CHECK (public.has_write_access());

CREATE POLICY "team_availability_update" ON public.team_availability
  FOR UPDATE USING (public.has_write_access());

-- =====================================================
-- INVOICES: all read, admin + frontdesk modify
-- =====================================================
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "invoices_insert" ON public.invoices
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin', 'frontdesk')
  );

CREATE POLICY "invoices_update" ON public.invoices
  FOR UPDATE USING (
    public.get_user_role() IN ('admin', 'frontdesk')
  );

-- =====================================================
-- ACTIVITY_LOG: all read, system insert
-- =====================================================
CREATE POLICY "activity_log_select" ON public.activity_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "activity_log_insert" ON public.activity_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- PUBLIC ACCESS for vehicle tracking (anon users)
-- =====================================================
-- ❌ REMOVED: Direct table access for anonymous users is insecure.
-- We now use SECURITY DEFINER RPC functions:
-- 1. get_vehicle_status_public(plate)
-- 2. get_intervention_details_public(id)
-- see rpc_secure_functions.sql

