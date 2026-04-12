import { useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import {
  GitPullRequest,
  GitMerge,
  MessageSquare,
  ChevronDown,
  FileCode,
  Eye,
  CheckCircle2,
  XCircle,
  MessageCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  GitBranch,
} from 'lucide-react';
import {
  usePullRequest,
  usePullRequestDiff,
  useMergePullRequest,
  useClosePullRequest,
  useAddPRComment,
  useReviews,
  useSubmitReview,
} from '@/hooks/usePullRequests';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { PageLoader } from '@/components/ui/spinner';
import { DiffViewer } from '@/components/repo/DiffViewer';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    OPEN: { icon: GitPullRequest, label: 'Open', variant: 'success' as const, bg: 'bg-emerald-50' },
    MERGED: { icon: GitMerge, label: 'Merged', variant: 'default' as const, bg: 'bg-primary-50' },
    CLOSED: { icon: GitPullRequest, label: 'Closed', variant: 'destructive' as const, bg: 'bg-red-50' },
  };
  const { icon: Icon, label, variant } = map[status];
  return (
    <Badge variant={variant} className="flex items-center gap-1.5 px-3 py-1">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}

function ReviewStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'APPROVED':
      return <ShieldCheck className="h-4 w-4 text-success" />;
    case 'CHANGES_REQUESTED':
      return <ShieldAlert className="h-4 w-4 text-error" />;
    default:
      return <MessageCircle className="h-4 w-4 text-text-tertiary" />;
  }
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
  const [showSuccessFeedback, setShowSuccessFeedback] = useState<string | null>(null);

  if (isLoading || !pr) return <PageLoader />;

  const handleAddComment = () => {
    if (!comment.trim()) return;
    setCommentError(null);
    commentMutation.mutate(comment, {
      onSuccess: () => {
        setComment('');
        setShowSuccessFeedback('Comment added.');
        setTimeout(() => setShowSuccessFeedback(null), 3000);
      },
      onError: (err) => setCommentError((err as Error)?.message ?? 'Failed to add comment'),
    });
  };

  const handleMerge = () => {
    setMergeError(null);
    mergeMutation.mutate(mergeStrategy, {
      onSuccess: () => {
        setShowSuccessFeedback('Pull request merged successfully!');
        setTimeout(() => setShowSuccessFeedback(null), 5000);
      },
      onError: (err) => setMergeError((err as Error)?.message ?? 'Failed to merge pull request'),
    });
  };

  const handleClose = () => {
    closeMutation.mutate(undefined, {
      onSuccess: () => {
        setShowSuccessFeedback('Pull request closed.');
        setTimeout(() => setShowSuccessFeedback(null), 3000);
      },
    });
  };

  const handleSubmitReview = (status: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED') => {
    setReviewError(null);
    reviewMutation.mutate(
      { body: reviewBody, status },
      {
        onSuccess: () => {
          setReviewBody('');
          const labels = { APPROVED: 'Review approved.', CHANGES_REQUESTED: 'Changes requested.', COMMENTED: 'Review submitted.' };
          setShowSuccessFeedback(labels[status]);
          setTimeout(() => setShowSuccessFeedback(null), 3000);
        },
        onError: (err) => setReviewError((err as Error)?.message ?? 'Failed to submit review'),
      },
    );
  };

  const diff = diffData ?? [];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Success feedback */}
      {showSuccessFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {showSuccessFeedback}
        </motion.div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-start gap-3">
          <h1 className="text-2xl font-bold text-text-primary flex-1 leading-tight">
            {pr.title}{' '}
            <span className="font-normal text-text-tertiary">#{pr.number}</span>
          </h1>
          <StatusBadge status={pr.status} />
        </div>
        <div className="mt-3 flex items-center gap-3 flex-wrap text-sm text-text-secondary">
          {pr.author && (
            <div className="flex items-center gap-1.5">
              <Avatar src={pr.author.avatarUrl} alt={pr.author.username} size="sm" />
              <Link to={`/${pr.author.username}`} className="font-medium hover:text-primary-600">
                {pr.author.username}
              </Link>
            </div>
          )}
          <span className="text-text-tertiary">wants to merge</span>
          <Badge variant="secondary" className="font-mono text-xs gap-1">
            <GitBranch className="h-3 w-3" />
            {pr.sourceBranch}
          </Badge>
          <span className="text-text-tertiary">into</span>
          <Badge variant="secondary" className="font-mono text-xs gap-1">
            <GitBranch className="h-3 w-3" />
            {pr.targetBranch}
          </Badge>
          <span className="flex items-center gap-1 text-text-tertiary">
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeTime(pr.createdAt)}
          </span>
        </div>
      </div>

      <Separator />

      {/* Tabbed content */}
      <Tabs defaultValue="conversation">
        <TabsList>
          <TabsTrigger value="conversation" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Conversation
            {pr.comments && pr.comments.length > 0 && (
              <span className="ml-1 rounded-full bg-surface-hover px-1.5 text-[11px] font-medium">{pr.comments.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="changes" className="gap-1.5">
            <FileCode className="h-3.5 w-3.5" />
            Files changed
            {diff.length > 0 && (
              <span className="ml-1 rounded-full bg-surface-hover px-1.5 text-[11px] font-medium">{diff.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Reviews
            {reviews && reviews.length > 0 && (
              <span className="ml-1 rounded-full bg-surface-hover px-1.5 text-[11px] font-medium">{reviews.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ====== CONVERSATION TAB ====== */}
        <TabsContent value="conversation">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
            <div className="space-y-4 min-w-0">
              {/* PR description */}
              {pr.body && (
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3">
                      <Avatar src={pr.author?.avatarUrl} alt={pr.author?.username ?? ''} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">{pr.author?.username}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Author</Badge>
                          <span className="text-xs text-text-tertiary">{formatRelativeTime(pr.createdAt)}</span>
                        </div>
                        <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                          {pr.body}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comments timeline */}
              {pr.comments && pr.comments.length > 0 && (
                <div className="space-y-3">
                  {pr.comments.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.25 }}
                    >
                      <Card>
                        <CardContent className="pt-5">
                          <div className="flex items-start gap-3">
                            <Avatar src={c.author?.avatarUrl} alt={c.author?.username ?? ''} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{c.author?.username}</span>
                                <span className="text-xs text-text-tertiary">{formatRelativeTime(c.createdAt)}</span>
                              </div>
                              <p className="mt-1 text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{c.body}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Comment box */}
              {pr.status === 'OPEN' && isAuthenticated && (
                <Card>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar src={user?.avatarUrl} alt={user?.username ?? ''} size="sm" />
                      <div className="flex-1 space-y-2">
                        <Textarea
                          value={comment}
                          onChange={(e) => {
                            setComment(e.target.value);
                            setCommentError(null);
                          }}
                          placeholder="Leave a comment..."
                          rows={3}
                          className="resize-y"
                        />
                        {commentError && <Alert variant="error">{commentError}</Alert>}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClose}
                          disabled={closeMutation.isPending}
                          className="gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Close pull request
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={commentMutation.isPending || !comment.trim()}
                        className="gap-1.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Comment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {pr.status === 'OPEN' && !isAuthenticated && (
                <div className="rounded-[var(--radius-md)] border border-border bg-surface-hover p-6 text-center">
                  <p className="text-sm text-text-tertiary">
                    <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link>{' '}
                    to review, comment, or merge this pull request.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar - merge panel */}
            <div className="space-y-5">
              {/* Merge actions */}
              {pr.status === 'OPEN' && canEdit && (
                <div className="rounded-[var(--radius-md)] border border-border p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                    <GitMerge className="h-4 w-4" />
                    Merge
                  </h3>
                  {mergeError && <Alert variant="error">{mergeError}</Alert>}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      onClick={handleMerge}
                      disabled={mergeMutation.isPending}
                      className="flex-1 gap-1.5"
                    >
                      <GitMerge className="h-3.5 w-3.5" />
                      {mergeMutation.isPending
                        ? 'Merging...'
                        : mergeStrategy === 'MERGE_COMMIT'
                          ? 'Merge'
                          : 'Squash and merge'}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="default" size="icon" className="rounded-l-none border-l border-primary-400/30 h-8 w-8">
                          <ChevronDown className="h-3.5 w-3.5" />
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
                  <p className="text-[11px] text-text-tertiary">
                    {mergeStrategy === 'MERGE_COMMIT'
                      ? 'All commits will be added to the target branch via a merge commit.'
                      : 'All commits will be squashed into a single commit on the target branch.'}
                  </p>
                </div>
              )}

              {pr.status === 'MERGED' && (
                <div className="rounded-[var(--radius-md)] border border-primary-200 bg-primary-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary-700">
                    <GitMerge className="h-4 w-4" />
                    <span className="text-sm font-semibold">Merged</span>
                  </div>
                  {pr.mergedBy && (
                    <p className="text-xs text-primary-600">
                      by {(pr.mergedBy as { username: string }).username}{' '}
                      {pr.mergedAt && formatRelativeTime(pr.mergedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Review summary */}
              {reviews && reviews.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Eye className="h-3 w-3" />
                    Review Summary
                  </h3>
                  <div className="space-y-2">
                    {reviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="flex items-center gap-2 text-sm">
                        <ReviewStatusIcon status={review.status} />
                        <span className="text-text-primary text-xs font-medium">
                          {review.author?.username}
                        </span>
                        <Badge
                          variant={
                            review.status === 'APPROVED'
                              ? 'success'
                              : review.status === 'CHANGES_REQUESTED'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {review.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Meta */}
              <div>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Activity
                </h3>
                <div className="space-y-1.5 text-xs text-text-tertiary">
                  <p>Created {formatRelativeTime(pr.createdAt)}</p>
                  <p>Updated {formatRelativeTime(pr.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ====== CHANGES TAB ====== */}
        <TabsContent value="changes">
          {diff.length > 0 ? (
            <DiffViewer files={diff} />
          ) : (
            <div className="rounded-[var(--radius-md)] border border-border bg-surface-hover p-8 text-center">
              <FileCode className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-tertiary">No file changes found.</p>
            </div>
          )}
        </TabsContent>

        {/* ====== REVIEWS TAB ====== */}
        <TabsContent value="reviews">
          <div className="space-y-4">
            {/* Reviews list */}
            {reviews && reviews.length > 0 ? (
              reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                >
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-start gap-3">
                        <Avatar src={review.author?.avatarUrl} alt={review.author?.username ?? ''} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{review.author?.username}</span>
                            <Badge
                              variant={
                                review.status === 'APPROVED'
                                  ? 'success'
                                  : review.status === 'CHANGES_REQUESTED'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className="gap-1"
                            >
                              <ReviewStatusIcon status={review.status} />
                              {review.status.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-xs text-text-tertiary">{formatRelativeTime(review.createdAt)}</span>
                          </div>
                          {review.body && (
                            <p className="mt-2 text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{review.body}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="rounded-[var(--radius-md)] border border-border bg-surface-hover p-8 text-center">
                <Eye className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-text-tertiary">No reviews yet.</p>
              </div>
            )}

            {/* Submit review */}
            {pr.status === 'OPEN' && isAuthenticated && (
              <Card>
                <CardContent className="pt-5 space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary">Submit your review</h3>
                  <Textarea
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="Leave a review comment..."
                    rows={3}
                    className="resize-y"
                  />
                  {reviewError && <Alert variant="error">{reviewError}</Alert>}
                  <div className="flex items-center gap-2 flex-wrap">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSubmitReview('COMMENTED')}
                            disabled={reviewMutation.isPending}
                            className="gap-1.5"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Comment
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Submit general feedback</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSubmitReview('APPROVED')}
                            disabled={reviewMutation.isPending}
                            className="gap-1.5"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Approve these changes</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSubmitReview('CHANGES_REQUESTED')}
                            disabled={reviewMutation.isPending}
                            className="gap-1.5"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Request changes
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Request modifications before merging</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
