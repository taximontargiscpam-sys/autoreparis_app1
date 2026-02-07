-- =====================================================
-- SECURE RPC FUNCTIONS FOR PUBLIC TRACKING
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Get Vehicle Status (Returns Intervention ID if found)
-- Create helper function first
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
  -- 1. Nettoyage de la plaque (enlever espaces/tirets, majuscules)
  clean_plate := normalize_plate(plate_text);

  -- 2. Trouver le véhicule
  SELECT id INTO target_vehicle_id
  FROM public.vehicles
  WHERE normalize_plate(immatriculation) = clean_plate
  LIMIT 1;

  IF target_vehicle_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 3. Trouver la dernière intervention active (non terminée/annulée de préférence, ou la plus récente)
  SELECT id INTO intervention_id
  FROM public.interventions
  WHERE vehicle_id = target_vehicle_id
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN intervention_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER allows this function to run with privileges of the creator (admin),
-- bypassing RLS on the underlying tables for the anonymous user.


-- RPC pour récupérer les détails de l'intervention (SANS EXPOSER TOUTE LA TABLE)
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
      'marque', v.marque,
      'modele', v.modele,
      'immatriculation', v.immatriculation
    ) FROM public.vehicles v WHERE v.id = i.vehicle_id),
    'lines', (
      SELECT json_agg(json_build_object(
        'description', l.description,
        'quantite', l.quantite,
        'prix_vente', l.total_vente_ligne, -- CORRIGÉ
        'type', l.type_ligne
      ))
      FROM public.intervention_lines l
      WHERE l.intervention_id = i.id
    ),
    'photos', (
      SELECT json_agg(json_build_object(
        'url_image', p.url_image, -- CORRIGÉ
        'type', p.type,
        'created_at', p.created_at
      ))
      FROM public.vehicle_photos p
      WHERE p.intervention_id = i.id
    )
  ) INTO result
  FROM public.interventions i
  WHERE i.id = intervention_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
