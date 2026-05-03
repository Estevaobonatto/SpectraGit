import { api } from './api';
import type { Repository } from '@/types';

export interface PlatformStats {
  totalUsers: number;
  totalRepos: number;
  totalPublicRepos: number;
  totalPulses: number;
  totalWatches: number;
  totalIssues: number;
  totalPullRequests: number;
  todayPulses: number;
  todayRepos: number;
}

export interface TopicItem {
  name: string;
  count: number;
}

export interface FeaturedRepo extends Repository {
  pulseCount: number;
  watchCount: number;
  forkCount: number;
  issueCount: number;
}

export const platformService = {
  getStats: () =>
    api.get<{ data: PlatformStats }>('/platform/stats').then((r) => r.data.data),

  getGlobalActivity: (limit = 20) =>
    api.get<{ data: any[] }>('/platform/activity', { params: { limit } }).then((r) => r.data.data),

  getPopularTopics: (limit = 20) =>
    api.get<{ data: TopicItem[] }>('/platform/topics', { params: { limit } }).then((r) => r.data.data),

  getFeatured: (limit = 6) =>
    api.get<{ data: FeaturedRepo[] }>('/platform/featured', { params: { limit } }).then((r) => r.data.data),

  getTrending: (timeframe: 'day' | 'week' | 'month' = 'week', limit = 10) =>
    api.get<{ data: FeaturedRepo[] }>('/platform/trending', { params: { timeframe, limit } }).then((r) => r.data.data),
};
