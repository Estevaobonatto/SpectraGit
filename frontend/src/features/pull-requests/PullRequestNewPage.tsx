import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitPullRequest } from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';
import { useCreatePullRequest } from '@/hooks/usePullRequests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { PageLoader } from '@/components/ui/spinner';

export default function PullRequestNewPage() {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const { data: branchData, isLoading: branchesLoading } = useBranches(owner!, repo!);
  const createMutation = useCreatePullRequest(owner!, repo!);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [targetBranch, setTargetBranch] = useState('');

  if (branchesLoading) return <PageLoader />;

  const branches = branchData ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !sourceBranch || !targetBranch) return;

    createMutation.mutate(
      { title, body: description, sourceBranch, targetBranch },
      {
        onSuccess: (data) => {
          navigate(`/${owner}/${repo}/pulls/${data.number}`);
        },
      },
    );
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitPullRequest className="h-5 w-5" />
          New pull request
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source branch</Label>
              <Select value={sourceBranch} onValueChange={setSourceBranch}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target branch</Label>
              <Select value={targetBranch} onValueChange={setTargetBranch}>
                <SelectTrigger id="target">
                  <SelectValue placeholder="Select target branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pull request title" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your changes..." rows={6} />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" disabled={createMutation.isPending || !title.trim() || !sourceBranch || !targetBranch || sourceBranch === targetBranch}>
              Create pull request
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
          {sourceBranch && targetBranch && sourceBranch === targetBranch && (
            <p className="text-sm text-error">Source and target branches must be different.</p>
          )}
          {createMutation.isError && (
            <Alert variant="error">
              {(createMutation.error as Error)?.message ?? 'Failed to create pull request'}
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
