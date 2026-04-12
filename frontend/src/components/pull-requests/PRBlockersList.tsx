import { AlertTriangle, XCircle, Clock, GitBranch } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { PageLoader } from '@/components/ui/spinner';
import { usePRBlockers } from '@/hooks/usePullRequests';
import { AnimatedList } from '@/components/animate-ui/animated-list';
import type { PRBlocker } from '@/types';

const blockerConfig: Record<PRBlocker['type'], { icon: React.ReactNode; variant: 'error' | 'warning' | 'info' }> = {
  CONFLICT: {
    icon: <XCircle className="h-4 w-4" />,
    variant: 'error',
  },
  CHANGES_REQUESTED: {
    icon: <AlertTriangle className="h-4 w-4" />,
    variant: 'warning',
  },
  REVIEW_PENDING: {
    icon: <Clock className="h-4 w-4" />,
    variant: 'info',
  },
  DRAFT: {
    icon: <GitBranch className="h-4 w-4" />,
    variant: 'info',
  },
};

interface PRBlockersListProps {
  owner: string;
  repo: string;
  prNumber: number;
}

export function PRBlockersList({ owner, repo, prNumber }: PRBlockersListProps) {
  const { data, isLoading } = usePRBlockers(owner, repo, prNumber);

  if (isLoading) return <PageLoader />;

  const blockers: PRBlocker[] = data ?? [];
  if (blockers.length === 0) return null;

  return (
    <AnimatedList className="space-y-2" staggerDelay={0.06} duration={0.3}>
      {blockers.map((blocker, i) => {
        const { icon, variant } = blockerConfig[blocker.type] ?? { icon: <AlertTriangle className="h-4 w-4" />, variant: 'warning' as const };
        return (
          <Alert key={i} variant={variant} className="flex items-center gap-2 py-2.5">
            {icon}
            <span className="text-sm">{blocker.message}</span>
          </Alert>
        );
      })}
    </AnimatedList>
  );
}
