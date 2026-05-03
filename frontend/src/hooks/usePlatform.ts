import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platform.service';

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: () => platformService.getStats(),
    staleTime: 60_000,
  });
}

export function useGlobalActivity(limit = 20) {
  return useQuery({
    queryKey: ['platform', 'activity', limit],
    queryFn: () => platformService.getGlobalActivity(limit),
    staleTime: 30_000,
  });
}

export function usePopularTopics(limit = 20) {
  return useQuery({
    queryKey: ['platform', 'topics', limit],
    queryFn: () => platformService.getPopularTopics(limit),
    staleTime: 300_000,
  });
}

export function useFeaturedRepos(limit = 6) {
  return useQuery({
    queryKey: ['platform', 'featured', limit],
    queryFn: () => platformService.getFeatured(limit),
    staleTime: 300_000,
  });
}

export function useTrendingRepos(timeframe: 'day' | 'week' | 'month' = 'week', limit = 10) {
  return useQuery({
    queryKey: ['platform', 'trending', timeframe, limit],
    queryFn: () => platformService.getTrending(timeframe, limit),
    staleTime: 60_000,
  });
}
