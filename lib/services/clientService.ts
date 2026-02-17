import type { Client, Vehicle } from '../database.types';
import { supabase } from '../supabase';

const PAGE_SIZE = 30;

export const clientService = {
  async list(search = '', page = 0) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .order('nom', { ascending: true })
      .range(from, to);

    if (search.trim()) {
      const sanitized = search.replace(/[%_,()]/g, '');
      query = query.or(`nom.ilike.%${sanitized}%,prenom.ilike.%${sanitized}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []) as Client[], total: count ?? 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Client;
  },

  async getVehicles(clientId: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Vehicle[];
  },

  async create(client: Omit<Client, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },

  async delete(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicle])
      .select()
      .single();
    if (error) throw error;
    return data as Vehicle;
  },
};
