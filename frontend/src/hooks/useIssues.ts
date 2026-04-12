import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesService } from '@/services/issues.service';
import type { IssueType, IssueAnalysis } from '@/types';

export function useIssues(owner: string, repo: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['issues', owner, repo, params],
    queryFn: () => issuesService.list(owner, repo, params),
    enabled: !!owner && !!repo,
  });
}

export function useIssue(owner: string, repo: string, number: number) {
  return useQuery({
    queryKey: ['issue', owner, repo, number],
    queryFn: () => issuesService.get(owner, repo, number),
    enabled: !!owner && !!repo && !!number,
  });
}

export function useCreateIssue(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof issuesService.create>[2]) =>
      issuesService.create(owner, repo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', owner, repo] });
    },
  });
}

export function useUpdateIssue(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof issuesService.update>[3]) =>
      issuesService.update(owner, repo, number, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['issues', owner, repo] });
    },
  });
}

// Move any issue to a new status (used by kanban DnD)
export function useMoveIssueStatus(owner: string, repo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueNumber, status }: { issueNumber: number; status: string }) =>
      issuesService.update(owner, repo, issueNumber, { status } as Partial<import('@/types').Issue>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues-kanban', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['issues', owner, repo] });
    },
  });
}

export function useAddIssueComment(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => issuesService.addComment(owner, repo, number, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', owner, repo, number] });
    },
  });
}

// --- New hooks for enhanced issue system ---

export function useIssueAnalysis(owner: string, repo: string) {
  return useMutation<IssueAnalysis, Error, { title: string; body?: string; type?: IssueType }>({
    mutationFn: (data) => issuesService.analyze(owner, repo, data),
  });
}

export function useSimilarIssues(owner: string, repo: string, query: string) {
  return useQuery({
    queryKey: ['issues-similar', owner, repo, query],
    queryFn: () => issuesService.similar(owner, repo, query),
    enabled: !!owner && !!repo && query.length >= 3,
  });
}

export function useIssuesTriage(owner: string, repo: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['issues-triage', owner, repo, params],
    queryFn: () => issuesService.triage(owner, repo, params),
    enabled: !!owner && !!repo,
  });
}

export function useIssuesKanban(owner: string, repo: string) {
  return useQuery({
    queryKey: ['issues-kanban', owner, repo],
    queryFn: () => issuesService.kanban(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useCloseIssueWithReason(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { status: string; closeReason: string; closeReasonNote?: string }) =>
      issuesService.update(owner, repo, number, data as Partial<import('@/types').Issue>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', owner, repo, number] });
      queryClient.invalidateQueries({ queryKey: ['issues', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['issues-kanban', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['issues-triage', owner, repo] });
    },
  });
}
