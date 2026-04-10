import { api } from './api';
import type { Issue, Comment } from '@/types';

export const issuesService = {
  list: (owner: string, repo: string, params?: { status?: string; page?: number; limit?: number }) =>
    api
      .get<{ data: Issue[]; meta: { total: number } }>(`/repos/${owner}/${repo}/issues`, { params })
      .then((r) => r.data),

  get: (owner: string, repo: string, number: number) =>
    api.get<{ data: Issue }>(`/repos/${owner}/${repo}/issues/${number}`).then((r) => r.data.data),

  create: (
    owner: string,
    repo: string,
    data: { title: string; body?: string; assigneeId?: string; labelIds?: string[] },
  ) => api.post<{ data: Issue }>(`/repos/${owner}/${repo}/issues`, data).then((r) => r.data.data),

  update: (owner: string, repo: string, number: number, data: Partial<Issue>) =>
    api.put<{ data: Issue }>(`/repos/${owner}/${repo}/issues/${number}`, data).then((r) => r.data.data),

  addComment: (owner: string, repo: string, number: number, body: string) =>
    api
      .post<{ data: Comment }>(`/repos/${owner}/${repo}/issues/${number}/comments`, { body })
      .then((r) => r.data.data),
};
