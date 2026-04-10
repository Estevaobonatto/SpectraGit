import { Link, useLocation, useParams } from 'react-router-dom';
import { Code2, CircleDot, GitPullRequest, GitCommit, GitBranch, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Code', icon: Code2, path: '' },
  { label: 'Issues', icon: CircleDot, path: '/issues' },
  { label: 'Pull Requests', icon: GitPullRequest, path: '/pulls' },
  { label: 'Commits', icon: GitCommit, path: '/commits' },
  { label: 'Branches', icon: GitBranch, path: '/branches' },
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
            'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors -mb-px',
            isActive(tab.path)
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong',
          )}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
