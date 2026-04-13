import { api } from './api';
import type { WikiSettings, WikiPage, WikiPageVersion, WikiComment, WikiSourceMode } from '@/types';

export const wikiService = {
  // Settings
  getSettings: (owner: string, repo: string) =>
    api.get<{ data: WikiSettings }>(`/repos/${owner}/${repo}/wiki/settings`).then((r) => r.data.data),

  updateSettings: (owner: string, repo: string, data: {
    sourceMode?: WikiSourceMode;
    sourceBranch?: string;
    sourceRoot?: string;
    homePage?: string;
    allowComments?: boolean;
    allowAttachments?: boolean;
  }) =>
    api.put<{ data: WikiSettings }>(`/repos/${owner}/${repo}/wiki/settings`, data).then((r) => r.data.data),

  // Pages
  listPages: (owner: string, repo: string) =>
    api.get<{ data: WikiPage[] }>(`/repos/${owner}/${repo}/wiki/pages`).then((r) => r.data.data),

  getPage: (owner: string, repo: string, slug: string) =>
    api.get<{ data: WikiPage }>(`/repos/${owner}/${repo}/wiki/pages/${slug}`).then((r) => r.data.data),

  createPage: (owner: string, repo: string, data: {
    title: string;
    body: string;
    parentId?: string;
    sortOrder?: number;
    message?: string;
  }) =>
    api.post<{ data: WikiPage }>(`/repos/${owner}/${repo}/wiki/pages`, data).then((r) => r.data.data),

  updatePage: (owner: string, repo: string, slug: string, data: {
    title?: string;
    body?: string;
    parentId?: string;
    sortOrder?: number;
    message?: string;
  }) =>
    api.put<{ data: WikiPage }>(`/repos/${owner}/${repo}/wiki/pages/${slug}`, data).then((r) => r.data.data),

  deletePage: (owner: string, repo: string, slug: string) =>
    api.delete(`/repos/${owner}/${repo}/wiki/pages/${slug}`),

  // Versions
  listVersions: (owner: string, repo: string, slug: string) =>
    api.get<{ data: WikiPageVersion[] }>(`/repos/${owner}/${repo}/wiki/pages/${slug}/versions`).then((r) => r.data.data),

  getVersion: (owner: string, repo: string, slug: string, version: number) =>
    api.get<{ data: WikiPageVersion }>(`/repos/${owner}/${repo}/wiki/pages/${slug}/versions/${version}`).then((r) => r.data.data),

  restoreVersion: (owner: string, repo: string, slug: string, version: number) =>
    api.post<{ data: WikiPage }>(`/repos/${owner}/${repo}/wiki/pages/${slug}/versions/${version}/restore`).then((r) => r.data.data),

  // Comments
  listComments: (owner: string, repo: string, slug: string) =>
    api.get<{ data: WikiComment[] }>(`/repos/${owner}/${repo}/wiki/pages/${slug}/comments`).then((r) => r.data.data),

  createComment: (owner: string, repo: string, slug: string, data: { body: string }) =>
    api.post<{ data: WikiComment }>(`/repos/${owner}/${repo}/wiki/pages/${slug}/comments`, data).then((r) => r.data.data),

  deleteComment: (owner: string, repo: string, commentId: string) =>
    api.delete(`/repos/${owner}/${repo}/wiki/comments/${commentId}`),
};
