import { api } from './api';
import type { GitHubRepo } from '@/types';

export const integrationsService = {
  getGitHubProfile: () =>
    api.get<{ data: Record<string, unknown> }>('/integrations/github/profile').then((r) => r.data.data),

  listGitHubRepos: () =>
    api.get<{ data: GitHubRepo[] }>('/integrations/github/repos').then((r) => r.data.data),

  importRepo: (fullName: string) => {
    const [owner, repo] = fullName.split('/');
    return api.post(`/integrations/github/repos/${owner}/${repo}/import`);
  },

  syncRepo: (fullName: string) => {
    const [owner, repo] = fullName.split('/');
    return api.get(`/integrations/github/repos/${owner}/${repo}/sync`);
  },
};
