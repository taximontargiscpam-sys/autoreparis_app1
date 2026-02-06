-- =====================================================
-- RPC FUNCTIONS for safe multi-table transactions
-- Run in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. Create intervention with client + vehicle atomically
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
  p_type_intervention text DEFAULT 'Général',
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
  -- 1. Insert client
  INSERT INTO public.clients (nom, prenom, telephone, email)
  VALUES (p_client_nom, p_client_prenom, p_client_telephone, p_client_email)
  RETURNING id INTO v_client_id;

  -- 2. Insert vehicle
  INSERT INTO public.vehicles (client_id, marque, modele, immatriculation, kilometrage)
  VALUES (v_client_id, p_vehicle_marque, p_vehicle_modele, p_vehicle_immatriculation, p_vehicle_kilometrage)
  RETURNING id INTO v_vehicle_id;

  -- 3. Insert intervention
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

-- =====================================================
-- 2. Recalculate intervention totals from lines
-- =====================================================
CREATE OR REPLACE FUNCTION public.recalculate_intervention_totals(p_intervention_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.interventions
  SET
    total_achat = COALESCE((
      SELECT SUM(quantite * prix_achat_unitaire)
      FROM public.intervention_lines
      WHERE intervention_id = p_intervention_id
    ), 0),
    total_vente = COALESCE((
      SELECT SUM(quantite * prix_vente_unitaire)
      FROM public.intervention_lines
      WHERE intervention_id = p_intervention_id
    ), 0),
    marge_totale = COALESCE((
      SELECT SUM(quantite * (prix_vente_unitaire - prix_achat_unitaire))
      FROM public.intervention_lines
      WHERE intervention_id = p_intervention_id
    ), 0)
  WHERE id = p_intervention_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. Dashboard stats in one query (server-side)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json AS $$
DECLARE
  v_interventions_count integer;
  v_stock_low_count integer;
  v_leads_count integer;
  v_weekly_revenue numeric;
BEGIN
  SELECT COUNT(*) INTO v_interventions_count
  FROM public.interventions
  WHERE statut NOT IN ('terminee', 'facturee', 'annulee');

  SELECT COUNT(*) INTO v_stock_low_count
  FROM public.products
  WHERE stock_actuel < stock_min;

  SELECT COUNT(*) INTO v_leads_count
  FROM public.leads_site_web
  WHERE statut = 'nouveau';

  SELECT COALESCE(SUM(total_vente), 0) INTO v_weekly_revenue
  FROM public.interventions
  WHERE statut IN ('terminee', 'facturee')
  AND created_at >= NOW() - INTERVAL '7 days';

  RETURN json_build_object(
    'interventions_count', v_interventions_count,
    'stock_low_count', v_stock_low_count,
    'leads_count', v_leads_count,
    'weekly_revenue', v_weekly_revenue
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 4. Monthly performance stats
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_performance_stats(p_days integer DEFAULT 30)
RETURNS json AS $$
DECLARE
  v_revenue numeric;
  v_count integer;
  v_avg numeric;
BEGIN
  SELECT
    COALESCE(SUM(total_vente), 0),
    COUNT(*),
    CASE WHEN COUNT(*) > 0
      THEN COALESCE(SUM(total_vente), 0) / COUNT(*)
      ELSE 0
    END
  INTO v_revenue, v_count, v_avg
  FROM public.interventions
  WHERE statut IN ('terminee', 'facturee')
  AND created_at >= NOW() - (p_days || ' days')::interval;

  RETURN json_build_object(
    'revenue', v_revenue,
    'count', v_count,
    'average_basket', ROUND(v_avg, 2)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
