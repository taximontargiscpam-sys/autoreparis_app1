import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { Client, Vehicle } from '../database.types';

const PAGE_SIZE = 30;

export function useClients(search = '', page = 0) {
  return useQuery({
    queryKey: ['clients', search, page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .order('nom', { ascending: true })
        .range(from, to);

      if (search.trim()) {
        query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data ?? []) as Client[], total: count ?? 0 };
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['client', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Client;
    },
  });
}

export function useClientVehicles(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-vehicles', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Vehicle[];
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single();
      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicle])
        .select()
        .single();
      if (error) throw error;
      return data as Vehicle;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['client-vehicles', variables.client_id] });
    },
  });
}
