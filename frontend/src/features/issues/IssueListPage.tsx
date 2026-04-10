import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CircleDot, CircleCheck, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useIssues } from '@/hooks/useIssues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { cn, formatRelativeTime } from '@/lib/utils';

export default function IssueListPage() {
  const { owner, repo } = useParams();
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useIssues(owner!, repo!, { status: statusFilter });

  if (isLoading) return <PageLoader />;

  const issues = (data?.data ?? []).filter((i) =>
    i.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('OPEN')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-colors cursor-pointer',
              statusFilter === 'OPEN' ? 'bg-primary-50 text-primary-700' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <CircleDot className="h-4 w-4" />
            Open
          </button>
          <button
            onClick={() => setStatusFilter('CLOSED')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-colors cursor-pointer',
              statusFilter === 'CLOSED' ? 'bg-primary-50 text-primary-700' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <CircleCheck className="h-4 w-4" />
            Closed
          </button>
        </div>
        <Button size="sm" asChild>
          <Link to={`/${owner}/${repo}/issues/new`}>
            <Plus className="h-4 w-4" />
            New issue
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search issues..."
          className="pl-9"
        />
      </div>

      {issues.length === 0 ? (
        <EmptyState
          icon={CircleDot}
          title={`No ${statusFilter.toLowerCase()} issues`}
          description={statusFilter === 'OPEN' ? 'Great work! There are no open issues.' : 'No closed issues yet.'}
        />
      ) : (
        <div className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
          {issues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Link
                to={`/${owner}/${repo}/issues/${issue.number}`}
                className="flex items-start gap-3 p-4 transition-colors hover:bg-surface-hover"
              >
              {issue.status === 'OPEN' ? (
                <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : (
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-text-primary hover:text-primary-600">
                    {issue.title}
                  </span>
                  {issue.labels?.map((label) => (
                    <Badge
                      key={label.id}
                      className="text-[10px]"
                      style={{ backgroundColor: label.color + '20', color: label.color, borderColor: label.color + '40' }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
                  <span>#{issue.number}</span>
                  <span>opened {formatRelativeTime(issue.createdAt)}</span>
                  {issue.author && <span>by {issue.author.username}</span>}
                </div>
              </div>
              {issue.assignee && (
                <Avatar src={issue.assignee.avatarUrl} alt={issue.assignee.username} size="sm" />
              )}
            </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
