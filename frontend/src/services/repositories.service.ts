import { api } from './api';
import type { Repository, FileTreeItem, FileContent, Branch, Commit, CommitDetail, DiffFile } from '@/types';

export const repositoriesService = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: { items: Repository[]; total: number; page: number; limit: number; totalPages: number }; meta: unknown }>('/repos', { params })
      .then((r) => ({ data: r.data.data.items, meta: { total: r.data.data.total, page: r.data.data.page, totalPages: r.data.data.totalPages } })),

  get: (owner: string, repo: string) =>
    api.get<{ data: Repository }>(`/repos/${owner}/${repo}`).then((r) => r.data.data),

  create: (data: {
    name: string;
    description?: string;
    visibility?: 'PUBLIC' | 'PRIVATE';
    defaultBranch?: string;
    initWithReadme?: boolean;
    orgId?: string;
  }) => api.post<{ data: Repository }>('/repos', data).then((r) => r.data.data),

  update: (owner: string, repo: string, data: Partial<Repository>) =>
    api.put<{ data: Repository }>(`/repos/${owner}/${repo}`, data).then((r) => r.data.data),

  delete: (owner: string, repo: string) => api.delete(`/repos/${owner}/${repo}`),

  fork: (owner: string, repo: string) =>
    api.post<{ data: Repository }>(`/repos/${owner}/${repo}/fork`).then((r) => r.data.data),

  getTree: (owner: string, repo: string, branch: string, path?: string) =>
    api
      .get<{ data: FileTreeItem[] }>(`/repos/${owner}/${repo}/tree/${branch}`, { params: { path } })
      .then((r) => r.data.data),

  getBlob: (owner: string, repo: string, branch: string, filePath: string) =>
    api
      .get<{ data: FileContent }>(`/repos/${owner}/${repo}/blob/${branch}/${filePath}`)
      .then((r) => r.data.data),
};

export const branchesService = {
  list: (owner: string, repo: string) =>
    api.get<{ data: Branch[] }>(`/repos/${owner}/${repo}/branches`).then((r) => r.data.data),

  create: (owner: string, repo: string, data: { name: string; sourceBranch?: string }) =>
    api.post<{ data: Branch }>(`/repos/${owner}/${repo}/branches`, data).then((r) => r.data.data),

  delete: (owner: string, repo: string, branch: string) =>
    api.delete(`/repos/${owner}/${repo}/branches/${branch}`),
};

export const commitsService = {
  list: (owner: string, repo: string, params?: { branch?: string; limit?: number; offset?: number }) =>
    api.get<{ data: Commit[] }>(`/repos/${owner}/${repo}/commits`, { params }).then((r) => r.data.data),

  get: (owner: string, repo: string, sha: string) =>
    api.get<{ data: CommitDetail }>(`/repos/${owner}/${repo}/commits/${sha}`).then((r) => r.data.data),

  getDiff: (owner: string, repo: string, sha: string) =>
    api.get<{ data: DiffFile[] }>(`/repos/${owner}/${repo}/commits/${sha}/diff`).then((r) => r.data.data),

  compare: (owner: string, repo: string, base: string, head: string) =>
    api
      .get<{ data: { commits: Commit[]; diff: DiffFile[] } }>(`/repos/${owner}/${repo}/compare/${base}...${head}`)
      .then((r) => r.data.data),
};
