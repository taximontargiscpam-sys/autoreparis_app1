import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { Product } from '../database.types';
import { useAuth } from '../../components/AuthContext';

const PAGE_SIZE = 30;

export function useProducts(category = 'all', page = 0) {
  return useQuery({
    queryKey: ['products', category, page],
    queryFn: async () => {
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
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Product;
    },
  });
}

export function useProductByBarcode(code: string | undefined) {
  return useQuery({
    queryKey: ['product-barcode', code],
    enabled: !!code && code.length > 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('code_barres', code!)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });
}

export function useUpdateStock() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, newStock, previousStock, motif }: {
      productId: string;
      newStock: number;
      previousStock: number;
      motif?: string;
    }) => {
      const diff = newStock - previousStock;

      // Update product stock
      const { error: prodError } = await supabase
        .from('products')
        .update({ stock_actuel: newStock })
        .eq('id', productId);
      if (prodError) throw prodError;

      // Log stock movement
      const { error: mvtError } = await supabase
        .from('stock_movements')
        .insert([{
          product_id: productId,
          type: diff > 0 ? 'entree' : 'sortie',
          quantite: Math.abs(diff),
          motif: motif || 'Ajustement manuel',
          stock_avant: previousStock,
          stock_apres: newStock,
          user_id: user?.id ?? null,
        }]);
      if (mvtError) throw mvtError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
