import type { User, TeamAvailability } from '../database.types';
import { supabase } from '../supabase';

export const teamService = {
  async listMembers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('actif', true)
      .order('nom');
    if (error) throw error;
    return (data ?? []) as User[];
  },

  async getAvailability(date: string) {
    const { data, error } = await supabase
      .from('team_availability')
      .select('*')
      .eq('date', date);
    if (error) throw error;
    return (data ?? []) as TeamAvailability[];
  },

  async getMonthlyAvailability(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('team_availability')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);
    if (error) throw error;
    return (data ?? []) as TeamAvailability[];
  },

  async saveAvailability(records: { user_id: string; date: string; statut: string }[]) {
    for (const record of records) {
      const { data: existing } = await supabase
        .from('team_availability')
        .select('id')
        .eq('user_id', record.user_id)
        .eq('date', record.date)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('team_availability')
          .update({ statut: record.statut })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_availability')
          .insert([record]);
        if (error) throw error;
      }
    }
  },

  async createMember(member: { prenom: string; nom: string; role: string }) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ ...member, actif: true }])
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },

  async deleteMember(id: string) {
    const { error } = await supabase
      .from('users')
      .update({ actif: false })
      .eq('id', id);
    if (error) throw error;
  },
};
