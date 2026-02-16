import type { Product } from '../database.types';
import { supabase } from '../supabase';

const PAGE_SIZE = 30;

export const productService = {
  async list(category = 'all', page = 0) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('nom', { ascending: true })
      .range(from, to);

    if (category !== 'all') {
      query = query.eq('categorie', category);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []) as Product[], total: count ?? 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Product;
  },

  async getByBarcode(code: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('code_barres', code)
      .maybeSingle();
    if (error) throw error;
    return data as Product | null;
  },

  async updateStock(params: {
    productId: string;
    newStock: number;
    previousStock: number;
    motif?: string;
    userId?: string | null;
  }) {
    const { productId, newStock, previousStock, motif, userId } = params;
    const diff = newStock - previousStock;

    const { error: prodError } = await supabase
      .from('products')
      .update({ stock_actuel: newStock })
      .eq('id', productId);
    if (prodError) throw prodError;

    const { error: mvtError } = await supabase
      .from('stock_movements')
      .insert([{
        product_id: productId,
        type: diff > 0 ? 'entree' : 'sortie',
        quantite: Math.abs(diff),
        motif: motif || 'Ajustement manuel',
        stock_avant: previousStock,
        stock_apres: newStock,
        user_id: userId ?? null,
      }]);
    if (mvtError) throw mvtError;
  },

  async create(product: Omit<Product, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    if (error) throw error;
    return data as Product;
  },

  async delete(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },
};
