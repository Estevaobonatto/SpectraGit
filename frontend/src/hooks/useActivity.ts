import { useQuery } from '@tanstack/react-query';
import { activityService } from '@/services/activity.service';

export function useRepoActivity(owner: string, repo: string, limit = 30) {
  return useQuery({
    queryKey: ['activity', 'repo', owner, repo, limit],
    queryFn: () => activityService.listForRepo(owner, repo, limit),
    staleTime: 30_000,
  });
}

export function useUserActivity(username: string, limit = 30) {
  return useQuery({
    queryKey: ['activity', 'user', username, limit],
    queryFn: () => activityService.listForUser(username, limit),
    staleTime: 30_000,
  });
}
