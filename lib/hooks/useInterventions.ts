import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InterventionStatus } from '../database.types';
import { interventionService } from '../services/interventionService';

export function useInterventions(page = 0) {
  return useQuery({
    queryKey: ['interventions', page],
    queryFn: () => interventionService.list(page),
  });
}

export function useInfiniteInterventions() {
  return useInfiniteQuery({
    queryKey: ['interventions-infinite'],
    queryFn: ({ pageParam = 0 }) => interventionService.list(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length : undefined;
    },
  });
}

export function useIntervention(id: string | undefined) {
  return useQuery({
    queryKey: ['intervention', id],
    enabled: !!id && !id.startsWith('dummy'),
    queryFn: () => interventionService.getById(id!),
  });
}

export function useUpdateInterventionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: InterventionStatus }) =>
      interventionService.updateStatus(id, statut),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['intervention', variables.id] });
      qc.invalidateQueries({ queryKey: ['interventions'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteIntervention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => interventionService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interventions'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useAssignMechanic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ interventionId, mecanicienId }: { interventionId: string; mecanicienId: string }) =>
      interventionService.assignMechanic(interventionId, mecanicienId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interventions'] });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => interventionService.getDashboardStats(),
    staleTime: 1000 * 30,
  });
}
