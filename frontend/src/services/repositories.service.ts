import { api } from './api';
import type { Repository, FileTreeItem, FileContent, Branch, Commit, CommitDetail, DiffFile, RepoStats, Tag, Release, ReleaseAsset } from '@/types';

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

  fork: (owner: string, repo: string, name?: string) =>
    api.post<{ data: Repository }>(`/repos/${owner}/${repo}/fork`, name ? { name } : {}).then((r) => r.data.data),

  pulse: (owner: string, repo: string) =>
    api.post<{ data: { count: number; isActive: boolean } }>(`/repos/${owner}/${repo}/pulse`).then((r) => r.data.data),

  unpulse: (owner: string, repo: string) =>
    api.delete<{ data: { count: number; isActive: boolean } }>(`/repos/${owner}/${repo}/pulse`).then((r) => r.data.data),

  watch: (owner: string, repo: string) =>
    api.post<{ data: { count: number; isActive: boolean } }>(`/repos/${owner}/${repo}/watch`).then((r) => r.data.data),

  unwatch: (owner: string, repo: string) =>
    api.delete<{ data: { count: number; isActive: boolean } }>(`/repos/${owner}/${repo}/watch`).then((r) => r.data.data),

  getTree: (owner: string, repo: string, branch: string, path?: string) =>
    api
      .get<{ data: FileTreeItem[] }>(`/repos/${owner}/${repo}/tree/${branch}`, { params: { path } })
      .then((r) => r.data.data),

  getBlob: (owner: string, repo: string, branch: string, filePath: string) =>
    api
      .get<{ data: FileContent }>(`/repos/${owner}/${repo}/blob/${branch}/${filePath}`)
      .then((r) => r.data.data),

  getStats: (owner: string, repo: string) =>
    api.get<{ data: RepoStats }>(`/repos/${owner}/${repo}/stats`).then((r) => r.data.data),
};

export const branchesService = {
  list: (owner: string, repo: string) =>
    api.get<{ data: Branch[] }>(`/repos/${owner}/${repo}/branches`).then((r) => r.data.data),

  create: (owner: string, repo: string, data: { name: string; startPoint: string }) =>
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

export const tagsService = {
  list: (owner: string, repo: string) =>
    api.get<{ data: Tag[] }>(`/repos/${owner}/${repo}/tags`).then((r) => r.data.data),

  get: (owner: string, repo: string, tag: string) =>
    api.get<{ data: Tag }>(`/repos/${owner}/${repo}/tags/${tag}`).then((r) => r.data.data),

  create: (owner: string, repo: string, data: { name: string; commitSha: string; message?: string }) =>
    api.post<{ data: Tag }>(`/repos/${owner}/${repo}/tags`, data).then((r) => r.data.data),

  delete: (owner: string, repo: string, tag: string) =>
    api.delete(`/repos/${owner}/${repo}/tags/${tag}`),
};

export const releasesService = {
  list: (owner: string, repo: string) =>
    api.get<{ data: Release[] }>(`/repos/${owner}/${repo}/releases`).then((r) => r.data.data),

  get: (owner: string, repo: string, releaseId: string) =>
    api.get<{ data: Release }>(`/repos/${owner}/${repo}/releases/${releaseId}`).then((r) => r.data.data),

  create: (owner: string, repo: string, data: {
    tagName: string;
    name: string;
    body?: string;
    targetBranch?: string;
    isDraft?: boolean;
    isPrerelease?: boolean;
    commitSha?: string;
    tagMessage?: string;
  }) =>
    api.post<{ data: Release }>(`/repos/${owner}/${repo}/releases`, data).then((r) => r.data.data),

  update: (owner: string, repo: string, releaseId: string, data: {
    name?: string;
    body?: string;
    targetBranch?: string;
    isDraft?: boolean;
    isPrerelease?: boolean;
  }) =>
    api.put<{ data: Release }>(`/repos/${owner}/${repo}/releases/${releaseId}`, data).then((r) => r.data.data),

  delete: (owner: string, repo: string, releaseId: string) =>
    api.delete(`/repos/${owner}/${repo}/releases/${releaseId}`),

  uploadAssets: (owner: string, repo: string, releaseId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return api.post<{ data: ReleaseAsset[] }>(
      `/repos/${owner}/${repo}/releases/${releaseId}/assets`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then((r) => r.data.data);
  },

  getAssetDownloadUrl: (owner: string, repo: string, releaseId: string, assetId: string) =>
    `${api.defaults.baseURL}/repos/${owner}/${repo}/releases/${releaseId}/assets/${assetId}/download`,

  deleteAsset: (owner: string, repo: string, releaseId: string, assetId: string) =>
    api.delete(`/repos/${owner}/${repo}/releases/${releaseId}/assets/${assetId}`),
};
