import { Link, useLocation, useParams } from 'react-router-dom';
import { Code2, CircleDot, GitPullRequest, GitCommit, GitBranch, Tag, Package, Activity, Users, Settings, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Code', icon: Code2, path: '' },
  { label: 'Issues', icon: CircleDot, path: '/issues' },
  { label: 'Pull Requests', icon: GitPullRequest, path: '/pulls' },
  { label: 'Commits', icon: GitCommit, path: '/commits' },
  { label: 'Branches', icon: GitBranch, path: '/branches' },
  { label: 'Tags', icon: Tag, path: '/tags' },
  { label: 'Releases', icon: Package, path: '/releases' },
  { label: 'Wiki', icon: BookOpen, path: '/wiki' },
  { label: 'Activity', icon: Activity, path: '/activity' },
  { label: 'Collaborators', icon: Users, path: '/collaborators' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function RepoTabs() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const location = useLocation();
  const basePath = `/${owner}/${repo}`;

  const isActive = (tabPath: string) => {
    const fullPath = basePath + tabPath;
    if (tabPath === '') {
      return location.pathname === basePath || location.pathname === basePath + '/';
    }
    return location.pathname.startsWith(fullPath);
  };

  return (
    <nav className="flex flex-col gap-0.5">
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <Link
            key={tab.path}
            to={basePath + tab.path}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              active
                ? 'text-primary-700'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
            )}
          >
            {active && (
              <motion.div
                layoutId="repo-nav-indicator"
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary-500"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <tab.icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                active ? 'text-primary-600' : 'text-text-tertiary group-hover:text-text-secondary',
              )}
            />
            <span className="truncate">{tab.label}</span>
            {active && (
              <motion.div
                layoutId="repo-nav-bg"
                className="absolute inset-0 rounded-lg bg-primary-50 -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
