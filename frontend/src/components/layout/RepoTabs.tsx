import { Link, useLocation, useParams } from 'react-router-dom';
import { Code2, CircleDot, GitPullRequest, GitCommit, GitBranch, Tag, Package, Activity, Users, Settings } from 'lucide-react';
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
    <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          to={basePath + tab.path}
          className={cn(
            'relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors -mb-px',
            isActive(tab.path)
              ? 'text-primary-600'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
          {isActive(tab.path) && (
            <motion.div
              layoutId="repo-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </Link>
      ))}
    </div>
  );
}
