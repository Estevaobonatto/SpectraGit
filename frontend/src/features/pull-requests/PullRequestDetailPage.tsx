import { useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import {
  GitPullRequest,
  GitMerge,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { usePullRequest, usePullRequestDiff, useMergePullRequest, useClosePullRequest, useAddPRComment, useReviews, useSubmitReview } from '@/hooks/usePullRequests';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { PageLoader } from '@/components/ui/spinner';
import { DiffViewer } from '@/components/repo/DiffViewer';
import { Alert } from '@/components/ui/alert';
import { formatRelativeTime } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PullRequest, Repository } from '@/types';
import { motion } from 'motion/react';

function StatusBadge({ status }: { status: PullRequest['status'] }) {
  const map = {
    OPEN: { icon: GitPullRequest, label: 'Open', variant: 'success' as const },
    MERGED: { icon: GitMerge, label: 'Merged', variant: 'default' as const },
    CLOSED: { icon: GitPullRequest, label: 'Closed', variant: 'destructive' as const },
  };
  const { icon: Icon, label, variant } = map[status];
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}

export default function PullRequestDetailPage() {
  const { owner, repo, number } = useParams();
  const prNumber = Number(number);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { repository } = useOutletContext<{ repository: Repository }>();
  const canEdit = repository?.canEdit ?? false;

  const { data: pr, isLoading } = usePullRequest(owner!, repo!, prNumber);
  const { data: diffData } = usePullRequestDiff(owner!, repo!, prNumber);
  const { data: reviews } = useReviews(owner!, repo!, prNumber);
  const mergeMutation = useMergePullRequest(owner!, repo!, prNumber);
  const closeMutation = useClosePullRequest(owner!, repo!, prNumber);
  const commentMutation = useAddPRComment(owner!, repo!, prNumber);
  const reviewMutation = useSubmitReview(owner!, repo!, prNumber);

  const [comment, setComment] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [mergeStrategy, setMergeStrategy] = useState<'MERGE_COMMIT' | 'SQUASH'>('MERGE_COMMIT');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);

  if (isLoading || !pr) return <PageLoader />;

  const handleAddComment = () => {
    if (!comment.trim()) return;
    setCommentError(null);
    commentMutation.mutate(comment, {
      onSuccess: () => setComment(''),
      onError: (err) => setCommentError((err as Error)?.message ?? 'Failed to add comment'),
    });
  };

  const handleMerge = () => {
    setMergeError(null);
    mergeMutation.mutate(mergeStrategy, {
      onError: (err) => setMergeError((err as Error)?.message ?? 'Failed to merge pull request'),
    });
  };

  const handleClose = () => {
    closeMutation.mutate();
  };

  const handleSubmitReview = (status: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED') => {
    setReviewError(null);
    reviewMutation.mutate({ body: reviewBody, status }, {
      onSuccess: () => setReviewBody(''),
      onError: (err) => setReviewError((err as Error)?.message ?? 'Failed to submit review'),
    });
  };

  const diff = diffData ?? [];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Header */}
      <div>
        <div className="flex items-start gap-3">
          <h1 className="text-2xl font-bold text-text-primary flex-1">
            {pr.title} <span className="font-normal text-text-tertiary">#{pr.number}</span>
          </h1>
          <StatusBadge status={pr.status} />
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
          {pr.author && (
            <>
              <Avatar src={pr.author.avatarUrl} alt={pr.author.username} size="sm" />
              <Link to={`/${pr.author.username}`} className="font-medium hover:text-primary-600">
                {pr.author.username}
              </Link>
            </>
          )}
          <span>wants to merge</span>
          <Badge variant="secondary">{pr.sourceBranch}</Badge>
          <span>into</span>
          <Badge variant="secondary">{pr.targetBranch}</Badge>
          <span className="text-text-tertiary">· {formatRelativeTime(pr.createdAt)}</span>
        </div>
      </div>

      <Separator />

      {/* Description */}
      {pr.body && (
        <div className="rounded-[var(--radius-md)] border border-border p-4">
          <p className="whitespace-pre-wrap text-sm text-text-primary">{pr.body}</p>
        </div>
      )}

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">Reviews</h2>
          {reviews.map((review) => (
            <div key={review.id} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border p-4">
              <Avatar src={review.author?.avatarUrl} alt={review.author?.username ?? ''} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{review.author?.username}</span>
                  <Badge variant={review.status === 'APPROVED' ? 'success' : review.status === 'CHANGES_REQUESTED' ? 'destructive' : 'secondary'}>
                    {review.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-text-tertiary">{formatRelativeTime(review.createdAt)}</span>
                </div>
                {review.body && <p className="mt-1 text-sm text-text-secondary whitespace-pre-wrap">{review.body}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments */}
      {pr.comments && pr.comments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({pr.comments.length})
          </h2>
          {pr.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border p-4">
              <Avatar src={c.author?.avatarUrl} alt={c.author?.username ?? ''} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{c.author?.username}</span>
                  <span className="text-xs text-text-tertiary">{formatRelativeTime(c.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-text-secondary whitespace-pre-wrap">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diff */}
      {diff.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-text-primary">Changes</h2>
          <DiffViewer files={diff} />
        </div>
      )}

      {/* Actions */}
      {pr.status === 'OPEN' && isAuthenticated && (
        <div className="space-y-4 rounded-[var(--radius-md)] border border-border p-4">
          {/* Submit Review */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">Submit Review</h3>
            <Textarea
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              placeholder="Leave a review comment..."
              rows={3}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleSubmitReview('COMMENTED')}>
                Comment
              </Button>
              <Button size="sm" variant="default" onClick={() => handleSubmitReview('APPROVED')}>
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleSubmitReview('CHANGES_REQUESTED')}>
                Request changes
              </Button>
            </div>
            {reviewError && <Alert variant="error">{reviewError}</Alert>}
          </div>

          <Separator />

          {/* Comment */}
          <div className="flex items-start gap-3">
            <Avatar src={user?.avatarUrl} alt={user?.username ?? ''} size="sm" />
            <div className="flex-1 space-y-2">
              <Textarea
                value={comment}
                onChange={(e) => { setComment(e.target.value); setCommentError(null); }}
                placeholder="Add a comment..."
                rows={3}
              />
              {commentError && <Alert variant="error">{commentError}</Alert>}
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={commentMutation.isPending || !comment.trim()}
              >
                Comment
              </Button>
            </div>
          </div>

          {/* Merge / Close — only for repo members */}
          {canEdit && (
          <>
          <Separator />

          <div className="space-y-2">
            {mergeError && <Alert variant="error">{mergeError}</Alert>}
            <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Button onClick={handleMerge} disabled={mergeMutation.isPending}>
                <GitMerge className="h-4 w-4" />
                {mergeStrategy === 'MERGE_COMMIT' ? 'Merge' : 'Squash and merge'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="icon" className="rounded-l-none border-l border-primary-400/30">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMergeStrategy('MERGE_COMMIT')}>
                    Create a merge commit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMergeStrategy('SQUASH')}>
                    Squash and merge
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button variant="destructive" onClick={handleClose} disabled={closeMutation.isPending}>
              Close pull request
            </Button>
          </div>
          </div>
          </>
          )}
        </div>
      )}
      {pr.status === 'OPEN' && !isAuthenticated && (
        <p className="text-sm text-text-tertiary text-center py-4">
          <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link> to review, comment, or merge this pull request.
        </p>
      )}
    </motion.div>
  );
}
