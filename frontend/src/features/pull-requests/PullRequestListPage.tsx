import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GitPullRequest, GitMerge, Search, Plus } from 'lucide-react';
import { usePullRequests } from '@/hooks/usePullRequests';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { cn, formatRelativeTime } from '@/lib/utils';
import { motion } from 'motion/react';

const statusIcons = {
  OPEN: <GitPullRequest className="h-4 w-4 text-success" />,
  MERGED: <GitMerge className="h-4 w-4 text-primary-500" />,
  CLOSED: <GitPullRequest className="h-4 w-4 text-error" />,
};

export default function PullRequestListPage() {
  const { owner, repo } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED' | 'MERGED'>('OPEN');
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePullRequests(owner!, repo!, { status: statusFilter });

  if (isLoading) return <PageLoader />;

  const prs = (data?.data ?? []).filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(['OPEN', 'MERGED', 'CLOSED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-colors cursor-pointer',
                statusFilter === s ? 'bg-primary-50 text-primary-700' : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {statusIcons[s]}
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {isAuthenticated && <Button size="sm" asChild>
          <Link to={`/${owner}/${repo}/pulls/new`}>
            <Plus className="h-4 w-4" />
            New pull request
          </Link>
        </Button>}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pull requests..."
          className="pl-9"
        />
      </div>

      {prs.length === 0 ? (
        <EmptyState
          icon={GitPullRequest}
          title={`No ${statusFilter.toLowerCase()} pull requests`}
          description="Create a new pull request to propose changes."
        />
      ) : (
        <div className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
          {prs.map((pr, index) => (
            <motion.div
              key={pr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
            <Link
              
              to={`/${owner}/${repo}/pulls/${pr.number}`}
              className="flex items-start gap-3 p-4 transition-colors hover:bg-surface-hover"
            >
              <div className="mt-0.5 shrink-0">{statusIcons[pr.status]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-text-primary">{pr.title}</span>
                  {pr.labels?.map((label) => (
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
                  <span>#{pr.number}</span>
                  <span>opened {formatRelativeTime(pr.createdAt)}</span>
                  {pr.author && <span>by {pr.author.username}</span>}
                  <span className="text-text-secondary">
                    {pr.sourceBranch} → {pr.targetBranch}
                  </span>
                </div>
              </div>
              {pr.author && (
                <Avatar src={pr.author.avatarUrl} alt={pr.author.username} size="sm" />
              )}
            </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
