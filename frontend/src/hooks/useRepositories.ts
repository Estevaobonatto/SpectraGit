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
    mutationFn: () => repositoriesService.fork(owner, repo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
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

export function useFileContent(owner: string, repo: string, branch: string, filePath: string) {
  return useQuery({
    queryKey: ['file-content', owner, repo, branch, filePath],
    queryFn: () => repositoriesService.getBlob(owner, repo, branch, filePath),
    enabled: !!owner && !!repo && !!branch && !!filePath,
  });
}
