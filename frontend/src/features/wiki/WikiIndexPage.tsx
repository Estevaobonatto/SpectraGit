import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { Plus, FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWikiPages } from '@/hooks/useWiki';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import type { Repository, WikiPage } from '@/types';

export default function WikiIndexPage() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { repository } = useOutletContext<{ repository: Repository }>();
  const navigate = useNavigate();

  const { data: pages, isLoading, error } = useWikiPages(owner!, repo!);

  if (!repository.hasWikiEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-12 w-12 text-text-tertiary mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">Wiki is not enabled</h2>
        <p className="text-sm text-text-secondary mb-4">
          Enable the wiki in repository settings to start creating documentation.
        </p>
        {repository.canEdit && (
          <Button variant="outline" onClick={() => navigate(`/${owner}/${repo}/settings`)}>
            Go to Settings
          </Button>
        )}
      </div>
    );
  }

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <Alert variant="error" title="Failed to load wiki">
        Could not load wiki pages. Please try again later.
      </Alert>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-12 w-12 text-text-tertiary mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">Welcome to the Wiki</h2>
        <p className="text-sm text-text-secondary mb-4">
          No pages yet. Create the first page to get started.
        </p>
        <Button onClick={() => navigate(`/${owner}/${repo}/wiki/new`)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create First Page
        </Button>
      </div>
    );
  }

  // Build tree: root pages and their children
  const rootPages = pages.filter((p: WikiPage) => !p.parentId);
  const childMap = new Map<string, WikiPage[]>();
  pages.forEach((p: WikiPage) => {
    if (p.parentId) {
      const children = childMap.get(p.parentId) || [];
      children.push(p);
      childMap.set(p.parentId, children);
    }
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Wiki</h1>
        <Button size="sm" onClick={() => navigate(`/${owner}/${repo}/wiki/new`)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Page
        </Button>
      </div>

      {/* Page List */}
      <div className="rounded-[var(--radius-md)] border border-border divide-y divide-border">
        {rootPages.map((page: WikiPage) => (
          <div key={page.id}>
            <PageRow page={page} owner={owner!} repo={repo!} />
            {childMap.get(page.id)?.map((child) => (
              <PageRow key={child.id} page={child} owner={owner!} repo={repo!} indent />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PageRow({ page, owner, repo, indent }: { page: WikiPage; owner: string; repo: string; indent?: boolean }) {
  return (
    <Link
      to={`/${owner}/${repo}/wiki/${page.slug}`}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-hover/50 transition-colors ${indent ? 'pl-10' : ''}`}
    >
      <FileText className="h-4 w-4 text-text-tertiary flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">{page.title}</p>
        {page.updatedBy && (
          <p className="text-xs text-text-tertiary mt-0.5">
            Last edited by {page.updatedBy.username ?? page.updatedBy.displayName}
          </p>
        )}
      </div>
    </Link>
  );
}
