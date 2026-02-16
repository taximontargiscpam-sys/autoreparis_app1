import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/teamService';

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamService.listMembers(),
  });
}

export function useTeamAvailability(date: string) {
  return useQuery({
    queryKey: ['team-availability', date],
    queryFn: () => teamService.getAvailability(date),
  });
}

export function useUserMonthlyAvailability(userId: string | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['user-monthly-availability', userId, startDate, endDate],
    enabled: !!userId,
    queryFn: () => teamService.getMonthlyAvailability(userId!, startDate, endDate),
  });
}

export function useSaveAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (records: { user_id: string; date: string; statut: string }[]) =>
      teamService.saveAvailability(records),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-availability'] });
      qc.invalidateQueries({ queryKey: ['user-monthly-availability'] });
    },
  });
}

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (member: { prenom: string; nom: string; role: string }) =>
      teamService.createMember(member),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamService.deleteMember(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}
