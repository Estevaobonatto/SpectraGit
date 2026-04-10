import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  GitBranch,
  Tag,
  MessageSquare,
  GitPullRequest,
  Globe,
  FolderGit2,
  Milestone,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { integrationsService } from '@/services/integrations.service';
import type { ImportJobStatus, ImportJobStatusResponse } from '@/types';

interface ImportProgressModalProps {
  open: boolean;
  jobId: string | null;
  repositorySlug: string;
  ownerUsername: string;
  onClose: () => void;
  onRetry: () => void;
}

const IMPORT_STEPS: { status: ImportJobStatus; label: string; icon: React.ElementType }[] = [
  { status: 'PENDING', label: 'Connecting to GitHub', icon: Globe },
  { status: 'CLONING', label: 'Cloning repository', icon: FolderGit2 },
  { status: 'SEEDING_BRANCHES', label: 'Importing branches', icon: GitBranch },
  { status: 'IMPORTING_LABELS', label: 'Importing labels', icon: Tag },
  { status: 'IMPORTING_MILESTONES', label: 'Importing milestones', icon: Milestone },
  { status: 'IMPORTING_ISSUES', label: 'Importing issues', icon: MessageSquare },
  { status: 'IMPORTING_PRS', label: 'Importing pull requests', icon: GitPullRequest },
  { status: 'IMPORTING_TAGS', label: 'Importing tags', icon: Tag },
];

const STATUS_ORDER: ImportJobStatus[] = [
  'PENDING',
  'CLONING',
  'SEEDING_BRANCHES',
  'IMPORTING_LABELS',
  'IMPORTING_MILESTONES',
  'IMPORTING_ISSUES',
  'IMPORTING_PRS',
  'IMPORTING_TAGS',
  'COMPLETED',
];

function getStepState(
  stepStatus: ImportJobStatus,
  currentStatus: ImportJobStatus,
): 'done' | 'active' | 'pending' {
  const stepIdx = STATUS_ORDER.indexOf(stepStatus);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  if (currentStatus === 'FAILED') {
    // All steps up to current are done; current step is failed (handled separately)
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  }
  if (currentStatus === 'COMPLETED') return 'done';
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

export default function ImportProgressModal({
  open,
  jobId,
  repositorySlug,
  ownerUsername,
  onClose,
  onRetry,
}: ImportProgressModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: jobStatus } = useQuery<ImportJobStatusResponse>({
    queryKey: ['import-status', jobId],
    queryFn: () => integrationsService.getImportStatus(jobId!),
    enabled: !!jobId && open,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED') return false;
      return 2000;
    },
  });

  const isCompleted = jobStatus?.status === 'COMPLETED';
  const isFailed = jobStatus?.status === 'FAILED';
  const isActive = !isCompleted && !isFailed;

  // Auto-redirect after completion
  useEffect(() => {
    if (isCompleted && ownerUsername && repositorySlug) {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      redirectTimerRef.current = setTimeout(() => {
        navigate(`/${ownerUsername}/${repositorySlug}`);
      }, 3000);
    }
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [isCompleted, ownerUsername, repositorySlug, navigate, queryClient]);

  const handleViewRepo = () => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    navigate(`/${ownerUsername}/${repositorySlug}`);
  };

  const progress = jobStatus?.progress ?? 0;
  const currentStatus = jobStatus?.status ?? 'PENDING';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isActive) onClose(); }}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => { if (isActive) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (isActive) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCompleted ? (
              <><CheckCircle2 className="h-5 w-5 text-success" /> Import Complete</>
            ) : isFailed ? (
              <><XCircle className="h-5 w-5 text-destructive" /> Import Failed</>
            ) : (
              <><Loader2 className="h-5 w-5 animate-spin text-accent" /> Importing Repository</>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCompleted
              ? 'Your repository has been fully imported with all data.'
              : isFailed
                ? jobStatus?.error ?? 'An error occurred during import.'
                : jobStatus?.currentStep ?? 'Preparing import...'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="my-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>{jobStatus?.currentStep ?? 'Waiting...'}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Step list */}
        <div className="space-y-1">
          {IMPORT_STEPS.map((step, idx) => {
            const state = getStepState(step.status, currentStatus as ImportJobStatus);
            const Icon = step.icon;

            return (
              <motion.div
                key={step.status}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                className="flex items-center gap-3 py-1.5 px-2 rounded-[var(--radius-sm)]"
              >
                {state === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : state === 'active' ? (
                  isFailed ? (
                    <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                  ) : (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
                  )
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-text-tertiary/40" />
                )}
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    state === 'done'
                      ? 'text-success'
                      : state === 'active'
                        ? isFailed ? 'text-destructive' : 'text-accent'
                        : 'text-text-tertiary/40'
                  }`}
                />
                <span
                  className={`text-sm ${
                    state === 'done'
                      ? 'text-text-secondary'
                      : state === 'active'
                        ? 'text-text-primary font-medium'
                        : 'text-text-tertiary/60'
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        <DialogFooter className="mt-4">
          <AnimatePresence mode="wait">
            {isCompleted && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full flex-col gap-2"
              >
                <p className="text-xs text-text-tertiary text-center">
                  Redirecting to repository in 3 seconds...
                </p>
                <Button onClick={handleViewRepo} className="w-full">
                  View Repository
                </Button>
              </motion.div>
            )}
            {isFailed && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full gap-2"
              >
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
                <Button onClick={onRetry} className="flex-1">
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
