import { api } from './api';
import type { GitHubRepo, GitHubPermissions, ImportJobResponse, ImportJobStatusResponse } from '@/types';

export const integrationsService = {
  getGitHubProfile: () =>
    api.get<{ data: Record<string, unknown> }>('/integrations/github/profile').then((r) => r.data.data),

  checkPermissions: (): Promise<GitHubPermissions> =>
    api.get<{ data: GitHubPermissions }>('/integrations/github/permissions').then((r) => r.data.data),

  listGitHubRepos: () =>
    api.get<{ data: GitHubRepo[] }>('/integrations/github/repos').then((r) => r.data.data),

  importRepo: (fullName: string): Promise<ImportJobResponse> => {
    const [owner, repo] = fullName.split('/');
    return api.post<{ data: ImportJobResponse }>(`/integrations/github/repos/${owner}/${repo}/import`).then((r) => r.data.data);
  },

  getImportStatus: (jobId: string): Promise<ImportJobStatusResponse> =>
    api.get<{ data: ImportJobStatusResponse }>(`/integrations/github/import/${jobId}/status`).then((r) => r.data.data),

  syncRepo: (fullName: string) => {
    const [owner, repo] = fullName.split('/');
    return api.get(`/integrations/github/repos/${owner}/${repo}/sync`);
  },
};
