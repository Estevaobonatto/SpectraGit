import { api } from './api';
import type { GitHubRepo } from '@/types';

export const integrationsService = {
  getGitHubProfile: () =>
    api.get<{ data: Record<string, unknown> }>('/integrations/github/profile').then((r) => r.data.data),

  listGitHubRepos: () =>
    api.get<{ data: GitHubRepo[] }>('/integrations/github/repos').then((r) => r.data.data),

  importRepo: (fullName: string) =>
    api.post(`/integrations/github/repos/${fullName}/import`),

  syncRepo: (fullName: string) =>
    api.get(`/integrations/github/repos/${fullName}/sync`),
};
