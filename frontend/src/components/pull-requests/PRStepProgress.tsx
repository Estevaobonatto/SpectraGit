import { cn } from '@/lib/utils';
import type { PullRequest, Review } from '@/types';

type PRStep =
  | 'open'
  | 'in-review'
  | 'changes-requested'
  | 'approved'
  | 'ready-to-merge'
  | 'closed';

const STEPS: { key: PRStep; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'in-review', label: 'In Review' },
  { key: 'changes-requested', label: 'Changes Requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'ready-to-merge', label: 'Ready to Merge' },
  { key: 'closed', label: 'Merged / Closed' },
];

const STEP_ORDER: PRStep[] = ['open', 'in-review', 'changes-requested', 'approved', 'ready-to-merge', 'closed'];

export function computePRStep(pr: PullRequest, reviews: Review[]): PRStep {
  if (pr.status === 'MERGED' || pr.status === 'CLOSED') return 'closed';

  const hasChangesRequested = reviews.some(r => r.status === 'CHANGES_REQUESTED');
  if (hasChangesRequested) return 'changes-requested';

  const hasApproval = reviews.some(r => r.status === 'APPROVED');
  if (hasApproval) {
    const hasNoBlockers = !hasChangesRequested;
    return hasNoBlockers ? 'ready-to-merge' : 'approved';
  }

  if (reviews.length > 0) return 'in-review';

  if (pr.isDraft) return 'open';

  return pr.requestedReviewers && pr.requestedReviewers.length > 0 ? 'in-review' : 'open';
}

interface PRStepProgressProps {
  pr: PullRequest;
  reviews: Review[];
  className?: string;
}

export function PRStepProgress({ pr, reviews, className }: PRStepProgressProps) {
  const currentStep = computePRStep(pr, reviews);
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const isClosed = pr.status === 'CLOSED';
  const isMerged = pr.status === 'MERGED';

  return (
    <div className={cn('flex items-center gap-0', className)}>
      {STEPS.map((step, i) => {
        const stepIndex = STEP_ORDER.indexOf(step.key);
        const isCompleted = stepIndex < currentIndex;
        const isActive = stepIndex === currentIndex;
        const isLast = i === STEPS.length - 1;

        const dotColor = isActive
          ? isMerged
            ? 'bg-purple-500 ring-2 ring-purple-200'
            : isClosed
              ? 'bg-gray-400 ring-2 ring-gray-200'
              : 'bg-success ring-2 ring-success/20'
          : isCompleted
            ? 'bg-success'
            : 'bg-surface-hover border border-border';

        const lineColor = isCompleted ? 'bg-success' : 'bg-border';

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={cn('h-3 w-3 rounded-full flex-shrink-0 transition-all', dotColor)} />
              <span
                className={cn(
                  'text-[10px] leading-tight text-center whitespace-nowrap',
                  isActive ? 'text-text-primary font-semibold' : isCompleted ? 'text-success' : 'text-text-tertiary',
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={cn('h-0.5 flex-1 mx-1 mt-[-14px] transition-all', lineColor)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
