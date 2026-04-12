import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  GitPullRequest,
  GitMerge,
  Search,
  Plus,
  MessageSquare,
  Eye,
  SlidersHorizontal,
  Calendar,
  Clock,
  ArrowUpDown,
  ArrowDownAZ,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import PRBoardPage from './PRBoardPage';
import { usePullRequests } from '@/hooks/usePullRequests';
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
import { cn, formatRelativeTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type SortField = 'createdAt' | 'updatedAt' | 'title';
type SortOrder = 'asc' | 'desc';

const statusConfig = {
  OPEN: { icon: GitPullRequest, color: 'text-success', bgActive: 'bg-emerald-50 text-emerald-700 shadow-sm', countBg: 'bg-emerald-100' },
  MERGED: { icon: GitMerge, color: 'text-primary-500', bgActive: 'bg-primary-50 text-primary-700 shadow-sm', countBg: 'bg-primary-100' },
  CLOSED: { icon: GitPullRequest, color: 'text-error', bgActive: 'bg-red-50 text-red-700 shadow-sm', countBg: 'bg-red-100' },
} as const;

const sortLabels: Record<SortField, string> = {
  createdAt: 'Date created',
  updatedAt: 'Recently updated',
  title: 'Title',
};

export default function PullRequestListPage() {
  const { owner, repo } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED' | 'MERGED'>('OPEN');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'board'>('list');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [statusFilter, sort, sortOrder, debouncedSearch]);

  const { data, isLoading, isError } = usePullRequests(owner!, repo!, {
    status: statusFilter,
    sort,
    sortOrder,
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  });

  if (isLoading) return <PageLoader />;

  const prs = data?.data ?? [];
  const total = (data?.meta as { total?: number })?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / 20) : 1;

  if (isError) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-8 text-center">
        <GitPullRequest className="mx-auto mb-3 h-8 w-8 text-error opacity-60" />
        <p className="font-medium text-text-primary">Failed to load pull requests</p>
        <p className="mt-1 text-sm text-text-tertiary">Check your connection or try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1">
          {(['OPEN', 'MERGED', 'CLOSED'] as const).map((s) => {
            const cfg = statusConfig[s];
            const Icon = cfg.icon;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-all cursor-pointer',
                  statusFilter === s
                    ? cfg.bgActive
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
                )}
              >
                <Icon className={cn('h-4 w-4', statusFilter === s ? '' : cfg.color)} />
                {s.charAt(0) + s.slice(1).toLowerCase()}
                {statusFilter === s && total > 0 && (
                  <span className={cn('ml-1 rounded-full px-1.5 text-[11px] font-semibold', cfg.countBg)}>
                    {total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={view === 'list' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView('list')}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>List view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={view === 'board' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView('board')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Board view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isAuthenticated && (
            <Button size="sm" asChild>
              <Link to={`/${owner}/${repo}/pulls/new`}>
                <Plus className="h-4 w-4" />
                New pull request
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Board view */}
      {view === 'board' && <PRBoardPage />}

      {/* List view — search, filters, results */}
      {view === 'list' && <>

      {/* Search + Sort bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pull requests by title..."
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
      </div>

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

      {/* PR list */}
      {prs.length === 0 ? (
        <EmptyState
          icon={GitPullRequest}
          title={search ? 'No pull requests found' : `No ${statusFilter.toLowerCase()} pull requests`}
          description={search ? 'Try adjusting your search terms.' : 'Create a new pull request to propose changes.'}
        />
      ) : (
        <div className="rounded-[var(--radius-md)] border border-border overflow-hidden">
          <AnimatePresence mode="popLayout">
            {prs.map((pr, index) => {
              const cfg = statusConfig[pr.status];
              const Icon = cfg.icon;

              return (
                <motion.div
                  key={pr.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.03, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  className={cn(index > 0 && 'border-t border-border')}
                >
                  <Link
                    to={`/${owner}/${repo}/pulls/${pr.number}`}
                    className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-hover group"
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="mt-0.5 shrink-0">
                            <Icon className={cn('h-4 w-4', cfg.color)} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{pr.status.charAt(0) + pr.status.slice(1).toLowerCase()} pull request</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                          {pr.title}
                        </span>
                        {pr.labels?.map((label) => (
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
                        <span className="font-mono">#{pr.number}</span>
                        <span>opened {formatRelativeTime(pr.createdAt)}</span>
                        {pr.author && (
                          <span>by <span className="text-text-secondary">{pr.author.username}</span></span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 text-[11px]">
                          {pr.sourceBranch} → {pr.targetBranch}
                        </span>
                        {(pr as { _count?: { reviews: number; comments: number } })._count?.reviews != null && (pr as { _count?: { reviews: number; comments: number } })._count!.reviews > 0 && (
                          <span className="flex items-center gap-1 text-text-secondary">
                            <Eye className="h-3 w-3" />
                            {(pr as { _count?: { reviews: number; comments: number } })._count!.reviews}
                          </span>
                        )}
                        {(pr as { _count?: { reviews: number; comments: number } })._count?.comments != null && (pr as { _count?: { reviews: number; comments: number } })._count!.comments > 0 && (
                          <span className="flex items-center gap-1 text-text-secondary">
                            <MessageSquare className="h-3 w-3" />
                            {(pr as { _count?: { reviews: number; comments: number } })._count!.comments}
                          </span>
                        )}
                      </div>
                    </div>

                    {pr.author && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Avatar src={pr.author.avatarUrl} alt={pr.author.username} size="sm" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{pr.author.username}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-text-tertiary">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} pull requests
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
      </>}
    </div>
  );
}
