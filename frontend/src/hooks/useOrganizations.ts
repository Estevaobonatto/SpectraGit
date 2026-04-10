import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsService } from '@/services/organizations.service';
import type { Organization } from '@/types';

export function useMyOrganizations() {
  return useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => organizationsService.myMemberships(),
  });
}

export function useOrganization(name: string) {
  return useQuery({
    queryKey: ['organization', name],
    queryFn: () => organizationsService.get(name),
    enabled: !!name,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; displayName?: string; description?: string }) =>
      organizationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
    },
  });
}

export function useUpdateOrganization(name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Organization>) => organizationsService.update(name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', name] });
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
    },
  });
}

export function useOrgTeams(name: string) {
  return useQuery({
    queryKey: ['org-teams', name],
    queryFn: () => organizationsService.listTeams(name),
    enabled: !!name,
  });
}

export function useOrgMembers(name: string) {
  return useQuery({
    queryKey: ['org-members', name],
    queryFn: () => organizationsService.listMembers(name),
    enabled: !!name,
  });
}

export function useInviteOrgMember(name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { username: string; role?: string }) =>
      organizationsService.inviteMember(name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', name] });
      queryClient.invalidateQueries({ queryKey: ['organization', name] });
    },
  });
}
