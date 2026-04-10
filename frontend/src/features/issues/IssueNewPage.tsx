import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateIssue } from '@/hooks/useIssues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

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

  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>New Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Description</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe the issue..."
                rows={8}
              />
            </div>

            {createIssue.isError && (
              <Alert variant="error">
                {(createIssue.error as Error)?.message ?? 'Failed to create issue'}
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim() || createIssue.isPending}>
                {createIssue.isPending ? 'Creating...' : 'Submit new issue'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
