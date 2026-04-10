import { useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft, CircleDot, CircleCheck, MessageSquare } from 'lucide-react';
import { useIssue, useUpdateIssue, useAddIssueComment } from '@/hooks/useIssues';
import { useAuthStore } from '@/stores/auth.store';
import type { Repository } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
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

  const [commentBody, setCommentBody] = useState('');

  if (isLoading) return <PageLoader />;
  if (error || !issue) return <Alert variant="error" title="Issue not found">Could not load this issue.</Alert>;

  const handleAddComment = () => {
    if (!commentBody.trim()) return;
    addComment.mutate(commentBody, {
      onSuccess: () => setCommentBody(''),
    });
  };

  const toggleStatus = () => {
    updateIssue.mutate({ status: issue.status === 'OPEN' ? 'CLOSED' : 'OPEN' } as Parameters<typeof updateIssue.mutate>[0]);
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5" asChild>
          <Link to={`/${owner}/${repo}/issues`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {issue.title} <span className="text-text-tertiary font-normal">#{issue.number}</span>
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={issue.status === 'OPEN' ? 'success' : 'default'} className="gap-1">
              {issue.status === 'OPEN' ? <CircleDot className="h-3 w-3" /> : <CircleCheck className="h-3 w-3" />}
              {issue.status}
            </Badge>
            <span className="text-sm text-text-secondary">
              {issue.author?.username} opened this issue {formatRelativeTime(issue.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {issue.body && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <Avatar src={issue.author?.avatarUrl} alt={issue.author?.username ?? ''} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">{issue.author?.username}</span>
                  <span className="text-xs text-text-tertiary">{formatRelativeTime(issue.createdAt)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{issue.body}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {issue.comments && issue.comments.length > 0 && (
        <div className="space-y-4">
          {issue.comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <Avatar src={comment.author?.avatarUrl} alt={comment.author?.username ?? ''} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{comment.author?.username}</span>
                      <span className="text-xs text-text-tertiary">{formatRelativeTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAuthenticated ? (
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar src={user?.avatarUrl} alt={user?.username ?? ''} size="sm" />
            <Textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Leave a comment..."
              rows={4}
              className="flex-1"
            />
          </div>
          <div className="flex justify-end gap-2">
            {canEdit && (
            <Button
              variant="outline"
              onClick={toggleStatus}
              disabled={updateIssue.isPending}
            >
              {issue.status === 'OPEN' ? 'Close issue' : 'Reopen issue'}
            </Button>
            )}
            <Button
              onClick={handleAddComment}
              disabled={!commentBody.trim() || addComment.isPending}
            >
              <MessageSquare className="h-4 w-4" />
              {addComment.isPending ? 'Posting...' : 'Comment'}
            </Button>
          </div>
        </CardContent>
      </Card>
      ) : (
        <p className="text-sm text-text-tertiary text-center py-4">
          <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link> to comment or change issue status.
        </p>
      )}
    </motion.div>
  );
}
