import { api } from './api';
import type { PullRequest, Comment, Review, DiffFile, ChecklistItem, ContextBlocks, PRDiffStats, PRBlocker, PRTimelineEvent, PrRiskConfig } from '@/types';

export const pullRequestsService = {
  list: (owner: string, repo: string, params?: { status?: string; page?: number; limit?: number; sort?: string; sortOrder?: string; search?: string }) =>
    api
      .get<{ data: { items: PullRequest[]; total: number; page: number; totalPages: number }; meta: unknown }>(`/repos/${owner}/${repo}/pulls`, { params })
      .then((r) => ({ data: r.data.data.items, meta: { total: r.data.data.total } })),

  get: (owner: string, repo: string, number: number) =>
    api.get<{ data: PullRequest }>(`/repos/${owner}/${repo}/pulls/${number}`).then((r) => r.data.data),

  getDiff: (owner: string, repo: string, number: number) =>
    api.get<{ data: DiffFile[] }>(`/repos/${owner}/${repo}/pulls/${number}/diff`).then((r) => r.data.data),

  create: (owner: string, repo: string, data: { title: string; body?: string; sourceBranch: string; targetBranch: string; isDraft?: boolean; checklist?: ChecklistItem[]; contextBlocks?: Partial<ContextBlocks> }) =>
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

  // ─── New endpoints ─────────────────────────────────────────

  getSummary: (owner: string, repo: string, number: number) =>
    api
      .get<{ data: { prNumber: number; title: string; status: string; isDraft: boolean; author: unknown; sourceBranch: string; targetBranch: string; diffStats: PRDiffStats; riskLevel: string; reviewCounts: Record<string, number>; commentCount: number; createdAt: string } }>(`/repos/${owner}/${repo}/pulls/${number}/summary`)
      .then((r) => r.data.data),

  getTimeline: (owner: string, repo: string, number: number) =>
    api
      .get<{ data: PRTimelineEvent[] }>(`/repos/${owner}/${repo}/pulls/${number}/timeline`)
      .then((r) => r.data.data),

  getBlockers: (owner: string, repo: string, number: number) =>
    api
      .get<{ data: PRBlocker[] }>(`/repos/${owner}/${repo}/pulls/${number}/blockers`)
      .then((r) => r.data.data),

  updateChecklist: (owner: string, repo: string, number: number, items: ChecklistItem[]) =>
    api
      .put<{ data: { id: string; checklist: ChecklistItem[] } }>(`/repos/${owner}/${repo}/pulls/${number}/checklist`, { items })
      .then((r) => r.data.data),

  updateContextBlocks: (owner: string, repo: string, number: number, data: Partial<ContextBlocks>) =>
    api
      .put<{ data: { id: string; contextBlocks: ContextBlocks } }>(`/repos/${owner}/${repo}/pulls/${number}/context`, data)
      .then((r) => r.data.data),

  addReviewer: (owner: string, repo: string, number: number, userId: string) =>
    api.post(`/repos/${owner}/${repo}/pulls/${number}/reviewers`, { userId }),

  removeReviewer: (owner: string, repo: string, number: number, userId: string) =>
    api.delete(`/repos/${owner}/${repo}/pulls/${number}/reviewers/${userId}`),

  resolveComment: (owner: string, repo: string, number: number, commentId: string, resolved: boolean) =>
    api
      .patch<{ data: Comment }>(`/repos/${owner}/${repo}/pulls/${number}/comments/${commentId}/resolve`, { resolved })
      .then((r) => r.data.data),

  setLabels: (owner: string, repo: string, number: number, labelIds: string[]) =>
    api.put(`/repos/${owner}/${repo}/pulls/${number}/labels`, { labelIds }),

  addDependency: (owner: string, repo: string, number: number, dependsOnPrNumber: number) =>
    api.post(`/repos/${owner}/${repo}/pulls/${number}/dependencies`, { dependsOnPrNumber }),

  removeDependency: (owner: string, repo: string, number: number, depId: string) =>
    api.delete(`/repos/${owner}/${repo}/pulls/${number}/dependencies/${depId}`),

  getPrRiskConfig: (owner: string, repo: string) =>
    api
      .get<{ data: { prRiskConfig: PrRiskConfig | null } }>(`/repos/${owner}/${repo}/settings/pr-risk-config`)
      .then((r) => r.data.data),

  updatePrRiskConfig: (owner: string, repo: string, config: PrRiskConfig) =>
    api
      .put<{ data: { prRiskConfig: PrRiskConfig } }>(`/repos/${owner}/${repo}/settings/pr-risk-config`, config)
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
