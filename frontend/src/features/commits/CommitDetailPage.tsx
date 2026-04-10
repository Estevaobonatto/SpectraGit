import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCommitDetail, useCommitDiff } from '@/hooks/useBranches';
import { DiffViewer } from '@/components/repo/DiffViewer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { formatDate } from '@/lib/utils';
import { motion } from 'motion/react';

export default function CommitDetailPage() {
  const { owner, repo, sha } = useParams();
  const { data: commit, isLoading, error } = useCommitDetail(owner!, repo!, sha!);
  const { data: diffFiles, isLoading: isDiffLoading } = useCommitDiff(owner!, repo!, sha!);

  if (isLoading) return <PageLoader />;
  if (error || !commit) return <Alert variant="error" title="Commit not found">Could not load commit details.</Alert>;

  const totalAdditions = diffFiles?.reduce((a, f) => a + f.additions, 0) ?? 0;
  const totalDeletions = diffFiles?.reduce((a, f) => a + f.deletions, 0) ?? 0;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5" asChild>
          <Link to={`/${owner}/${repo}/commits`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold leading-tight">{commit.message}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-text-secondary">
            <Avatar alt={commit.authorName} size="sm" />
            <span className="font-medium">{commit.authorName}</span>
            <span>committed on {formatDate(commit.date)}</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs">{sha?.slice(0, 7)}</Badge>
            <span className="text-xs text-text-tertiary">
              {isDiffLoading ? '…' : `${diffFiles?.length ?? 0} files changed`}
            </span>
            <span className="text-xs text-success">+{totalAdditions}</span>
            <span className="text-xs text-error">-{totalDeletions}</span>
          </div>
        </div>
      </div>

      {isDiffLoading && (
        <div className="text-sm text-text-secondary animate-pulse px-1">Loading diff…</div>
      )}

      {!isDiffLoading && diffFiles && diffFiles.length > 0 && (
        <DiffViewer files={diffFiles} />
      )}

      {!isDiffLoading && diffFiles && diffFiles.length === 0 && (
        <p className="text-sm text-text-tertiary px-1">No file changes in this commit.</p>
      )}
    </motion.div>
  );
}
