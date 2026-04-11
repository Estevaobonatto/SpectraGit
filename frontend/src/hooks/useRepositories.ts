import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repositoriesService } from '@/services/repositories.service';
import type { Repository, BranchProtection, Webhook } from '@/types';

export function useRepositories(params?: { page?: number; limit?: number; scope?: 'mine' | 'all' }) {
  return useQuery({
    queryKey: ['repositories', params],
    queryFn: () => repositoriesService.list(params),
  });
}

export function useRepository(owner: string, repo: string) {
  return useQuery({
    queryKey: ['repository', owner, repo],
    queryFn: () => repositoriesService.get(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useCreateRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      visibility?: 'PUBLIC' | 'PRIVATE';
      defaultBranch?: string;
      initWithReadme?: boolean;
      orgId?: string;
    }) => repositoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}

export function useUpdateRepository(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Repository>) => repositoriesService.update(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repository', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}

export function useDeleteRepository(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => repositoriesService.delete(owner, repo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}

export function useForkRepository(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name?: string) => repositoriesService.fork(owner, repo, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      queryClient.invalidateQueries({ queryKey: ['repository', owner, repo] });
    },
  });
}

export function usePulseRepository(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isPulsed: boolean) =>
      isPulsed
        ? repositoriesService.unpulse(owner, repo)
        : repositoriesService.pulse(owner, repo),
    onMutate: async (isPulsed: boolean) => {
      await queryClient.cancelQueries({ queryKey: ['repository', owner, repo] });
      const previous = queryClient.getQueryData<Repository>(['repository', owner, repo]);
      if (previous) {
        queryClient.setQueryData<Repository>(['repository', owner, repo], {
          ...previous,
          isPulsed: !isPulsed,
          pulseCount: (previous.pulseCount ?? 0) + (isPulsed ? -1 : 1),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['repository', owner, repo], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['repository', owner, repo] });
    },
  });
}

export function useWatchRepository(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isWatched: boolean) =>
      isWatched
        ? repositoriesService.unwatch(owner, repo)
        : repositoriesService.watch(owner, repo),
    onMutate: async (isWatched: boolean) => {
      await queryClient.cancelQueries({ queryKey: ['repository', owner, repo] });
      const previous = queryClient.getQueryData<Repository>(['repository', owner, repo]);
      if (previous) {
        queryClient.setQueryData<Repository>(['repository', owner, repo], {
          ...previous,
          isWatched: !isWatched,
          watchCount: (previous.watchCount ?? 0) + (isWatched ? -1 : 1),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['repository', owner, repo], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['repository', owner, repo] });
    },
  });
}

export function useFileTree(owner: string, repo: string, branch: string, path?: string) {
  return useQuery({
    queryKey: ['file-tree', owner, repo, branch, path],
    queryFn: () => repositoriesService.getTree(owner, repo, branch, path),
    enabled: !!owner && !!repo && !!branch,
  });
}

export function useFileContent(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['file-content', owner, repo, branch, filePath],
    queryFn: () => repositoriesService.getBlob(owner, repo, branch, filePath),
    enabled: (options?.enabled ?? true) && !!owner && !!repo && !!branch && !!filePath,
  });
}

export function useRepoStats(owner: string, repo: string) {
  return useQuery({
    queryKey: ['repo-stats', owner, repo],
    queryFn: () => repositoriesService.getStats(owner, repo),
    enabled: !!owner && !!repo,
    staleTime: 60_000, // Cache for 1 minute
  });
}

// ─── Branch Protection ───────────────────────────────────────

export function useBranchProtection(owner: string, repo: string, branch: string) {
  return useQuery({
    queryKey: ['branch-protection', owner, repo, branch],
    queryFn: () => repositoriesService.getBranchProtection(owner, repo, branch),
    enabled: !!owner && !!repo && !!branch,
  });
}

export function useUpdateBranchProtection(owner: string, repo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branch, data }: { branch: string; data: Partial<BranchProtection['protection']> }) =>
      repositoriesService.updateBranchProtection(owner, repo, branch, data),
    onSuccess: (_, { branch }) => {
      queryClient.invalidateQueries({ queryKey: ['branch-protection', owner, repo, branch] });
      queryClient.invalidateQueries({ queryKey: ['branches', owner, repo] });
    },
  });
}

export function useRemoveBranchProtection(owner: string, repo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branch: string) => repositoriesService.removeBranchProtection(owner, repo, branch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-protection'] });
      queryClient.invalidateQueries({ queryKey: ['branches', owner, repo] });
    },
  });
}

// ─── Webhooks ────────────────────────────────────────────────

export function useWebhooks(owner: string, repo: string) {
  return useQuery({
    queryKey: ['webhooks', owner, repo],
    queryFn: () => repositoriesService.listWebhooks(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useCreateWebhook(owner: string, repo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { url: string; secret?: string; events?: string[]; isActive?: boolean }) =>
      repositoriesService.createWebhook(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', owner, repo] });
    },
  });
}

export function useUpdateWebhook(owner: string, repo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ webhookId, data }: { webhookId: string; data: Partial<Webhook> }) =>
      repositoriesService.updateWebhook(owner, repo, webhookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', owner, repo] });
    },
  });
}

export function useDeleteWebhook(owner: string, repo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (webhookId: string) => repositoriesService.deleteWebhook(owner, repo, webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', owner, repo] });
    },
  });
}

// ─── Transfer ────────────────────────────────────────────────

export function useTransferRepository(owner: string, repo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { newOwner: string; newName?: string }) =>
      repositoriesService.transferRepository(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}
