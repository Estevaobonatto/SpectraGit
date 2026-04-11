import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collaboratorsService } from '@/services/collaborators.service';
import type { RepoRole } from '@/types';

export function useCollaborators(owner: string, repo: string) {
  return useQuery({
    queryKey: ['collaborators', owner, repo],
    queryFn: () => collaboratorsService.list(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useAddCollaborator(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { username: string; role?: RepoRole }) =>
      collaboratorsService.add(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', owner, repo] });
    },
  });
}

export function useUpdateCollaboratorRole(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, role }: { username: string; role: RepoRole }) =>
      collaboratorsService.updateRole(owner, repo, username, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', owner, repo] });
    },
  });
}

export function useRemoveCollaborator(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) =>
      collaboratorsService.remove(owner, repo, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', owner, repo] });
    },
  });
}

export function useSearchCollaboratorUsers(owner: string, repo: string, query: string) {
  return useQuery({
    queryKey: ['collaborator-search', owner, repo, query],
    queryFn: () => collaboratorsService.searchUsers(owner, repo, query),
    enabled: !!owner && !!repo && query.length >= 2,
  });
}

export function useOrgMembersForRepo(owner: string, repo: string, orgName: string) {
  return useQuery({
    queryKey: ['collaborator-org-members', owner, repo, orgName],
    queryFn: () => collaboratorsService.listOrgMembers(owner, repo, orgName),
    enabled: !!owner && !!repo && !!orgName,
  });
}

export function useCollaboratedRepositories(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['collaborated-repos', params],
    queryFn: () => collaboratorsService.listCollaboratedRepos(params),
  });
}
