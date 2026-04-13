import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesService, commitsService } from '@/services/repositories.service';

export function useBranches(owner: string, repo: string) {
  return useQuery({
    queryKey: ['branches', owner, repo],
    queryFn: () => branchesService.list(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useCreateBranch(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; startPoint: string }) =>
      branchesService.create(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', owner, repo] });
    },
  });
}

export function useDeleteBranch(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branch: string) => branchesService.delete(owner, repo, branch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', owner, repo] });
    },
  });
}

export function useCommits(owner: string, repo: string, params?: { branch?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['commits', owner, repo, params],
    queryFn: () => commitsService.list(owner, repo, params),
    enabled: !!owner && !!repo,
  });
}

export function useCommitsPaginated(owner: string, repo: string, params?: { branch?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['commits-paginated', owner, repo, params],
    queryFn: () => commitsService.listPaginated(owner, repo, params),
    enabled: !!owner && !!repo,
  });
}

export function useCommitDetail(owner: string, repo: string, sha: string) {
  return useQuery({
    queryKey: ['commit', owner, repo, sha],
    queryFn: () => commitsService.get(owner, repo, sha),
    enabled: !!owner && !!repo && !!sha,
  });
}

export function useCommitDiff(owner: string, repo: string, sha: string) {
  return useQuery({
    queryKey: ['commit-diff', owner, repo, sha],
    queryFn: () => commitsService.getDiff(owner, repo, sha),
    enabled: !!owner && !!repo && !!sha,
  });
}
