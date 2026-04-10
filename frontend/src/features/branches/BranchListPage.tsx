import { useState } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import { GitBranch, Trash2, Shield, Plus } from 'lucide-react';
import { useBranches, useCreateBranch, useDeleteBranch } from '@/hooks/useBranches';
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
import { motion } from 'motion/react';
import type { Repository } from '@/types';

export default function BranchListPage() {
  const { owner, repo } = useParams();
  const { repository } = useOutletContext<{ repository: Repository }>();
  const { data: branches, isLoading } = useBranches(owner!, repo!);
  const createBranch = useCreateBranch(owner!, repo!);
  const deleteBranch = useDeleteBranch(owner!, repo!);

  const [newBranchName, setNewBranchName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newBranchName.trim()) return;
    createBranch.mutate(
      { name: newBranchName, startPoint: repository.defaultBranch },
      {
        onSuccess: () => {
          setNewBranchName('');
          setDialogOpen(false);
        },
        onError: (err) => {
          setCreateError((err as Error)?.message ?? 'Failed to create branch');
        },
      },
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Branches</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setCreateError(null); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new branch</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="space-y-2">
                <Label>Branch name</Label>
                <Input
                  value={newBranchName}
                  onChange={(e) => { setNewBranchName(e.target.value); setCreateError(null); }}
                  placeholder="feature/my-branch"
                />
              </div>
              <p className="text-xs text-text-tertiary">
                Branch will be created from <strong>{repository.defaultBranch}</strong>
              </p>
              {createError && (
                <Alert variant="error">{createError}</Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newBranchName.trim() || createBranch.isPending}>
                {createBranch.isPending ? 'Creating...' : 'Create branch'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {(!branches || branches.length === 0) ? (
        <EmptyState icon={GitBranch} title="No branches" />
      ) : (
        <div className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
          {branches.map((branch, index) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-text-tertiary" />
                <Link
                  to={`/${owner}/${repo}/tree/${branch.name}`}
                  className="font-medium text-primary-600 hover:underline"
                >
                  {branch.name}
                </Link>
                {branch.name === repository.defaultBranch && (
                  <Badge variant="default" className="text-[10px]">default</Badge>
                )}
                {branch.isProtected && (
                  <Badge variant="warning" className="text-[10px]">
                    <Shield className="mr-0.5 h-2.5 w-2.5" /> protected
                  </Badge>
                )}
              </div>
              {branch.name !== repository.defaultBranch && !branch.isProtected && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-text-tertiary hover:text-error"
                  onClick={() => deleteBranch.mutate(branch.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
