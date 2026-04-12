import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  CircleDot,
  Eye,
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  ArrowLeft,
} from 'lucide-react';
import { usePullRequests, useReviews } from '@/hooks/usePullRequests';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { PageLoader } from '@/components/ui/spinner';
import { PRRiskBadge } from '@/components/pull-requests/PRRiskBadge';
import { computePRStep } from '@/components/pull-requests/PRStepProgress';
import { cn, formatRelativeTime } from '@/lib/utils';
import { PageTransition } from '@/components/animate-ui/page-transition';
import { Fade } from '@/components/animate-ui/fade';
import { AnimatedGroup } from '@/components/animate-ui/animated-list';
import { HoverScale } from '@/components/animate-ui/effects';
import type { PullRequest, Review } from '@/types';

// ─── Column config ────────────────────────────────────────────────────────────

const columnConfig: { key: string; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'open',              label: 'Open',             icon: CircleDot,     color: '#10B981' },
  { key: 'in-review',         label: 'In Review',        icon: Eye,           color: '#3B82F6' },
  { key: 'changes-requested', label: 'Changes Requested', icon: AlertTriangle, color: '#F59E0B' },
  { key: 'approved',          label: 'Approved',         icon: CheckCircle2,  color: '#8B5CF6' },
  { key: 'ready-to-merge',    label: 'Ready to Merge',   icon: GitMerge,      color: '#22C55E' },
];

// ─── PR Card ──────────────────────────────────────────────────────────────────

function PRCard({ pr, owner, repo }: { pr: PullRequest; owner: string; repo: string }) {
  return (
    <HoverScale scale={1.02}>
    <Card className="group hover:border-primary-400/60 transition-all duration-150">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-1.5">
          <Link
            to={`/${owner}/${repo}/pull/${pr.number}`}
            className="flex-1 min-w-0 text-sm font-medium text-text-primary leading-snug hover:text-primary-600 line-clamp-2"
          >
            {pr.title}
          </Link>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {pr.riskLevel && <PRRiskBadge riskLevel={pr.riskLevel} />}
          {pr.isDraft && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Draft</Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span className="font-mono">#{pr.number}</span>
          <div className="flex items-center gap-1.5">
            <span>{formatRelativeTime(pr.createdAt)}</span>
            {pr.author && (
              <Avatar src={pr.author.avatarUrl} alt={pr.author.username} size="sm" />
            )}
          </div>
        </div>

        {(pr.requestedReviewers ?? []).length > 0 && (
          <div className="flex items-center gap-1 pt-0.5">
            {pr.requestedReviewers!.slice(0, 4).map((r) => (
              <Avatar key={r.id} src={r.user?.avatarUrl} alt={r.user?.username ?? ''} size="sm" />
            ))}
            {(pr.requestedReviewers!.length > 4) && (
              <span className="text-[10px] text-text-tertiary">+{pr.requestedReviewers!.length - 4}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>    </HoverScale>  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function BoardColumn({
  col,
  prs,
  owner,
  repo,
}: {
  col: typeof columnConfig[number];
  prs: PullRequest[];
  owner: string;
  repo: string;
}) {
  const Icon = col.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex-shrink-0 w-72"
    >
      <div className="rounded-[var(--radius-md)] border border-border bg-surface-hover/30">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
          <Icon className="h-4 w-4" style={{ color: col.color }} />
          <span className="text-sm font-semibold text-text-primary">{col.label}</span>
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">{prs.length}</Badge>
        </div>
        <div className="p-2 space-y-2 min-h-[180px] max-h-[calc(100vh-280px)] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {prs.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-text-tertiary text-center py-8"
              >
                No pull requests
              </motion.p>
            ) : (
              prs.map((pr) => (
                <motion.div
                  key={pr.id}
                  layoutId={pr.id}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.96, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -6 }}
                  transition={{
                    layout: { type: 'spring', stiffness: 350, damping: 30 },
                    opacity: { duration: 0.15 },
                    scale: { type: 'spring', stiffness: 400, damping: 25 },
                  }}
                >
                  <PRCard pr={pr} owner={owner} repo={repo} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Board Page ───────────────────────────────────────────────────────────────

export default function PRBoardPage() {
  const { owner, repo } = useParams();

  const { data: listData, isLoading, isError } = usePullRequests(owner!, repo!, { status: 'OPEN', limit: 100 });
  const { data: reviewsData } = useReviews(owner!, repo!);

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-8 text-center">
        <p className="font-medium text-text-primary">Failed to load board</p>
      </div>
    );
  }

  const prs: PullRequest[] = listData?.data ?? [];
  const allReviews: Review[] = reviewsData?.data ?? [];

  // Group reviews by PR id
  const reviewsByPR = allReviews.reduce<Record<string, Review[]>>((acc, r) => {
    if (r.pullRequestId) {
      acc[r.pullRequestId] = [...(acc[r.pullRequestId] ?? []), r];
    }
    return acc;
  }, {});

  // Bucket PRs by step
  const columns = columnConfig.reduce<Record<string, PullRequest[]>>((acc, col) => {
    acc[col.key] = [];
    return acc;
  }, {});

  for (const pr of prs) {
    const prReviews = reviewsByPR[pr.id] ?? [];
    const step = computePRStep(pr, prReviews);
    if (step !== 'closed' && columns[step]) {
      columns[step].push(pr);
    }
  }

  return (
    <PageTransition className="space-y-5">
      <Fade direction="down" duration={0.3}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/${owner}/${repo}/pulls`}>
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </Link>
          </Button>
          <h1 className="text-lg font-bold">PR Board</h1>
        </div>
      </div>
      </Fade>

      <AnimatedGroup preset="blur-slide" className="flex gap-4 overflow-x-auto pb-4 scroll-smooth">
        {columnConfig.map((col) => (
          <BoardColumn
            key={col.key}
            col={col}
            prs={columns[col.key] ?? []}
            owner={owner!}
            repo={repo!}
          />
        ))}
      </AnimatedGroup>
    </PageTransition>
  );
}
