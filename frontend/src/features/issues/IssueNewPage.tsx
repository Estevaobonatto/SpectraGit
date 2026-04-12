import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleDot, FileText, Send } from 'lucide-react';
import { useCreateIssue } from '@/hooks/useIssues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { motion } from 'motion/react';

export default function IssueNewPage() {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const createIssue = useCreateIssue(owner!, repo!);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIssue.mutate(
      { title, body: body || undefined },
      {
        onSuccess: (issue) => {
          navigate(`/${owner}/${repo}/issues/${issue.number}`);
        },
      },
    );
  };

  const isValid = title.trim().length > 0;

  return (
    <motion.div
      className="max-w-3xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDot className="h-5 w-5 text-success" />
            New Issue
          </CardTitle>
          <CardDescription>
            Create a new issue to report a bug, request a feature, or start a discussion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                  1
                </div>
                <Label htmlFor="title" className="font-semibold">Title *</Label>
              </div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                required
                autoFocus
              />
              <p className="text-xs text-text-tertiary">
                A clear and concise title helps others understand the issue quickly.
              </p>
            </div>

            <Separator />

            {/* Step 2: Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                  2
                </div>
                <Label htmlFor="body" className="font-semibold">Description</Label>
                <span className="text-xs text-text-tertiary">(optional)</span>
              </div>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe the issue in detail. Include steps to reproduce, expected behavior, and any relevant context..."
                rows={8}
                className="resize-y"
              />
              <p className="text-xs text-text-tertiary">
                Provide as much detail as possible. You can always edit this later.
              </p>
            </div>

            {createIssue.isError && (
              <Alert variant="error">
                {(createIssue.error as Error)?.message ?? 'Failed to create issue'}
              </Alert>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-tertiary flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                You can edit the issue after creating it.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || createIssue.isPending}
                  className="gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  {createIssue.isPending ? 'Creating...' : 'Submit new issue'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
