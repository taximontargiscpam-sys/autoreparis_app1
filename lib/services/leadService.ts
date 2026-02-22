import type { DevisAuto, LeadStatus } from '../database.types';
import { supabaseWebsite } from '../supabaseWebsite';

export const leadService = {
  async list(search = '') {
    let query = supabaseWebsite
      .from('devis_auto')
      .select('*')
      .order('created_at', { ascending: false });

    if (search.trim()) {
      query = query.or(`nom.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as DevisAuto[];
  },

  async getById(id: string) {
    const { data, error } = await supabaseWebsite
      .from('devis_auto')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as DevisAuto;
  },

  async updateStatus(id: string, statut: LeadStatus | string) {
    const { error } = await supabaseWebsite
      .from('devis_auto')
      .update({ statut })
      .eq('id', id);
    if (error) throw error;
  },

  async archive(id: string) {
    const { error } = await supabaseWebsite
      .from('devis_auto')
      .update({ statut: 'perdu' })
      .eq('id', id);
    if (error) throw error;
  },
};
