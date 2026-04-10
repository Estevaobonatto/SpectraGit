import { Link, useParams, useOutletContext } from 'react-router-dom';
import { GitCommit } from 'lucide-react';
import { useCommits } from '@/hooks/useBranches';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { formatRelativeTime } from '@/lib/utils';
import { motion } from 'motion/react';
import type { Repository } from '@/types';

export default function CommitListPage() {
  const { owner, repo } = useParams();
  const { repository } = useOutletContext<{ repository: Repository }>();
  const { data: commits, isLoading } = useCommits(owner!, repo!, { branch: repository.defaultBranch });

  if (isLoading) return <PageLoader />;

  if (!commits || commits.length === 0) {
    return <EmptyState icon={GitCommit} title="No commits yet" description="Push your first commit to see it here." />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Commits</h2>
      <div className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
        {commits.map((commit, index) => (
          <motion.div
            key={commit.sha}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex items-start gap-3 p-4">
            <Avatar alt={commit.authorName} size="sm" />
            <div className="flex-1 min-w-0">
              <Link
                to={`/${owner}/${repo}/commits/${commit.sha}`}
                className="font-medium text-text-primary hover:text-primary-600 line-clamp-1"
              >
                {commit.message}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
                <span className="font-medium text-text-secondary">{commit.authorName}</span>
                <span>committed {formatRelativeTime(commit.date)}</span>
              </div>
            </div>
            <Link
              to={`/${owner}/${repo}/commits/${commit.sha}`}
              className="shrink-0 rounded bg-background px-2 py-1 font-mono text-xs text-text-secondary hover:text-primary-500 border border-border"
            >
              {commit.sha.slice(0, 7)}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
