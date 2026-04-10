import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesService } from '@/services/issues.service';

export function useIssues(owner: string, repo: string, params?: { status?: string; page?: number; limit?: number }) {
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
    mutationFn: (data: { title: string; body?: string; assigneeId?: string; labelIds?: string[] }) =>
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

export function useAddIssueComment(owner: string, repo: string, number: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => issuesService.addComment(owner, repo, number, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', owner, repo, number] });
    },
  });
}
