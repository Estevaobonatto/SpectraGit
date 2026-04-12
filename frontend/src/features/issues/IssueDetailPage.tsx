import { useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  CircleDot,
  CircleCheck,
  MessageSquare,
  Tag,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Layers,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { useIssue, useUpdateIssue, useAddIssueComment, useCloseIssueWithReason } from '@/hooks/useIssues';
import { useAuthStore } from '@/stores/auth.store';
import type { Repository } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IssueTypeBadge } from '@/components/issues/IssueTypeBadge';
import { IssuePriorityBadge } from '@/components/issues/IssuePriorityBadge';
import { CloseIssueDialog } from '@/components/issues/CloseIssueDialog';
import { formatRelativeTime } from '@/lib/utils';
import { motion } from 'motion/react';

export default function IssueDetailPage() {
  const { owner, repo, number } = useParams();
  const issueNumber = Number(number);
  const { user, isAuthenticated } = useAuthStore();
  const { repository } = useOutletContext<{ repository: Repository }>();
  const canEdit = repository?.canEdit ?? false;
  const { data: issue, isLoading, error } = useIssue(owner!, repo!, issueNumber);
  const updateIssue = useUpdateIssue(owner!, repo!, issueNumber);
  const addComment = useAddIssueComment(owner!, repo!, issueNumber);
  const closeWithReason = useCloseIssueWithReason(owner!, repo!, issueNumber);

  const [commentBody, setCommentBody] = useState('');
  const [showSuccessFeedback, setShowSuccessFeedback] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  if (isLoading) return <PageLoader />;
  if (error || !issue) return <Alert variant="error" title="Issue not found">Could not load this issue.</Alert>;

  const handleAddComment = () => {
    if (!commentBody.trim()) return;
    addComment.mutate(commentBody, {
      onSuccess: () => {
        setCommentBody('');
        setShowSuccessFeedback('Comment added successfully!');
        setTimeout(() => setShowSuccessFeedback(null), 3000);
      },
    });
  };

  const toggleStatus = () => {
    const newStatus = issue.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    updateIssue.mutate({ status: newStatus } as Parameters<typeof updateIssue.mutate>[0], {
      onSuccess: () => {
        setShowSuccessFeedback(newStatus === 'CLOSED' ? 'Issue closed.' : 'Issue reopened.');
        setTimeout(() => setShowSuccessFeedback(null), 3000);
      },
    });
  };



  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Success feedback toast */}
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
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5 shrink-0" asChild>
          <Link to={`/${owner}/${repo}/issues`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold leading-tight">
            {issue.title}{' '}
            <span className="text-text-tertiary font-normal">#{issue.number}</span>
          </h1>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <Badge
              variant={issue.status === 'OPEN' ? 'success' : 'default'}
              className="gap-1.5 px-3 py-1"
            >
              {issue.status === 'OPEN' ? (
                <CircleDot className="h-3.5 w-3.5" />
              ) : (
                <CircleCheck className="h-3.5 w-3.5" />
              )}
              {issue.status === 'OPEN' ? 'Open' : 'Closed'}
            </Badge>
            <IssueTypeBadge type={issue.type} />
            <IssuePriorityBadge priority={issue.priority} />
            <span className="text-sm text-text-secondary">
              <Link to={`/${issue.author?.username}`} className="font-medium hover:text-primary-600">
                {issue.author?.username}
              </Link>
              {' '}opened this issue {formatRelativeTime(issue.createdAt)}
            </span>
            {issue.comments && (
              <span className="flex items-center gap-1 text-sm text-text-tertiary">
                <MessageSquare className="h-3.5 w-3.5" />
                {issue.comments.length} comment{issue.comments.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Quick actions in header */}
        {canEdit && issue.status === 'OPEN' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCloseDialog(true)}
                  disabled={updateIssue.isPending}
                  className="shrink-0 gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Close
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close this issue with a reason</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {canEdit && issue.status === 'CLOSED' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleStatus}
                  disabled={updateIssue.isPending}
                  className="shrink-0 gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reopen
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reopen this issue</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Main content - Timeline */}
        <div className="space-y-4 min-w-0">
          {/* Issue body */}
          {issue.body && (
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <Avatar src={issue.author?.avatarUrl} alt={issue.author?.username ?? ''} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{issue.author?.username}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Author</Badge>
                      <span className="text-xs text-text-tertiary">{formatRelativeTime(issue.createdAt)}</span>
                    </div>
                    <MarkdownRenderer content={issue.body} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments timeline */}
          {issue.comments && issue.comments.length > 0 && (
            <div className="space-y-3">
              {issue.comments.map((comment, i) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-start gap-3">
                        <Avatar src={comment.author?.avatarUrl} alt={comment.author?.username ?? ''} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">{comment.author?.username}</span>
                            <span className="text-xs text-text-tertiary">{formatRelativeTime(comment.createdAt)}</span>
                          </div>
                          <MarkdownRenderer content={comment.body} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Comment box */}
          {isAuthenticated ? (
            <Card>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar src={user?.avatarUrl} alt={user?.username ?? ''} size="sm" />
                  <div className="flex-1">
                    <MarkdownEditor
                      value={commentBody}
                      onChange={setCommentBody}
                      placeholder="Leave a comment… **Markdown** _is_ `supported`"
                      rows={4}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {canEdit && issue.status === 'OPEN' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCloseDialog(true)}
                      disabled={updateIssue.isPending || addComment.isPending}
                      className="gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Close with reason
                    </Button>
                  )}
                  {canEdit && issue.status === 'CLOSED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleStatus}
                      disabled={updateIssue.isPending}
                      className="gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reopen issue
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!commentBody.trim() || addComment.isPending}
                    className="gap-1.5"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {addComment.isPending ? 'Posting...' : 'Comment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-border bg-surface-hover p-6 text-center">
              <p className="text-sm text-text-tertiary">
                <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link>{' '}
                to comment or change issue status.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Assignee */}
          <div>
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="h-3 w-3" />
              Assignee
            </h3>
            {issue.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar src={issue.assignee.avatarUrl} alt={issue.assignee.username} size="sm" />
                <span className="text-sm font-medium">{issue.assignee.username}</span>
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">No one assigned</p>
            )}
          </div>

          <Separator />

          {/* Labels */}
          <div>
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              Labels
            </h3>
            {issue.labels && issue.labels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {issue.labels.map((label) => (
                  <Badge
                    key={label.id}
                    className="text-xs"
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
            ) : (
              <p className="text-sm text-text-tertiary">No labels</p>
            )}
          </div>

          <Separator />

          {/* Meta info */}
          <div>
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Activity
            </h3>
            <div className="space-y-1.5 text-xs text-text-tertiary">
              <p>Created {formatRelativeTime(issue.createdAt)}</p>
              <p>Updated {formatRelativeTime(issue.updatedAt)}</p>
            </div>
          </div>

          {/* Type & Priority */}
          {(issue.type || issue.priority) && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="h-3 w-3" />
                  Classification
                </h3>
                <div className="space-y-2">
                  {issue.type && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary w-14">Type</span>
                      <IssueTypeBadge type={issue.type} />
                    </div>
                  )}
                  {issue.priority && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary w-14">Priority</span>
                      <IssuePriorityBadge priority={issue.priority} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Assigned Area */}
          {issue.assignedArea && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  Area
                </h3>
                <Badge variant="outline" className="text-xs">{issue.assignedArea}</Badge>
              </div>
            </>
          )}

          {/* Close Reason */}
          {issue.closeReason && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Close Reason
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {issue.closeReason.replace(/_/g, ' ')}
                </Badge>
                {issue.closeReasonNote && (
                  <p className="mt-1.5 text-xs text-text-tertiary">{issue.closeReasonNote}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Close Issue Dialog */}
      <CloseIssueDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        onClose={(data) => {
          closeWithReason.mutate(data, {
            onSuccess: () => {
              setShowCloseDialog(false);
              setShowSuccessFeedback('Issue closed.');
              setTimeout(() => setShowSuccessFeedback(null), 3000);
            },
          });
        }}
        isPending={closeWithReason.isPending}
      />
    </motion.div>
  );
}
