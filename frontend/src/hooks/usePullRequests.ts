import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pullRequestsService, reviewsService } from '@/services/pull-requests.service';
import type { ChecklistItem, ContextBlocks, PrRiskConfig } from '@/types';

export function usePullRequests(owner: string, repo: string, params?: { status?: string; page?: number; limit?: number; sort?: string; sortOrder?: string; search?: string }) {
  return useQuery({
    queryKey: ['pull-requests', owner, repo, params],
    queryFn: () => pullRequestsService.list(owner, repo, params),
    enabled: !!owner && !!repo,
  });
}

export function usePullRequest(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['pull-request', owner, repo, number],
    queryFn: () => pullRequestsService.get(owner, repo, number),
    enabled: !!owner && !!repo && !!number,
  });
}

export function usePullRequestDiff(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['pr-diff', owner, repo, number],
    queryFn: () => pullRequestsService.getDiff(owner, repo, number),
    enabled: !!owner && !!repo && !!number,
  });
}

export function usePRSummary(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['pr-summary', owner, repo, number],
    queryFn: () => pullRequestsService.getSummary(owner, repo, number),
    enabled: !!owner && !!repo && !!number,
  });
}

export function usePRTimeline(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['pr-timeline', owner, repo, number],
    queryFn: () => pullRequestsService.getTimeline(owner, repo, number),
    enabled: !!owner && !!repo && !!number,
  });
}

export function usePRBlockers(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['pr-blockers', owner, repo, number],
    queryFn: () => pullRequestsService.getBlockers(owner, repo, number),
    enabled: !!owner && !!repo && !!number,
  });
}

export function usePrRiskConfig(owner: string, repo: string) {
  return useQuery({
    queryKey: ['pr-risk-config', owner, repo],
    queryFn: () => pullRequestsService.getPrRiskConfig(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useCreatePullRequest(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; body?: string; sourceBranch: string; targetBranch: string; isDraft?: boolean; checklist?: ChecklistItem[]; contextBlocks?: Partial<ContextBlocks> }) =>
      pullRequestsService.create(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-requests', owner, repo] });
    },
  });
}

export function useMergePullRequest(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategy?: string) => pullRequestsService.merge(owner, repo, number, strategy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['pull-requests', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['pr-summary', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['pr-blockers', owner, repo, number] });
    },
  });
}

export function useClosePullRequest(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => pullRequestsService.close(owner, repo, number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['pull-requests', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['pr-summary', owner, repo, number] });
    },
  });
}

export function useAddPRComment(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => pullRequestsService.addComment(owner, repo, number, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['pr-timeline', owner, repo, number] });
    },
  });
}

export function useUpdateChecklist(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ChecklistItem[]) => pullRequestsService.updateChecklist(owner, repo, number, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
    },
  });
}

export function useUpdateContextBlocks(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContextBlocks>) => pullRequestsService.updateContextBlocks(owner, repo, number, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
    },
  });
}

export function useAddReviewer(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => pullRequestsService.addReviewer(owner, repo, number, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['pr-blockers', owner, repo, number] });
    },
  });
}

export function useRemoveReviewer(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => pullRequestsService.removeReviewer(owner, repo, number, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['pr-blockers', owner, repo, number] });
    },
  });
}

export function useResolveComment(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, resolved }: { commentId: string; resolved: boolean }) =>
      pullRequestsService.resolveComment(owner, repo, number, commentId, resolved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
    },
  });
}

export function useSetPRLabels(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labelIds: string[]) => pullRequestsService.setLabels(owner, repo, number, labelIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
    },
  });
}

export function useAddDependency(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dependsOnPrNumber: number) => pullRequestsService.addDependency(owner, repo, number, dependsOnPrNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
    },
  });
}

export function useRemoveDependency(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (depId: string) => pullRequestsService.removeDependency(owner, repo, number, depId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
    },
  });
}

export function useUpdatePrRiskConfig(owner: string, repo: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: PrRiskConfig) => pullRequestsService.updatePrRiskConfig(owner, repo, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pr-risk-config', owner, repo] });
    },
  });
}

export function useReviews(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['reviews', owner, repo, number],
    queryFn: () => reviewsService.list(owner, repo, number),
    enabled: !!owner && !!repo && !!number,
  });
}

export function useSubmitReview(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { status: string; body?: string }) =>
      reviewsService.submit(owner, repo, number, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['pr-blockers', owner, repo, number] });
    },
  });
}
