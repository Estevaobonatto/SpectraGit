import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { releasesService } from '@/services/repositories.service';

export function useReleases(owner: string, repo: string) {
  return useQuery({
    queryKey: ['releases', owner, repo],
    queryFn: () => releasesService.list(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useRelease(owner: string, repo: string, releaseId: string) {
  return useQuery({
    queryKey: ['release', owner, repo, releaseId],
    queryFn: () => releasesService.get(owner, repo, releaseId),
    enabled: !!owner && !!repo && !!releaseId,
  });
}

export function useCreateRelease(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      tagName: string;
      name: string;
      body?: string;
      targetBranch?: string;
      isDraft?: boolean;
      isPrerelease?: boolean;
      commitSha?: string;
      tagMessage?: string;
    }) => releasesService.create(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['tags', owner, repo] });
    },
  });
}

export function useUpdateRelease(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ releaseId, data }: {
      releaseId: string;
      data: { name?: string; body?: string; targetBranch?: string; isDraft?: boolean; isPrerelease?: boolean };
    }) => releasesService.update(owner, repo, releaseId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['releases', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['release', owner, repo, vars.releaseId] });
    },
  });
}

export function useDeleteRelease(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (releaseId: string) => releasesService.delete(owner, repo, releaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases', owner, repo] });
    },
  });
}

export function useUploadAssets(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ releaseId, files }: { releaseId: string; files: File[] }) =>
      releasesService.uploadAssets(owner, repo, releaseId, files),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['release', owner, repo, vars.releaseId] });
      queryClient.invalidateQueries({ queryKey: ['releases', owner, repo] });
    },
  });
}

export function useDeleteAsset(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ releaseId, assetId }: { releaseId: string; assetId: string }) =>
      releasesService.deleteAsset(owner, repo, releaseId, assetId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['release', owner, repo, vars.releaseId] });
      queryClient.invalidateQueries({ queryKey: ['releases', owner, repo] });
    },
  });
}
