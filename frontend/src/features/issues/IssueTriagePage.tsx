import { useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CircleDot,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useIssuesTriage } from '@/hooks/useIssues';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { IssueTypeBadge } from '@/components/issues/IssueTypeBadge';
import { IssuePriorityBadge } from '@/components/issues/IssuePriorityBadge';
import { cn, formatRelativeTime } from '@/lib/utils';

export default function IssueTriagePage() {
  const { owner, repo } = useParams();
  const { data, isLoading, isError } = useIssuesTriage(owner!, repo!);

  if (isLoading) return <PageLoader />;

  const issues = data?.data ?? [];
  const total = (data?.meta as { total?: number })?.total ?? 0;

  if (isError) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-error opacity-60" />
        <p className="font-medium text-text-primary">Failed to load triage queue</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to={`/${owner}/${repo}/issues`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Triage Queue
            </h1>
            <p className="text-xs text-text-tertiary mt-0.5">
              {total} issue{total !== 1 ? 's' : ''} needing attention
            </p>
          </div>
        </div>
      </div>

      {/* Issue list */}
      {issues.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Triage queue is empty"
          description="All issues have been triaged. Great work!"
        />
      ) : (
        <div className="rounded-[var(--radius-md)] border border-border overflow-hidden">
          <AnimatePresence mode="popLayout">
            {issues.map((issue, index) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: index * 0.03, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className={cn(index > 0 && 'border-t border-border')}
              >
                <Link
                  to={`/${owner}/${repo}/issues/${issue.number}`}
                  className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-hover group"
                >
                  <div className="mt-0.5 shrink-0">
                    {issue.status === 'TRIAGE' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CircleDot className="h-4 w-4 text-success" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                        {issue.title}
                      </span>
                      <Badge
                        variant={issue.status === 'TRIAGE' ? 'warning' : 'success'}
                        className="text-[10px] px-1.5"
                      >
                        {issue.status}
                      </Badge>
                      <IssueTypeBadge type={issue.type} />
                      <IssuePriorityBadge priority={issue.priority} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-text-tertiary">
                      <span className="font-mono">#{issue.number}</span>
                      <span>opened {formatRelativeTime(issue.createdAt)}</span>
                      {issue.author && (
                        <span>
                          by <span className="text-text-secondary">{issue.author.username}</span>
                        </span>
                      )}
                      {issue.assignedArea && (
                        <Badge variant="outline" className="text-[10px]">{issue.assignedArea}</Badge>
                      )}
                    </div>
                  </div>

                  {issue.assignee && (
                    <Avatar src={issue.assignee.avatarUrl} alt={issue.assignee.username} size="sm" />
                  )}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
