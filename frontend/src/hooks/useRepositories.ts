import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repositoriesService } from '@/services/repositories.service';
import type { Repository } from '@/types';

export function useRepositories(params?: { page?: number; limit?: number }) {
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
