import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseWebsite } from '../supabaseWebsite';
import type { DevisAuto } from '../database.types';

export function useLeads(search = '') {
  return useQuery({
    queryKey: ['leads', search],
    queryFn: async () => {
      let query = supabaseWebsite
        .from('devis_auto')
        .select('*')
        .order('created_at', { ascending: false });

      if (search.trim()) {
        query = query.or(`nom.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as DevisAuto[];
    },
    staleTime: 1000 * 15, // 15 seconds — leads are time-sensitive
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['lead', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabaseWebsite
        .from('devis_auto')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as DevisAuto;
    },
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabaseWebsite
        .from('devis_auto')
        .update({ statut })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseWebsite
        .from('devis_auto')
        .update({ statut: 'perdu' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
