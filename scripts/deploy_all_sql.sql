-- =====================================================
-- AutoReparis OS — SCRIPT SQL COMPLET DE PRODUCTION
-- Copier-coller ce fichier dans le SQL Editor de Supabase
-- URL : https://supabase.com/dashboard/project/wjvqdvjtzwmusabbinnl/sql/new
--
-- Ce script fait TOUT en une seule execution :
--   1. Fonctions helper RBAC
--   2. Suppression des anciennes policies
--   3. Deploiement des policies RLS granulaires
--   4. FORCE RLS sur toutes les tables
--   5. Fonctions RPC (dashboard, interventions, performance)
--   6. Fonctions publiques securisees (suivi vehicule)
--   7. Fonction de suppression de compte (Apple)
-- =====================================================

BEGIN;

-- =====================================================
-- PARTIE 1 : FONCTIONS HELPER RBAC
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_write_access()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'frontdesk', 'mecanicien')
    AND actif = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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
-- PARTIE 2 : ACTIVER RLS SUR TOUTES LES TABLES
-- =====================================================

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

-- FORCE RLS (empeche le service role de bypasser)
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

-- =====================================================
-- PARTIE 3 : SUPPRIMER TOUTES LES ANCIENNES POLICIES
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
-- PARTIE 4 : POLICIES RLS GRANULAIRES
-- =====================================================

-- USERS
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (public.is_admin() OR id = auth.uid());
CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (public.is_admin());

-- CLIENTS
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT WITH CHECK (public.has_write_access());
CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE USING (public.has_write_access());
CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE USING (public.is_admin());

-- VEHICLES
CREATE POLICY "vehicles_select" ON public.vehicles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vehicles_insert" ON public.vehicles
  FOR INSERT WITH CHECK (public.has_write_access());
CREATE POLICY "vehicles_update" ON public.vehicles
  FOR UPDATE USING (public.has_write_access());
CREATE POLICY "vehicles_delete" ON public.vehicles
  FOR DELETE USING (public.is_admin());

-- PRODUCTS
CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (public.has_write_access());
CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (public.has_write_access());
CREATE POLICY "products_delete" ON public.products
  FOR DELETE USING (public.is_admin());

-- INTERVENTIONS
CREATE POLICY "interventions_select" ON public.interventions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "interventions_insert" ON public.interventions
  FOR INSERT WITH CHECK (public.has_write_access());
CREATE POLICY "interventions_update" ON public.interventions
  FOR UPDATE USING (public.has_write_access());
CREATE POLICY "interventions_delete" ON public.interventions
  FOR DELETE USING (public.is_admin());

-- INTERVENTION_LINES
CREATE POLICY "intervention_lines_select" ON public.intervention_lines
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "intervention_lines_insert" ON public.intervention_lines
  FOR INSERT WITH CHECK (public.has_write_access());
CREATE POLICY "intervention_lines_update" ON public.intervention_lines
  FOR UPDATE USING (public.has_write_access());
CREATE POLICY "intervention_lines_delete" ON public.intervention_lines
  FOR DELETE USING (public.has_write_access());

-- LEADS
CREATE POLICY "leads_select" ON public.leads_site_web
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "leads_insert" ON public.leads_site_web
  FOR INSERT WITH CHECK (public.has_write_access());
CREATE POLICY "leads_update" ON public.leads_site_web
  FOR UPDATE USING (public.has_write_access());
CREATE POLICY "leads_delete" ON public.leads_site_web
  FOR DELETE USING (public.is_admin());

-- STOCK_MOVEMENTS
CREATE POLICY "stock_movements_select" ON public.stock_movements
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "stock_movements_insert" ON public.stock_movements
  FOR INSERT WITH CHECK (public.has_write_access());

-- VEHICLE_PHOTOS
CREATE POLICY "vehicle_photos_select" ON public.vehicle_photos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vehicle_photos_insert" ON public.vehicle_photos
  FOR INSERT WITH CHECK (public.has_write_access());
CREATE POLICY "vehicle_photos_delete" ON public.vehicle_photos
  FOR DELETE USING (public.has_write_access());

-- TEAM_AVAILABILITY
CREATE POLICY "team_availability_select" ON public.team_availability
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "team_availability_insert" ON public.team_availability
  FOR INSERT WITH CHECK (public.has_write_access());
CREATE POLICY "team_availability_update" ON public.team_availability
  FOR UPDATE USING (public.has_write_access());

-- INVOICES
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "invoices_insert" ON public.invoices
  FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'frontdesk'));
CREATE POLICY "invoices_update" ON public.invoices
  FOR UPDATE USING (public.get_user_role() IN ('admin', 'frontdesk'));

-- ACTIVITY_LOG
CREATE POLICY "activity_log_select" ON public.activity_log
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "activity_log_insert" ON public.activity_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- PARTIE 5 : FONCTIONS RPC (DASHBOARD, INTERVENTIONS)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_full_intervention(
  p_client_nom text,
  p_client_prenom text DEFAULT '',
  p_client_telephone text DEFAULT '',
  p_client_email text DEFAULT '',
  p_vehicle_marque text DEFAULT '',
  p_vehicle_modele text DEFAULT '',
  p_vehicle_immatriculation text DEFAULT '',
  p_vehicle_kilometrage integer DEFAULT NULL,
  p_type_intervention text DEFAULT 'General',
  p_date_heure_debut_prevue timestamptz DEFAULT NULL,
  p_commentaire text DEFAULT '',
  p_total_vente numeric DEFAULT 0
)
RETURNS uuid AS $$
DECLARE
  v_client_id uuid;
  v_vehicle_id uuid;
  v_intervention_id uuid;
BEGIN
  INSERT INTO public.clients (nom, prenom, telephone, email)
  VALUES (p_client_nom, p_client_prenom, p_client_telephone, p_client_email)
  RETURNING id INTO v_client_id;

  INSERT INTO public.vehicles (client_id, marque, modele, immatriculation, kilometrage)
  VALUES (v_client_id, p_vehicle_marque, p_vehicle_modele, p_vehicle_immatriculation, p_vehicle_kilometrage)
  RETURNING id INTO v_vehicle_id;

  INSERT INTO public.interventions (
    client_id, vehicle_id, type_intervention,
    date_heure_debut_prevue, commentaire, total_vente, statut
  )
  VALUES (
    v_client_id, v_vehicle_id, p_type_intervention,
    p_date_heure_debut_prevue, p_commentaire, p_total_vente, 'planifiee'
  )
  RETURNING id INTO v_intervention_id;

  RETURN v_intervention_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.recalculate_intervention_totals(p_intervention_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.interventions
  SET
    total_achat = COALESCE((
      SELECT SUM(quantite * prix_achat_unitaire)
      FROM public.intervention_lines WHERE intervention_id = p_intervention_id
    ), 0),
    total_vente = COALESCE((
      SELECT SUM(quantite * prix_vente_unitaire)
      FROM public.intervention_lines WHERE intervention_id = p_intervention_id
    ), 0),
    marge_totale = COALESCE((
      SELECT SUM(quantite * (prix_vente_unitaire - prix_achat_unitaire))
      FROM public.intervention_lines WHERE intervention_id = p_intervention_id
    ), 0)
  WHERE id = p_intervention_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json AS $$
DECLARE
  v_interventions_count integer;
  v_stock_low_count integer;
  v_leads_count integer;
  v_weekly_revenue numeric;
BEGIN
  SELECT COUNT(*) INTO v_interventions_count
  FROM public.interventions WHERE statut NOT IN ('terminee', 'facturee', 'annulee');

  SELECT COUNT(*) INTO v_stock_low_count
  FROM public.products WHERE stock_actuel < stock_min;

  SELECT COUNT(*) INTO v_leads_count
  FROM public.leads_site_web WHERE statut = 'nouveau';

  SELECT COALESCE(SUM(total_vente), 0) INTO v_weekly_revenue
  FROM public.interventions
  WHERE statut IN ('terminee', 'facturee') AND created_at >= NOW() - INTERVAL '7 days';

  RETURN json_build_object(
    'interventions_count', v_interventions_count,
    'stock_low_count', v_stock_low_count,
    'leads_count', v_leads_count,
    'weekly_revenue', v_weekly_revenue
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_performance_stats(p_days integer DEFAULT 30)
RETURNS json AS $$
DECLARE
  v_revenue numeric;
  v_count integer;
  v_avg numeric;
BEGIN
  SELECT
    COALESCE(SUM(total_vente), 0), COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_vente), 0) / COUNT(*) ELSE 0 END
  INTO v_revenue, v_count, v_avg
  FROM public.interventions
  WHERE statut IN ('terminee', 'facturee')
  AND created_at >= NOW() - (p_days || ' days')::interval;

  RETURN json_build_object(
    'revenue', v_revenue, 'count', v_count, 'average_basket', ROUND(v_avg, 2)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PARTIE 6 : FONCTIONS PUBLIQUES SECURISEES (SUIVI VEHICULE)
-- =====================================================

CREATE OR REPLACE FUNCTION normalize_plate(plate TEXT)
RETURNS TEXT AS $$
  SELECT upper(regexp_replace(plate, '[\s-]', '', 'g'));
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION public.get_vehicle_status_public(plate_text TEXT)
RETURNS UUID AS $$
DECLARE
  clean_plate TEXT;
  target_vehicle_id UUID;
  intervention_id UUID;
BEGIN
  clean_plate := normalize_plate(plate_text);

  SELECT id INTO target_vehicle_id
  FROM public.vehicles
  WHERE normalize_plate(immatriculation) = clean_plate
  LIMIT 1;

  IF target_vehicle_id IS NULL THEN RETURN NULL; END IF;

  SELECT id INTO intervention_id
  FROM public.interventions
  WHERE vehicle_id = target_vehicle_id
  ORDER BY created_at DESC LIMIT 1;

  RETURN intervention_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_intervention_details_public(intervention_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', i.id,
    'statut', i.statut,
    'date_debut', i.date_heure_debut_prevue,
    'date_fin', i.date_heure_fin_prevue,
    'vehicle', (SELECT json_build_object(
      'marque', v.marque, 'modele', v.modele, 'immatriculation', v.immatriculation
    ) FROM public.vehicles v WHERE v.id = i.vehicle_id),
    'lines', (
      SELECT json_agg(json_build_object(
        'description', l.description, 'quantite', l.quantite,
        'prix_vente', l.total_vente_ligne, 'type', l.type_ligne
      ))
      FROM public.intervention_lines l WHERE l.intervention_id = i.id
    ),
    'photos', (
      SELECT json_agg(json_build_object(
        'url_image', p.url_image, 'type', p.type, 'created_at', p.created_at
      ))
      FROM public.vehicle_photos p WHERE p.intervention_id = i.id
    )
  ) INTO result
  FROM public.interventions i WHERE i.id = intervention_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 7 : SUPPRESSION DE COMPTE (REQUIS PAR APPLE)
-- =====================================================

DROP FUNCTION IF EXISTS public.delete_own_account();

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void AS $$
BEGIN
  DELETE FROM public.users WHERE id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

COMMIT;

-- =====================================================
-- VERIFICATION (executer separement pour verifier)
-- =====================================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
