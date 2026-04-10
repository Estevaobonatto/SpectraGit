import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GitFork, Zap, Lock, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePulseRepository, useWatchRepository, useForkRepository, useRepository } from '@/hooks/useRepositories';
import { useAuthStore } from '@/stores/auth.store';
import type { Repository } from '@/types';

interface RepoHeaderProps {
  repo: Repository;
  className?: string;
}

export function RepoHeader({ repo, className }: RepoHeaderProps) {
  const { owner } = useParams<{ owner: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [forkDialogOpen, setForkDialogOpen] = useState(false);

  const pulseMutation = usePulseRepository(owner!, repo.slug);
  const watchMutation = useWatchRepository(owner!, repo.slug);
  const forkMutation = useForkRepository(owner!, repo.slug);

  // Subscribe reactively to the cache so optimistic updates trigger a re-render
  const { data: live } = useRepository(owner!, repo.slug);
  const isPulsed = live?.isPulsed ?? repo.isPulsed;
  const isWatched = live?.isWatched ?? repo.isWatched;
  const pulseCount = live?.pulseCount ?? repo.pulseCount;
  const watchCount = live?.watchCount ?? repo.watchCount;
  const forkCount = live?.forkCount ?? repo.forkCount;

  const handlePulse = () => {
    if (!isAuthenticated) return navigate('/login');
    pulseMutation.mutate(!!isPulsed);
  };

  const handleWatch = () => {
    if (!isAuthenticated) return navigate('/login');
    watchMutation.mutate(!!isWatched);
  };

  const handleForkConfirm = () => {
    forkMutation.mutate(undefined, {
      onSuccess: (forkedRepo) => {
        setForkDialogOpen(false);
        navigate(`/${user?.username}/${forkedRepo.slug}`);
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn('flex flex-col gap-3 pb-4', className)}
    >
      <div className="flex items-center gap-2 text-lg">
        <Link to={`/${owner}`} className="font-medium text-primary-500 hover:underline">
          {owner}
        </Link>
        <span className="text-text-tertiary">/</span>
        <Link to={`/${owner}/${repo.slug}`} className="font-bold text-text-primary hover:underline">
          {repo.name}
        </Link>
        <Badge variant={repo.visibility === 'PUBLIC' ? 'outline' : 'secondary'} className="ml-2">
          {repo.visibility === 'PUBLIC' ? (
            <><Globe className="mr-1 h-3 w-3" /> Public</>
          ) : (
            <><Lock className="mr-1 h-3 w-3" /> Private</>
          )}
        </Badge>
      </div>

      {repo.description && (
        <p className="text-sm text-text-secondary">{repo.description}</p>
      )}

      <div className="flex items-center gap-3">
        {/* Pulse Button */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="outline"
            size="sm"
            className={cn('gap-1.5', isPulsed && 'border-yellow-500/40 bg-yellow-500/10')}
            onClick={handlePulse}
            disabled={pulseMutation.isPending}
          >
            <Zap
              className={cn(
                'h-3.5 w-3.5 transition-colors',
                isPulsed ? 'fill-yellow-500 text-yellow-500' : 'text-text-secondary',
              )}
            />
            Pulse
            {pulseCount !== undefined && (
              <span className="ml-1 text-text-secondary">{pulseCount}</span>
            )}
          </Button>
        </motion.div>

        {/* Fork Button */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              if (!isAuthenticated) return navigate('/login');
              setForkDialogOpen(true);
            }}
            disabled={forkMutation.isPending}
          >
            <GitFork className="h-3.5 w-3.5" />
            Fork
            {forkCount !== undefined && (
              <span className="ml-1 text-text-secondary">{forkCount}</span>
            )}
          </Button>
        </motion.div>

        {/* Watch Button */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="outline"
            size="sm"
            className={cn('gap-1.5', isWatched && 'border-primary-500/40 bg-primary-500/10')}
            onClick={handleWatch}
            disabled={watchMutation.isPending}
          >
            {isWatched ? (
              <Eye className="h-3.5 w-3.5 text-primary-500" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-text-secondary" />
            )}
            {isWatched ? 'Watching' : 'Watch'}
            {watchCount !== undefined && (
              <span className="ml-1 text-text-secondary">{watchCount}</span>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Fork Confirmation Dialog */}
      <Dialog open={forkDialogOpen} onOpenChange={setForkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fork repository</DialogTitle>
            <DialogDescription>
              Create a copy of <strong>{owner}/{repo.name}</strong> under your account{' '}
              <strong>{user?.username}</strong>. All branches and history will be included.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleForkConfirm} disabled={forkMutation.isPending}>
              {forkMutation.isPending ? 'Forking...' : 'Fork repository'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
