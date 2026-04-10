import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsService } from '@/services/repositories.service';

export function useTags(owner: string, repo: string) {
  return useQuery({
    queryKey: ['tags', owner, repo],
    queryFn: () => tagsService.list(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useTag(owner: string, repo: string, tag: string) {
  return useQuery({
    queryKey: ['tag', owner, repo, tag],
    queryFn: () => tagsService.get(owner, repo, tag),
    enabled: !!owner && !!repo && !!tag,
  });
}

export function useCreateTag(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; commitSha: string; message?: string }) =>
      tagsService.create(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', owner, repo] });
    },
  });
}

export function useDeleteTag(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tag: string) => tagsService.delete(owner, repo, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', owner, repo] });
    },
  });
}
