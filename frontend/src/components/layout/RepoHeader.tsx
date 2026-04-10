import { Link, useParams } from 'react-router-dom';
import { Eye, GitFork, Star, Lock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Repository } from '@/types';

interface RepoHeaderProps {
  repo: Repository;
  className?: string;
}

export function RepoHeader({ repo, className }: RepoHeaderProps) {
  const { owner } = useParams<{ owner: string }>();

  return (
    <div className={cn('flex flex-col gap-3 pb-4', className)}>
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
        <Button variant="outline" size="sm" className="gap-1.5">
          <Star className="h-3.5 w-3.5" />
          Star
          {repo.starCount !== undefined && (
            <span className="ml-1 text-text-secondary">{repo.starCount}</span>
          )}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <GitFork className="h-3.5 w-3.5" />
          Fork
          {repo.forkCount !== undefined && (
            <span className="ml-1 text-text-secondary">{repo.forkCount}</span>
          )}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          Watch
        </Button>
      </div>
    </div>
  );
}
