import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface DashboardData {
  stats: {
    repoCount: number;
    openIssueCount: number;
    openPrCount: number;
    notificationCount: number;
  };
  assignedIssues: Array<{
    id: string;
    number: number;
    title: string;
    status: string;
    priority: string | null;
    createdAt: string;
    repository: {
      slug: string;
      name: string;
      ownerUser?: { username: string } | null;
      ownerOrg?: { name: string } | null;
    };
    author: { username: string; avatarUrl: string | null };
    labels: Array<{ label: { name: string; color: string } }>;
  }>;
  pendingPRs: Array<{
    id: string;
    number: number;
    title: string;
    status: string;
    isDraft: boolean;
    createdAt: string;
    repository: {
      slug: string;
      name: string;
      ownerUser?: { username: string } | null;
      ownerOrg?: { name: string } | null;
    };
    author: { username: string; avatarUrl: string | null };
    reviews: Array<{ status: string }>;
  }>;
  recentRepos: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    visibility: string;
    isFork?: boolean;
    updatedAt: string;
    ownerUser?: { username: string; avatarUrl: string | null } | null;
    ownerOrg?: { name: string; avatarUrl: string | null } | null;
    _count: { issues: number; pullRequests: number };
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    createdAt: string;
    repository: {
      id: string;
      slug: string;
      name: string;
      ownerUser?: { username: string } | null;
      ownerOrg?: { name: string } | null;
    } | null;
  }>;
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<{ data: DashboardData }>('/me/dashboard');
      return data.data;
    },
    staleTime: 30_000,
  });
}
