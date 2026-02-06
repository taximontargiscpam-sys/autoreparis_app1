import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { InterventionWithRelations, InterventionStatus } from '../database.types';

const PAGE_SIZE = 30;

export function useInterventions(page = 0) {
  return useQuery({
    queryKey: ['interventions', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('interventions')
        .select(`
          *,
          clients (nom, prenom, telephone, email),
          vehicles (marque, modele, immatriculation),
          mecanicien:users(nom, prenom)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: (data ?? []) as InterventionWithRelations[], total: count ?? 0 };
    },
  });
}

export function useIntervention(id: string | undefined) {
  return useQuery({
    queryKey: ['intervention', id],
    enabled: !!id && !id.startsWith('dummy'),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interventions')
        .select(`
          *,
          clients (nom, prenom, telephone, email),
          vehicles (marque, modele, immatriculation, kilometrage),
          mecanicien:users(nom, prenom)
        `)
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data as InterventionWithRelations;
    },
  });
}

export function useUpdateInterventionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: InterventionStatus }) => {
      const { error } = await supabase
        .from('interventions')
        .update({ statut })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['intervention', variables.id] });
      qc.invalidateQueries({ queryKey: ['interventions'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteIntervention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('interventions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interventions'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useAssignMechanic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ interventionId, mecanicienId }: { interventionId: string; mecanicienId: string }) => {
      const { error } = await supabase
        .from('interventions')
        .update({ mecanicien_id: mecanicienId, statut: 'planifiee' as InterventionStatus })
        .eq('id', interventionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interventions'] });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [interventions, stock, leads, revenue] = await Promise.all([
        supabase.from('interventions').select('*', { count: 'exact', head: true }).neq('statut', 'terminee'),
        supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock_actuel', 5),
        supabase.from('leads_site_web').select('*', { count: 'exact', head: true }).eq('statut', 'nouveau'),
        (() => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return supabase
            .from('interventions')
            .select('total_vente')
            .in('statut', ['terminee', 'facturee'])
            .gte('created_at', weekAgo.toISOString());
        })(),
      ]);

      const weeklyRevenue = revenue.data?.reduce((acc, curr) => acc + (curr.total_vente || 0), 0) ?? 0;

      return {
        interventionsCount: interventions.count ?? 0,
        stockLowCount: stock.count ?? 0,
        leadsCount: leads.count ?? 0,
        revenue: weeklyRevenue,
      };
    },
    staleTime: 1000 * 30, // 30 seconds for dashboard
  });
}
