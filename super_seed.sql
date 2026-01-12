-- 1. Nettoyage (Cleanup)
-- On supprime d'abord les interventions liées à cette plaque pour éviter les conflits
DELETE FROM public.interventions 
WHERE vehicle_id IN (SELECT id FROM public.vehicles WHERE immatriculation = 'AA-123-BB');

-- On supprime les véhicules (Zombies)
DELETE FROM public.vehicles 
WHERE immatriculation = 'AA-123-BB';

-- 2. Insertion Propre (Fresh Seed)
WITH new_client AS (
  INSERT INTO public.clients (nom, prenom, email, telephone)
  VALUES ('Dupont', 'Jean', 'jean.sql@test.com', '0601020304')
  RETURNING id
),
new_vehicle AS (
  INSERT INTO public.vehicles (client_id, marque, modele, immatriculation, annee)
  SELECT id, 'Peugeot', '308', 'AA-123-BB', 2020 FROM new_client
  RETURNING id, client_id
)
INSERT INTO public.interventions (vehicle_id, client_id, statut, type_intervention, date_heure_debut_prevue, total_vente)
SELECT id, client_id, 'en_cours', 'Révision Complète', NOW(), 350 FROM new_vehicle;
