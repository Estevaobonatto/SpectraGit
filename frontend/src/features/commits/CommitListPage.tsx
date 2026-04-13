import { useState } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import { GitCommit } from 'lucide-react';
import { useCommitsPaginated } from '@/hooks/useBranches';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { formatRelativeTime } from '@/lib/utils';
import { motion } from 'motion/react';
import type { Repository } from '@/types';

const PAGE_SIZE = 30;

export default function CommitListPage() {
  const { owner, repo } = useParams();
  const { repository } = useOutletContext<{ repository: Repository }>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCommitsPaginated(owner!, repo!, {
    branch: repository.defaultBranch,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const commits = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (isLoading) return <PageLoader />;

  if (!data || commits.length === 0) {
    return <EmptyState icon={GitCommit} title="No commits yet" description="Push your first commit to see it here." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Commits</h2>
        {total > 0 && (
          <span className="text-sm text-text-tertiary">
            {total} commit{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
        {commits.map((commit, index) => (
          <motion.div
            key={commit.sha}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex items-start gap-3 p-4">
            <Avatar src={commit.authorAvatarUrl} alt={commit.authorName} size="sm" />
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
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => {
          setPage(p);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
