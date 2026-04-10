import { api } from './api';

export interface ActivityEvent {
  id: string;
  repositoryId: string | null;
  actorId: string;
  type: string;
  ref: string | null;
  beforeSha: string | null;
  afterSha: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  repository?: {
    id: string;
    slug: string;
    name: string;
    ownerUser?: { username: string } | null;
    ownerOrg?: { name: string } | null;
  } | null;
}

export const activityService = {
  listForRepo: async (
    owner: string,
    repo: string,
    limit = 30,
    offset = 0,
  ): Promise<{ items: ActivityEvent[]; total: number }> => {
    const { data } = await api.get(`/repos/${owner}/${repo}/activity`, {
      params: { limit, offset },
    });
    return data.data ?? data;
  },

  listForUser: async (
    username: string,
    limit = 30,
    offset = 0,
  ): Promise<{ items: ActivityEvent[]; total: number }> => {
    const { data } = await api.get(`/users/${username}/activity`, {
      params: { limit, offset },
    });
    return data.data ?? data;
  },
};
