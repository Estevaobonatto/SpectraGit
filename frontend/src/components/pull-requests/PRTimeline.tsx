import {
  GitMerge,
  GitBranch,
  MessageSquare,
  CheckCircle2,
  XCircle,
  GitCommit,
  Eye,
  UserPlus,
  Tag,
  Clock,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { PageLoader } from '@/components/ui/spinner';
import { usePRTimeline } from '@/hooks/usePullRequests';
import { formatRelativeTime } from '@/lib/utils';
import type { PRTimelineEvent } from '@/types';

const typeIcon = (type: string) => {
  switch (type) {
    case 'OPENED': return <GitBranch className="h-4 w-4 text-success" />;
    case 'MERGED': return <GitMerge className="h-4 w-4 text-purple-500" />;
    case 'CLOSED': return <XCircle className="h-4 w-4 text-error" />;
    case 'COMMENT': return <MessageSquare className="h-4 w-4 text-blue-400" />;
    case 'REVIEW_APPROVED': return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'REVIEW_CHANGES_REQUESTED': return <XCircle className="h-4 w-4 text-error" />;
    case 'REVIEW_COMMENTED': return <Eye className="h-4 w-4 text-text-tertiary" />;
    case 'COMMIT': return <GitCommit className="h-4 w-4 text-text-secondary" />;
    case 'REVIEWER_ADDED': return <UserPlus className="h-4 w-4 text-blue-400" />;
    case 'LABEL_ADDED': return <Tag className="h-4 w-4 text-yellow-400" />;
    default: return <Clock className="h-4 w-4 text-text-tertiary" />;
  }
};

function TimelineItem({ event }: { event: PRTimelineEvent }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-surface-hover flex items-center justify-center border border-border">
          {typeIcon(event.type)}
        </div>
        <div className="flex-1 w-px bg-border mt-1" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          {event.actor && (
            <span className="text-sm font-medium text-text-primary">{event.actor.username}</span>
          )}
          <span className="text-xs text-text-tertiary">{formatRelativeTime(event.timestamp)}</span>
        </div>
        <p className="text-sm text-text-secondary mt-0.5">{event.message}</p>
      </div>
      {event.actor?.avatarUrl && (
        <Avatar src={event.actor.avatarUrl} alt={event.actor.username ?? ''} size="sm" className="flex-shrink-0" />
      )}
    </div>
  );
}

interface PRTimelineProps {
  owner: string;
  repo: string;
  prNumber: number;
}

export function PRTimeline({ owner, repo, prNumber }: PRTimelineProps) {
  const { data, isLoading } = usePRTimeline(owner, repo, prNumber);

  if (isLoading) return <PageLoader />;

  const events: PRTimelineEvent[] = data ?? [];

  if (events.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface-hover p-8 text-center">
        <Clock className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
        <p className="text-sm text-text-tertiary">No timeline events yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {events.map((event, i) => (
        <TimelineItem key={i} event={event} />
      ))}
    </div>
  );
}
