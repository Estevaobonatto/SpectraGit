import { useParams } from 'react-router-dom';
import { useRepoActivity } from '@/hooks/useActivity';
import type { ActivityEvent } from '@/services/activity.service';
import { formatRelativeTime } from '@/lib/utils';
import { InlineLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  GitCommit,
  GitBranch,
  Tag,
  FolderGit2,
  GitFork,
  Activity,
} from 'lucide-react';
import { motion } from 'motion/react';

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  PUSH: { icon: GitCommit, label: 'pushed to', color: 'text-blue-500' },
  BRANCH_CREATED: { icon: GitBranch, label: 'created branch', color: 'text-green-500' },
  BRANCH_DELETED: { icon: GitBranch, label: 'deleted branch', color: 'text-red-500' },
  TAG_CREATED: { icon: Tag, label: 'created tag', color: 'text-purple-500' },
  TAG_DELETED: { icon: Tag, label: 'deleted tag', color: 'text-red-400' },
  REPO_CREATED: { icon: FolderGit2, label: 'created repository', color: 'text-green-500' },
  REPO_FORKED: { icon: GitFork, label: 'forked repository', color: 'text-amber-500' },
};

function getTypeInfo(type: string) {
  return typeConfig[type] ?? { icon: Activity, label: type.toLowerCase().replace(/_/g, ' '), color: 'text-text-secondary' };
}

function formatRef(ref: string | null) {
  if (!ref) return null;
  return ref.replace(/^refs\/heads\//, '').replace(/^refs\/tags\//, '');
}

function EventRow({ event }: { event: ActivityEvent }) {
  const info = getTypeInfo(event.type);
  const Icon = info.icon;
  const refName = formatRef(event.ref);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 px-4 py-3"
    >
      <div className={`mt-0.5 rounded-full p-1.5 bg-surface-hover ${info.color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{event.actor.displayName ?? event.actor.username}</span>
          {' '}
          <span className="text-text-secondary">{info.label}</span>
          {refName && (
            <>
              {' '}
              <code className="rounded bg-surface-hover px-1.5 py-0.5 text-xs font-mono text-primary-600">
                {refName}
              </code>
            </>
          )}
        </p>
        {event.type === 'PUSH' && event.beforeSha && event.afterSha && (
          <p className="mt-0.5 text-xs text-text-tertiary font-mono">
            {event.beforeSha.slice(0, 7)}..{event.afterSha.slice(0, 7)}
          </p>
        )}
      </div>
      <span className="shrink-0 text-xs text-text-tertiary">
        {formatRelativeTime(event.createdAt)}
      </span>
    </motion.div>
  );
}

export default function ActivityFeedPage() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { data, isLoading } = useRepoActivity(owner!, repo!);

  if (isLoading) return <InlineLoader text="Loading activity..." />;

  if (!data?.items?.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="Activity will appear here when commits are pushed, branches created, and other Git operations are performed."
      />
    );
  }

  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold mb-4 px-4">Activity</h2>
      <div className="divide-y divide-border rounded-[var(--radius-md)] border border-border bg-surface">
        {data.items.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
