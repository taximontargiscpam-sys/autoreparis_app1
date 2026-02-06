import { useState, useRef } from 'react';
import { supabase } from '../supabase';

const RATE_LIMIT_MS = 2000; // 2 seconds between searches

export function useVehicleSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSearchRef = useRef(0);

  const search = async (plate: string): Promise<string | null> => {
    setError(null);

    // Rate limiting
    const now = Date.now();
    if (now - lastSearchRef.current < RATE_LIMIT_MS) {
      setError('Veuillez patienter avant de relancer une recherche.');
      return null;
    }
    lastSearchRef.current = now;

    const cleanPlate = plate.replace(/[\s-]/g, '').toUpperCase();
    if (!cleanPlate) {
      setError("Veuillez entrer une plaque d'immatriculation.");
      return null;
    }

    setLoading(true);
    try {
      // Find vehicle
      const { data: vehicle, error: vError } = await supabase
        .from('vehicles')
        .select('id')
        .ilike('immatriculation', cleanPlate)
        .limit(1)
        .maybeSingle();

      if (vError) throw vError;
      if (!vehicle) {
        setError("Véhicule introuvable. Vérifiez l'immatriculation.");
        return null;
      }

      // Find latest intervention
      const { data: intervention, error: iError } = await supabase
        .from('interventions')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (iError) throw iError;
      if (!intervention) {
        setError("Aucune intervention trouvée pour ce véhicule.");
        return null;
      }

      return intervention.id;
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { search, loading, error };
}
