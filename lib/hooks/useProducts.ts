import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../database.types';
import { useAuth } from '../../components/AuthContext';
import { productService } from '../services/productService';

export function useProducts(category = 'all', page = 0) {
  return useQuery({
    queryKey: ['products', category, page],
    queryFn: () => productService.list(category, page),
  });
}

export function useInfiniteProducts(category = 'all') {
  return useInfiniteQuery({
    queryKey: ['products-infinite', category],
    queryFn: ({ pageParam = 0 }) => productService.list(category, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length : undefined;
    },
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    enabled: !!id,
    queryFn: () => productService.getById(id!),
  });
}

export function useProductByBarcode(code: string | undefined) {
  return useQuery({
    queryKey: ['product-barcode', code],
    enabled: !!code && code.length > 3,
    queryFn: () => productService.getByBarcode(code!),
  });
}

export function useUpdateStock() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ productId, newStock, previousStock, motif }: {
      productId: string;
      newStock: number;
      previousStock: number;
      motif?: string;
    }) => productService.updateStock({
      productId,
      newStock,
      previousStock,
      motif,
      userId: user?.id ?? null,
    }),
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
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (product: Omit<Product, 'id' | 'created_at'>) => productService.create(product),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
