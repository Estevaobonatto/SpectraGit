import { api } from './api';
import type { Issue, Comment, IssueAnalysis, IssueType } from '@/types';

export const issuesService = {
  list: (owner: string, repo: string, params?: Record<string, unknown>) =>
    api
      .get<{ data: { items: Issue[]; total: number; page: number; totalPages: number }; meta: unknown }>(`/repos/${owner}/${repo}/issues`, { params })
      .then((r) => ({ data: r.data.data.items, meta: { total: r.data.data.total } })),

  get: (owner: string, repo: string, number: number) =>
    api.get<{ data: Issue }>(`/repos/${owner}/${repo}/issues/${number}`).then((r) => r.data.data),

  create: (
    owner: string,
    repo: string,
    data: {
      title: string;
      body?: string;
      type?: IssueType;
      priority?: string;
      assigneeId?: string;
      labelIds?: string[];
      techContext?: Record<string, unknown>;
      formData?: Record<string, unknown>;
    },
  ) => api.post<{ data: Issue }>(`/repos/${owner}/${repo}/issues`, data).then((r) => r.data.data),

  update: (owner: string, repo: string, number: number, data: Partial<Issue>) =>
    api.put<{ data: Issue }>(`/repos/${owner}/${repo}/issues/${number}`, data).then((r) => r.data.data),

  addComment: (owner: string, repo: string, number: number, body: string) =>
    api
      .post<{ data: Comment }>(`/repos/${owner}/${repo}/issues/${number}/comments`, { body })
      .then((r) => r.data.data),

  analyze: (owner: string, repo: string, data: { title: string; body?: string; type?: IssueType }) =>
    api.post<{ data: IssueAnalysis }>(`/repos/${owner}/${repo}/issues/analyze`, data).then((r) => r.data.data),

  similar: (owner: string, repo: string, q: string) =>
    api.get<{ data: { id: string; number: number; title: string; status: string; score: number }[] }>(
      `/repos/${owner}/${repo}/issues/similar`,
      { params: { q } },
    ).then((r) => r.data.data),

  triage: (owner: string, repo: string, params?: Record<string, unknown>) =>
    api
      .get<{ data: { items: Issue[]; total: number; page: number; totalPages: number }; meta: unknown }>(`/repos/${owner}/${repo}/issues/triage`, { params })
      .then((r) => ({ data: r.data.data.items, meta: { total: r.data.data.total } })),

  kanban: (owner: string, repo: string) =>
    api.get<{ data: Record<string, Issue[]> }>(`/repos/${owner}/${repo}/issues/kanban`).then((r) => r.data.data),
};
