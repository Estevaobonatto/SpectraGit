import { Link } from 'react-router-dom';
import { CircleDot, ExternalLink, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';

interface SimilarIssue {
  id: string;
  number: number;
  title: string;
  status: string;
  score: number;
}

interface DuplicateDetectionPanelProps {
  issues: SimilarIssue[];
  isLoading: boolean;
  owner: string;
  repo: string;
}

export function DuplicateDetectionPanel({ issues, isLoading, owner, repo }: DuplicateDetectionPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50/50 p-3">
        <div className="flex items-center gap-2 text-sm text-amber-700">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
          Checking for similar issues...
        </div>
      </div>
    );
  }

  if (!issues || issues.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50/50 p-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <AlertTriangle className="h-4 w-4" />
        Similar issues found — is yours already reported?
      </div>

      <AnimatePresence>
        {issues.map((issue, i) => (
          <motion.div
            key={issue.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={`/${owner}/${repo}/issues/${issue.number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-amber-200/60 bg-white/60 px-3 py-2 text-sm transition-colors hover:bg-white group"
            >
              <CircleDot className={`h-3.5 w-3.5 shrink-0 ${issue.status === 'OPEN' ? 'text-emerald-500' : 'text-primary-500'}`} />
              <span className="flex-1 truncate font-medium text-text-primary group-hover:text-primary-600">
                #{issue.number} {issue.title}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
                {Math.round(issue.score * 100)}% match
              </Badge>
              <ExternalLink className="h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>

      <p className="text-xs text-amber-700/70">
        If your issue is already listed above, consider commenting on the existing issue instead.
      </p>
    </motion.div>
  );
}
