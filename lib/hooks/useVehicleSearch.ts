import { useRef, useState } from 'react';
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
      // Use secure RPC instead of direct table access
      const { data: interventionId, error: rpcError } = await supabase
        .rpc('get_vehicle_status_public', { plate_text: cleanPlate });

      if (rpcError) throw rpcError;

      if (!interventionId) {
        setError("Aucun véhicule ou intervention trouvée pour cette plaque.");
        return null;
      }

      return interventionId;
    } catch (err: unknown) {
      if (__DEV__) {
        console.error('Search error:', err);
      }
      setError('Impossible de vérifier le statut. Veuillez réessayer.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { search, loading, error };
}
