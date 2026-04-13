import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wikiService } from '@/services/wiki.service';
import type { WikiSourceMode } from '@/types';

// ─── Settings ────────────────────────────────────────────────

export function useWikiSettings(owner: string, repo: string) {
  return useQuery({
    queryKey: ['wiki-settings', owner, repo],
    queryFn: () => wikiService.getSettings(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useUpdateWikiSettings(owner: string, repo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      sourceMode?: WikiSourceMode;
      sourceBranch?: string;
      sourceRoot?: string;
      homePage?: string;
      allowComments?: boolean;
      allowAttachments?: boolean;
    }) => wikiService.updateSettings(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-settings', owner, repo] });
    },
  });
}

// ─── Pages ───────────────────────────────────────────────────

export function useWikiPages(owner: string, repo: string) {
  return useQuery({
    queryKey: ['wiki-pages', owner, repo],
    queryFn: () => wikiService.listPages(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useWikiPage(owner: string, repo: string, slug: string) {
  return useQuery({
    queryKey: ['wiki-page', owner, repo, slug],
    queryFn: () => wikiService.getPage(owner, repo, slug),
    enabled: !!owner && !!repo && !!slug,
  });
}

export function useCreateWikiPage(owner: string, repo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      body: string;
      parentId?: string;
      sortOrder?: number;
      message?: string;
    }) => wikiService.createPage(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-pages', owner, repo] });
    },
  });
}

export function useUpdateWikiPage(owner: string, repo: string, slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title?: string;
      body?: string;
      parentId?: string;
      sortOrder?: number;
      message?: string;
    }) => wikiService.updatePage(owner, repo, slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-pages', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['wiki-page', owner, repo, slug] });
    },
  });
}

export function useDeleteWikiPage(owner: string, repo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => wikiService.deletePage(owner, repo, slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-pages', owner, repo] });
    },
  });
}

// ─── Versions ────────────────────────────────────────────────

export function useWikiPageVersions(owner: string, repo: string, slug: string) {
  return useQuery({
    queryKey: ['wiki-versions', owner, repo, slug],
    queryFn: () => wikiService.listVersions(owner, repo, slug),
    enabled: !!owner && !!repo && !!slug,
  });
}

export function useWikiPageVersion(owner: string, repo: string, slug: string, version: number) {
  return useQuery({
    queryKey: ['wiki-version', owner, repo, slug, version],
    queryFn: () => wikiService.getVersion(owner, repo, slug, version),
    enabled: !!owner && !!repo && !!slug && version > 0,
  });
}

export function useRestoreWikiVersion(owner: string, repo: string, slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => wikiService.restoreVersion(owner, repo, slug, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-page', owner, repo, slug] });
      queryClient.invalidateQueries({ queryKey: ['wiki-versions', owner, repo, slug] });
      queryClient.invalidateQueries({ queryKey: ['wiki-pages', owner, repo] });
    },
  });
}

// ─── Comments ────────────────────────────────────────────────

export function useWikiComments(owner: string, repo: string, slug: string) {
  return useQuery({
    queryKey: ['wiki-comments', owner, repo, slug],
    queryFn: () => wikiService.listComments(owner, repo, slug),
    enabled: !!owner && !!repo && !!slug,
  });
}

export function useCreateWikiComment(owner: string, repo: string, slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { body: string }) => wikiService.createComment(owner, repo, slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-comments', owner, repo, slug] });
    },
  });
}

export function useDeleteWikiComment(owner: string, repo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => wikiService.deleteComment(owner, repo, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-comments'] });
    },
  });
}
