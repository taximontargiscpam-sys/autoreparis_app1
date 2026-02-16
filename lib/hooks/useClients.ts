import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Client, Vehicle } from '../database.types';
import { clientService } from '../services/clientService';

export function useClients(search = '', page = 0) {
  return useQuery({
    queryKey: ['clients', search, page],
    queryFn: () => clientService.list(search, page),
  });
}

export function useInfiniteClients(search = '') {
  return useInfiniteQuery({
    queryKey: ['clients-infinite', search],
    queryFn: ({ pageParam = 0 }) => clientService.list(search, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length : undefined;
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['client', id],
    enabled: !!id,
    queryFn: () => clientService.getById(id!),
  });
}

export function useClientVehicles(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-vehicles', clientId],
    enabled: !!clientId,
    queryFn: () => clientService.getVehicles(clientId!),
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (client: Omit<Client, 'id' | 'created_at'>) => clientService.create(client),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vehicle: Omit<Vehicle, 'id' | 'created_at'>) => clientService.createVehicle(vehicle),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['client-vehicles', variables.client_id] });
    },
  });
}
