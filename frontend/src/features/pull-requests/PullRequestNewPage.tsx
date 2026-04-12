import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitPullRequest, GitBranch, ArrowRight, FileText, Send } from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';
import { useCreatePullRequest } from '@/hooks/usePullRequests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageLoader } from '@/components/ui/spinner';
import { motion } from 'motion/react';

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
  const sameBranch = sourceBranch && targetBranch && sourceBranch === targetBranch;
  const branchesSelected = !!sourceBranch && !!targetBranch && !sameBranch;
  const isValid = branchesSelected && title.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-success" />
            New pull request
          </CardTitle>
          <CardDescription>
            Compare branches and create a pull request to propose and collaborate on changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Branch selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                  1
                </div>
                <span className="font-semibold text-sm">Choose branches</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="source" className="text-xs text-text-secondary flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    Compare (source)
                  </Label>
                  <Select value={sourceBranch} onValueChange={setSourceBranch}>
                    <SelectTrigger id="source">
                      <SelectValue placeholder="Select branch" />
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
                <ArrowRight className="h-4 w-4 text-text-tertiary mt-5 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="target" className="text-xs text-text-secondary flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    Base (target)
                  </Label>
                  <Select value={targetBranch} onValueChange={setTargetBranch}>
                    <SelectTrigger id="target">
                      <SelectValue placeholder="Select branch" />
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
              {sameBranch && (
                <p className="text-sm text-error flex items-center gap-1.5">
                  Source and target branches must be different.
                </p>
              )}
              {branchesSelected && (
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <span>Merging</span>
                  <Badge variant="secondary" className="font-mono text-[11px] gap-1">
                    <GitBranch className="h-2.5 w-2.5" />
                    {sourceBranch}
                  </Badge>
                  <span>into</span>
                  <Badge variant="secondary" className="font-mono text-[11px] gap-1">
                    <GitBranch className="h-2.5 w-2.5" />
                    {targetBranch}
                  </Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Step 2: Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                  2
                </div>
                <Label htmlFor="title" className="font-semibold">Title *</Label>
              </div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Pull request title"
                required
              />
            </div>

            <Separator />

            {/* Step 3: Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                  3
                </div>
                <Label htmlFor="description" className="font-semibold">Description</Label>
                <span className="text-xs text-text-tertiary">(optional)</span>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your changes, what problem they solve, and any additional context..."
                rows={6}
                className="resize-y"
              />
            </div>

            {createMutation.isError && (
              <Alert variant="error">
                {(createMutation.error as Error)?.message ?? 'Failed to create pull request'}
              </Alert>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-tertiary flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                You can review changes after creating the PR.
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || !isValid} className="gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  {createMutation.isPending ? 'Creating...' : 'Create pull request'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
