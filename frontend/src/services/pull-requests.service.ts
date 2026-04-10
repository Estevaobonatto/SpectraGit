import { api } from './api';
import type { PullRequest, Comment, Review, DiffFile } from '@/types';

export const pullRequestsService = {
  list: (owner: string, repo: string, params?: { status?: string; page?: number; limit?: number }) =>
    api
      .get<{ data: { items: PullRequest[]; total: number; page: number; totalPages: number }; meta: unknown }>(`/repos/${owner}/${repo}/pulls`, { params })
      .then((r) => ({ data: r.data.data.items, meta: { total: r.data.data.total } })),

  get: (owner: string, repo: string, number: number) =>
    api.get<{ data: PullRequest }>(`/repos/${owner}/${repo}/pulls/${number}`).then((r) => r.data.data),

  getDiff: (owner: string, repo: string, number: number) =>
    api.get<{ data: DiffFile[] }>(`/repos/${owner}/${repo}/pulls/${number}/diff`).then((r) => r.data.data),

  create: (owner: string, repo: string, data: { title: string; body?: string; sourceBranch: string; targetBranch: string }) =>
    api.post<{ data: PullRequest }>(`/repos/${owner}/${repo}/pulls`, data).then((r) => r.data.data),

  update: (owner: string, repo: string, number: number, data: Partial<PullRequest>) =>
    api.put<{ data: PullRequest }>(`/repos/${owner}/${repo}/pulls/${number}`, data).then((r) => r.data.data),

  close: (owner: string, repo: string, number: number) =>
    api.post(`/repos/${owner}/${repo}/pulls/${number}/close`),

  merge: (owner: string, repo: string, number: number, strategy?: string) =>
    api.post(`/repos/${owner}/${repo}/pulls/${number}/merge`, { strategy }),

  addComment: (owner: string, repo: string, number: number, body: string) =>
    api
      .post<{ data: Comment }>(`/repos/${owner}/${repo}/pulls/${number}/comments`, { body })
      .then((r) => r.data.data),
};

export const reviewsService = {
  list: (owner: string, repo: string, number: number) =>
    api
      .get<{ data: Review[] }>(`/repos/${owner}/${repo}/pulls/${number}/reviews`)
      .then((r) => r.data.data),

  submit: (owner: string, repo: string, number: number, data: { status: string; body?: string }) =>
    api
      .post<{ data: Review }>(`/repos/${owner}/${repo}/pulls/${number}/reviews`, data)
      .then((r) => r.data.data),

  addInlineComment: (
    owner: string,
    repo: string,
    number: number,
    reviewId: string,
    data: { body: string; filePath: string; lineNumber: number },
  ) =>
    api
      .post<{ data: Comment }>(`/repos/${owner}/${repo}/pulls/${number}/reviews/${reviewId}/comments`, data)
      .then((r) => r.data.data),
};
