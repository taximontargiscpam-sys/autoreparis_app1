import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { User, TeamAvailability } from '../database.types';

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('actif', true)
        .order('nom');
      if (error) throw error;
      return (data ?? []) as User[];
    },
  });
}

export function useTeamAvailability(date: string) {
  return useQuery({
    queryKey: ['team-availability', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_availability')
        .select('*')
        .eq('date', date);
      if (error) throw error;
      return (data ?? []) as TeamAvailability[];
    },
  });
}

export function useUserMonthlyAvailability(userId: string | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['user-monthly-availability', userId, startDate, endDate],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_availability')
        .select('*')
        .eq('user_id', userId!)
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) throw error;
      return (data ?? []) as TeamAvailability[];
    },
  });
}

export function useSaveAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (records: { user_id: string; date: string; statut: string }[]) => {
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-availability'] });
      qc.invalidateQueries({ queryKey: ['user-monthly-availability'] });
    },
  });
}

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (member: { prenom: string; nom: string; role: string }) => {
      const { data, error } = await supabase
        .from('users')
        .insert([{ ...member, actif: true }])
        .select()
        .single();
      if (error) throw error;
      return data as User;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('users')
        .update({ actif: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}
