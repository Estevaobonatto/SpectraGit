import { api } from './api';
import type {
  GitHubRepo,
  GitHubPermissions,
  ImportJobResponse,
  ImportJobStatusResponse,
  SyncStatusResponse,
  RateLimitStatus,
  TokenHealth,
  WebhookEventItem,
  MirrorResponse,
} from '@/types';

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
    return api.post<{ data: { jobId: string; message: string } }>(`/integrations/github/repos/${owner}/${repo}/sync`).then((r) => r.data.data);
  },

  syncIncremental: (fullName: string) => {
    const [owner, repo] = fullName.split('/');
    return api.post<{ data: { success: boolean; syncedResources: string[]; errors: string[] } }>(`/integrations/github/repos/${owner}/${repo}/sync/incremental`).then((r) => r.data.data);
  },

  getSyncStatus: (fullName: string): Promise<SyncStatusResponse> => {
    const [owner, repo] = fullName.split('/');
    return api.get<{ data: SyncStatusResponse }>(`/integrations/github/repos/${owner}/${repo}/sync/status`).then((r) => r.data.data);
  },

  getRateLimit: (): Promise<RateLimitStatus> =>
    api.get<{ data: RateLimitStatus }>('/integrations/github/rate-limit').then((r) => r.data.data),

  checkTokenHealth: (): Promise<TokenHealth> =>
    api.get<{ data: TokenHealth }>('/integrations/github/token-health').then((r) => r.data.data),

  listWebhookEvents: (): Promise<WebhookEventItem[]> =>
    api.get<{ data: WebhookEventItem[] }>('/integrations/github/webhook/events').then((r) => r.data.data),

  mirrorIssue: (issueId: string): Promise<MirrorResponse> =>
    api.post<{ data: MirrorResponse }>(`/integrations/github/mirror/issues/${issueId}`).then((r) => r.data.data),

  mirrorPR: (prId: string): Promise<MirrorResponse> =>
    api.post<{ data: MirrorResponse }>(`/integrations/github/mirror/pull-requests/${prId}`).then((r) => r.data.data),

  mirrorComment: (commentId: string): Promise<MirrorResponse> =>
    api.post<{ data: MirrorResponse }>(`/integrations/github/mirror/comments/${commentId}`).then((r) => r.data.data),

  mirrorRelease: (releaseId: string): Promise<MirrorResponse> =>
    api.post<{ data: MirrorResponse }>(`/integrations/github/mirror/releases/${releaseId}`).then((r) => r.data.data),

  mirrorLabel: (labelId: string): Promise<MirrorResponse> =>
    api.post<{ data: MirrorResponse }>(`/integrations/github/mirror/labels/${labelId}`).then((r) => r.data.data),

  mirrorMilestone: (milestoneId: string): Promise<MirrorResponse> =>
    api.post<{ data: MirrorResponse }>(`/integrations/github/mirror/milestones/${milestoneId}`).then((r) => r.data.data),
};
