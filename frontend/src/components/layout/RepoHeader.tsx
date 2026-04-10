import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GitFork, Zap, Lock, Globe, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

// Bolt particle spawned on pulse activation
interface Bolt { id: number; angle: number; dist: number; size: number }

function PulseBurst({ trigger }: { trigger: number }) {
  const bolts: Bolt[] = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: (360 / 8) * i + Math.random() * 20 - 10,
    dist: 22 + Math.random() * 10,
    size: 8 + Math.random() * 5,
  }));

  return (
    <AnimatePresence>
      {trigger > 0 &&
        bolts.map((b) => {
          const rad = (b.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * b.dist;
          const ty = Math.sin(rad) * b.dist;
          return (
            <motion.span
              key={`${trigger}-${b.id}`}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{ opacity: 0, x: tx, y: ty, scale: 0.3 }}
              exit={{}}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <Zap
                style={{ width: b.size, height: b.size }}
                className="fill-yellow-400 text-yellow-400"
              />
            </motion.span>
          );
        })}
    </AnimatePresence>
  );
}

interface RepoHeaderProps {
  repo: Repository;
  className?: string;
}

export function RepoHeader({ repo, className }: RepoHeaderProps) {
  const { owner } = useParams<{ owner: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const [forkName, setForkName] = useState(repo.name);
  const [pulseBurst, setPulseBurst] = useState(0);

  const pulseMutation = usePulseRepository(owner!, repo.slug);
  const watchMutation = useWatchRepository(owner!, repo.slug);
  const forkMutation = useForkRepository(owner!, repo.slug);

  // Reset fork form + mutation state whenever the dialog is opened/closed
  useEffect(() => {
    if (forkDialogOpen) {
      setForkName(repo.name);
      forkMutation.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forkDialogOpen]);

  // Subscribe reactively to the cache so optimistic updates trigger a re-render
  const { data: live } = useRepository(owner!, repo.slug);
  const isPulsed = live?.isPulsed ?? repo.isPulsed;
  const isWatched = live?.isWatched ?? repo.isWatched;
  const pulseCount = live?.pulseCount ?? repo.pulseCount;
  const watchCount = live?.watchCount ?? repo.watchCount;
  const forkCount = live?.forkCount ?? repo.forkCount;

  const isOwnRepo = !!user && owner === user.username;

  const handlePulse = () => {
    if (!isAuthenticated) return navigate('/login');
    const wasActive = !!isPulsed;
    pulseMutation.mutate(wasActive);
    // Fire burst only when activating (not removing) pulse
    if (!wasActive) setPulseBurst((n) => n + 1);
  };

  const handleWatch = () => {
    if (!isAuthenticated) return navigate('/login');
    watchMutation.mutate(!!isWatched);
  };

  const handleForkOpen = () => {
    if (!isAuthenticated) return navigate('/login');
    setForkDialogOpen(true);
  };

  const handleForkDialogChange = (open: boolean) => {
    // Prevent closing while fork is in progress
    if (forkMutation.isPending) return;
    setForkDialogOpen(open);
  };

  const forkNameSlug = forkName.toLowerCase().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');

  const handleForkConfirm = () => {
    forkMutation.mutate(forkNameSlug !== repo.name.toLowerCase().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') ? forkNameSlug : undefined, {
      onSuccess: (forkedRepo) => {
        setForkDialogOpen(false);
        navigate(`/${user?.username}/${forkedRepo.slug}`);
      },
    });
  };

  const forkError = forkMutation.error
    ? (forkMutation.error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
      ?? (forkMutation.error as { message?: string })?.message
      ?? 'An unexpected error occurred. Please try again.'
    : null;

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
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="relative">
          <PulseBurst trigger={pulseBurst} />
          <Button
            variant="outline"
            size="sm"
            className={cn('relative gap-1.5 overflow-visible', isPulsed && 'border-yellow-500/40 bg-yellow-500/10')}
            onClick={handlePulse}
            disabled={pulseMutation.isPending}
          >
            <motion.span
              animate={isPulsed ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="flex items-center"
            >
              <Zap
                className={cn(
                  'h-3.5 w-3.5 transition-colors',
                  isPulsed ? 'fill-yellow-500 text-yellow-500' : 'text-text-secondary',
                )}
              />
            </motion.span>
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
            onClick={handleForkOpen}
            disabled={forkMutation.isPending || isOwnRepo}
            title={isOwnRepo ? 'You cannot fork your own repository' : undefined}
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
      <Dialog open={forkDialogOpen} onOpenChange={handleForkDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fork repository</DialogTitle>
            <DialogDescription>
              Create a copy of <strong>{owner}/{repo.name}</strong> under your account{' '}
              <strong>{user?.username}</strong>. All branches and history will be included.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5 py-2">
            <Label htmlFor="fork-name">Repository name</Label>
            <Input
              id="fork-name"
              value={forkName}
              onChange={(e) => {
                setForkName(e.target.value);
                if (forkMutation.isError) forkMutation.reset();
              }}
              disabled={forkMutation.isPending}
              placeholder={repo.name}
            />
            {forkName && forkNameSlug !== forkName && (
              <p className="text-xs text-text-tertiary">
                Will be saved as: <span className="font-mono">{forkNameSlug}</span>
              </p>
            )}
          </div>

          {forkError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{forkError}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setForkDialogOpen(false)}
              disabled={forkMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleForkConfirm}
              disabled={forkMutation.isPending || !forkName.trim()}
            >
              {forkMutation.isPending ? 'Forking...' : 'Fork repository'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
