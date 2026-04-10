import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pullRequestsService, reviewsService } from '@/services/pull-requests.service';

export function usePullRequests(owner: string, repo: string, params?: { status?: string; page?: number; limit?: number }) {
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

export function useCreatePullRequest(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; body?: string; sourceBranch: string; targetBranch: string }) =>
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
    },
  });
}

export function useAddPRComment(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => pullRequestsService.addComment(owner, repo, number, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pull-request', owner, repo, number] });
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
    },
  });
}
