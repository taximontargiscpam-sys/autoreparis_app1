import type { InterventionStatus, InterventionWithRelations } from '../database.types';
import { supabase } from '../supabase';

const PAGE_SIZE = 30;

const INTERVENTION_SELECT = `
  *,
  clients (nom, prenom, telephone, email),
  vehicles (marque, modele, immatriculation),
  mecanicien:users(id, nom, prenom)
`;

const INTERVENTION_DETAIL_SELECT = `
  *,
  clients (nom, prenom, telephone, email),
  vehicles (marque, modele, immatriculation, kilometrage),
  mecanicien:users(id, nom, prenom)
`;

export const interventionService = {
  async list(page = 0) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from('interventions')
      .select(INTERVENTION_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: (data ?? []) as InterventionWithRelations[], total: count ?? 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('interventions')
      .select(INTERVENTION_DETAIL_SELECT)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as InterventionWithRelations;
  },

  async updateStatus(id: string, statut: InterventionStatus) {
    const { error } = await supabase
      .from('interventions')
      .update({ statut })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from('interventions').delete().eq('id', id);
    if (error) throw error;
  },

  async assignMechanic(interventionId: string, mecanicienId: string) {
    const { error } = await supabase
      .from('interventions')
      .update({ mecanicien_id: mecanicienId, statut: 'planifiee' as InterventionStatus })
      .eq('id', interventionId);
    if (error) throw error;
  },

  async getDashboardStats() {
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
};
