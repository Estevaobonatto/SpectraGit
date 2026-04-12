import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { AnimatedList } from '@/components/animate-ui/animated-list';
import type { PullRequestReviewer, Review } from '@/types';

interface PRApprovalStatusProps {
  requestedReviewers: PullRequestReviewer[];
  reviews: Review[];
}

export function PRApprovalStatus({ requestedReviewers, reviews }: PRApprovalStatusProps) {
  const latestByUser = reviews.reduce<Record<string, Review>>((acc, r) => {
    const uid = r.reviewerId ?? r.authorId;
    if (!acc[uid] || new Date(r.createdAt) > new Date(acc[uid].createdAt)) {
      acc[uid] = r;
    }
    return acc;
  }, {});

  const approvedCount = Object.values(latestByUser).filter(r => r.status === 'APPROVED').length;
  const totalRequested = requestedReviewers.length;

  const statusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'CHANGES_REQUESTED':
        return <XCircle className="h-4 w-4 text-error" />;
      default:
        return <Clock className="h-4 w-4 text-text-tertiary" />;
    }
  };

  if (requestedReviewers.length === 0 && Object.keys(latestByUser).length === 0) {
    return (
      <p className="text-xs text-text-tertiary">No reviewers assigned.</p>
    );
  }

  return (
    <div className="space-y-2">
      {totalRequested > 0 && (
        <p className="text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">{approvedCount}</span>
          {' '}of{' '}
          <span className="font-semibold text-text-primary">{totalRequested}</span>
          {' '}approved
        </p>
      )}

      <AnimatedList className="space-y-1.5" staggerDelay={0.05} duration={0.25}>
        {requestedReviewers.map(reviewer => {
          const review = latestByUser[reviewer.userId];
          return (
            <div key={reviewer.id} className="flex items-center gap-2">
              <Avatar
                src={reviewer.user.avatarUrl}
                alt={reviewer.user.username}
                size="sm"
              />
              <span className="flex-1 text-sm text-text-primary">{reviewer.user.username}</span>
              {review ? (
                statusIcon(review.status)
              ) : (
                <Clock className="h-4 w-4 text-text-tertiary" />
              )}
              {review && (
                <span className="text-[11px] text-text-tertiary capitalize">
                  {review.status.toLowerCase().replace(/_/g, ' ')}
                </span>
              )}
            </div>
          );
        })}
      </AnimatedList>
    </div>
  );
}
