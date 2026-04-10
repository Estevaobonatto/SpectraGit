import { useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { Tag as TagIcon, Trash2, Plus, Package, GitCommit } from 'lucide-react';
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/useTags';
import { useCommits } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { motion } from 'motion/react';
import type { Repository } from '@/types';

export default function TagListPage() {
  const { owner, repo } = useParams();
  const { repository } = useOutletContext<{ repository: Repository }>();
  const { data: tags, isLoading } = useTags(owner!, repo!);
  const createTag = useCreateTag(owner!, repo!);
  const deleteTag = useDeleteTag(owner!, repo!);

  const { data: commits } = useCommits(owner!, repo!, { limit: 50 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [commitSelectValue, setCommitSelectValue] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [message, setMessage] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCommitSelect = (value: string) => {
    setCommitSelectValue(value);
    if (value === '__manual__') {
      setManualMode(true);
      setCommitSha('');
    } else {
      setManualMode(false);
      setCommitSha(value);
    }
  };

  const handleCreate = () => {
    if (!tagName.trim() || !commitSha.trim()) return;
    createTag.mutate(
      { name: tagName, commitSha, message: message || undefined },
      {
        onSuccess: () => {
          setTagName('');
          setCommitSha('');
          setCommitSelectValue('');
          setManualMode(false);
          setMessage('');
          setDialogOpen(false);
          setCreateError(null);
        },
        onError: (err) => {
          setCreateError((err as Error)?.message ?? 'Failed to create tag');
        },
      },
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tags</h2>
        {repository.canEdit && <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setCreateError(null); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="space-y-2">
                <Label>Tag name</Label>
                <Input
                  value={tagName}
                  onChange={(e) => { setTagName(e.target.value); setCreateError(null); }}
                  placeholder="v1.0.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Commit SHA</Label>
                <Select value={commitSelectValue} onValueChange={handleCommitSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recent commit…" />
                  </SelectTrigger>
                  <SelectContent>
                    {commits?.map((c) => (
                      <SelectItem key={c.sha} value={c.sha}>
                        <span className="flex items-center gap-2">
                          <GitCommit className="h-3 w-3 shrink-0 text-text-tertiary" />
                          <code className="font-mono text-xs">{c.sha.substring(0, 7)}</code>
                          <span className="text-text-secondary truncate max-w-[280px]">
                            {c.message.split('\n')[0].substring(0, 72)}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value="__manual__">
                      <span className="text-text-tertiary italic text-xs">Enter SHA manually…</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {manualMode && (
                  <Input
                    value={commitSha}
                    onChange={(e) => setCommitSha(e.target.value)}
                    placeholder="Full or short commit SHA"
                    className="font-mono text-xs"
                    autoFocus
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Message <span className="text-text-tertiary">(optional, creates annotated tag)</span></Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Release description..."
                  rows={3}
                />
              </div>
              {createError && (
                <Alert variant="error">{createError}</Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!tagName.trim() || !commitSha.trim() || createTag.isPending}>
                {createTag.isPending ? 'Creating...' : 'Create tag'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>}
      </div>

      {(!tags || tags.length === 0) ? (
        <EmptyState icon={TagIcon} title="No tags" description="Tags mark specific points in your repository's history" />
      ) : (
        <div className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
          {tags.map((tag, index) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <TagIcon className="h-4 w-4 text-text-tertiary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary-600">{tag.name}</span>
                    {tag.release && (
                      <Badge variant="default" className="text-[10px]">
                        <Package className="mr-0.5 h-2.5 w-2.5" />
                        {tag.release.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs text-text-tertiary">{tag.commitSha.substring(0, 7)}</code>
                    {tag.message && (
                      <span className="text-xs text-text-secondary truncate max-w-[400px]">{tag.message}</span>
                    )}
                  </div>
                </div>
              </div>
              {repository.canEdit && <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-text-tertiary hover:text-error"
                onClick={() => deleteTag.mutate(tag.name)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
