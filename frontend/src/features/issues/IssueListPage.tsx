import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CircleDot,
  CircleCheck,
  Plus,
  Search,
  ArrowUpDown,
  MessageSquare,
  SlidersHorizontal,
  Calendar,
  Clock,
  ArrowDownAZ,
  Kanban,
  ListFilter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useIssues } from '@/hooks/useIssues';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { IssueTypeBadge } from '@/components/issues/IssueTypeBadge';
import { IssuePriorityBadge } from '@/components/issues/IssuePriorityBadge';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { IssueType, IssuePriority } from '@/types';

type SortField = 'createdAt' | 'updatedAt' | 'title';
type SortOrder = 'asc' | 'desc';

const sortLabels: Record<SortField, string> = {
  createdAt: 'Date created',
  updatedAt: 'Recently updated',
  title: 'Title',
};

export default function IssueListPage() {
  const { owner, repo } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [typeFilter, setTypeFilter] = useState<IssueType | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [statusFilter, typeFilter, priorityFilter, sort, sortOrder, debouncedSearch]);

  const { data, isLoading, isError } = useIssues(owner!, repo!, {
    status: statusFilter,
    type: typeFilter || undefined,
    priority: priorityFilter || undefined,
    sort,
    sortOrder,
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  });

  if (isLoading) return <PageLoader />;

  const issues = data?.data ?? [];
  const total = (data?.meta as { total?: number })?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / 20) : 1;

  if (isError) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-8 text-center">
        <CircleDot className="mx-auto mb-3 h-8 w-8 text-error opacity-60" />
        <p className="font-medium text-text-primary">Failed to load issues</p>
        <p className="mt-1 text-sm text-text-tertiary">Check your connection or try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1">
          <button
            onClick={() => setStatusFilter('OPEN')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-all cursor-pointer',
              statusFilter === 'OPEN'
                ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
            )}
          >
            <CircleDot className="h-4 w-4" />
            Open
            {statusFilter === 'OPEN' && total > 0 && (
              <span className="ml-1 rounded-full bg-emerald-100 px-1.5 text-[11px] font-semibold">{total}</span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('CLOSED')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-all cursor-pointer',
              statusFilter === 'CLOSED'
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
            )}
          >
            <CircleCheck className="h-4 w-4" />
            Closed
            {statusFilter === 'CLOSED' && total > 0 && (
              <span className="ml-1 rounded-full bg-primary-100 px-1.5 text-[11px] font-semibold">{total}</span>
            )}
          </button>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/${owner}/${repo}/issues/board`}>
                <Kanban className="h-4 w-4" />
                Board
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={`/${owner}/${repo}/issues/new`}>
                <Plus className="h-4 w-4" />
                New issue
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Search + Sort bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues by title..."
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setSort('createdAt'); setSortOrder('desc'); }}>
              <Calendar className="h-3.5 w-3.5 mr-2 text-text-tertiary" />
              Newest first
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSort('createdAt'); setSortOrder('asc'); }}>
              <Clock className="h-3.5 w-3.5 mr-2 text-text-tertiary" />
              Oldest first
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSort('updatedAt'); setSortOrder('desc'); }}>
              <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-text-tertiary" />
              Recently updated
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSort('title'); setSortOrder('asc'); }}>
              <ArrowDownAZ className="h-3.5 w-3.5 mr-2 text-text-tertiary" />
              Title A–Z
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Type filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <ListFilter className="h-3.5 w-3.5" />
              {typeFilter || 'Type'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTypeFilter('')}>All types</DropdownMenuItem>
            {(['BUG', 'FEATURE', 'QUESTION', 'SUPPORT', 'IMPROVEMENT'] as IssueType[]).map((t) => (
              <DropdownMenuItem key={t} onClick={() => setTypeFilter(t)}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <ListFilter className="h-3.5 w-3.5" />
              {priorityFilter || 'Priority'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Filter by priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPriorityFilter('')}>All priorities</DropdownMenuItem>
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as IssuePriority[]).map((p) => (
              <DropdownMenuItem key={p} onClick={() => setPriorityFilter(p)}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filter pills */}
      {(typeFilter || priorityFilter) && (
        <div className="flex items-center gap-2 flex-wrap">
          {typeFilter && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setTypeFilter('')}>
              Type: {typeFilter.charAt(0) + typeFilter.slice(1).toLowerCase()} ×
            </Badge>
          )}
          {priorityFilter && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setPriorityFilter('')}>
              Priority: {priorityFilter.charAt(0) + priorityFilter.slice(1).toLowerCase()} ×
            </Badge>
          )}
        </div>
      )}

      {/* Results info */}
      {(search || sort !== 'createdAt') && (
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span>{total} result{total !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>Sorted by {sortLabels[sort]} ({sortOrder === 'desc' ? '↓' : '↑'})</span>
          {search && (
            <>
              <span>·</span>
              <button onClick={() => setSearch('')} className="text-primary-600 hover:underline cursor-pointer">
                Clear search
              </button>
            </>
          )}
        </div>
      )}

      {/* Issue list */}
      {issues.length === 0 ? (
        <EmptyState
          icon={CircleDot}
          title={search ? 'No issues found' : `No ${statusFilter.toLowerCase()} issues`}
          description={
            search
              ? 'Try adjusting your search terms.'
              : statusFilter === 'OPEN'
                ? 'Great work! There are no open issues.'
                : 'No closed issues yet.'
          }
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="mt-0.5 shrink-0">
                          {issue.status === 'OPEN' ? (
                            <CircleDot className="h-4 w-4 text-success" />
                          ) : (
                            <CircleCheck className="h-4 w-4 text-primary-500" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{issue.status === 'OPEN' ? 'Open issue' : 'Closed issue'}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                        {issue.title}
                      </span>
                      <IssueTypeBadge type={issue.type} />
                      <IssuePriorityBadge priority={issue.priority} />
                      {issue.labels?.map((label) => (
                        <Badge
                          key={label.id}
                          className="text-[10px] px-1.5"
                          style={{
                            backgroundColor: label.color + '18',
                            color: label.color,
                            borderColor: label.color + '30',
                            border: '1px solid',
                          }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-text-tertiary">
                      <span className="font-mono">#{issue.number}</span>
                      <span>opened {formatRelativeTime(issue.createdAt)}</span>
                      {issue.author && <span>by <span className="text-text-secondary">{issue.author.username}</span></span>}
                      {(issue as { _count?: { comments: number } })._count?.comments != null && (issue as { _count?: { comments: number } })._count!.comments > 0 && (
                        <span className="flex items-center gap-1 text-text-secondary">
                          <MessageSquare className="h-3 w-3" />
                          {(issue as { _count?: { comments: number } })._count!.comments}
                        </span>
                      )}
                    </div>
                  </div>

                  {issue.assignee && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Avatar src={issue.assignee.avatarUrl} alt={issue.assignee.username} size="sm" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Assigned to {issue.assignee.username}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-text-tertiary">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} issues
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="px-3 text-sm text-text-secondary">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
